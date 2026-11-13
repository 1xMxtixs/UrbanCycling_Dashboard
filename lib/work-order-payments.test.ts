import assert from "node:assert/strict"
import { test } from "node:test"
import type { Prisma } from "@/generated/prisma"
import {
  leerMontoAbono,
  registrarAbonoOrdenTrabajo,
  validarMontoAbono,
} from "./work-order-payments"
import { sumarPagosCompletados } from "./payment-summary"

test("monto canónico y alias aceptan el mismo importe sin cobrar el saldo por omisión", () => {
  for (const field of ["montoPago", "monto_pagado", "montoPagado", "monto"])
    assert.equal(leerMontoAbono({ [field]: 10000 }), 10000)
  assert.equal(
    leerMontoAbono({ montoPago: 10000, monto_pagado: "10000" }),
    10000
  )
  assert.equal(leerMontoAbono({}), undefined)
  assert.throws(() => validarMontoAbono(leerMontoAbono({})), {
    code: "MONTO_PAGO_INVALIDO",
  })
  assert.throws(() => leerMontoAbono({ montoPago: 10000, monto: 20000 }), {
    code: "MONTOS_PAGO_INCONSISTENTES",
  })
})

test("rechaza montos no enteros, vacíos, no numéricos o fuera de rango", () => {
  for (const value of [
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    undefined,
    null,
    "",
    " ",
    "1.5",
    "1e3",
    true,
    {},
    [],
    1000000000000,
  ]) {
    assert.throws(() => validarMontoAbono(value), {
      code: "MONTO_PAGO_INVALIDO",
    })
  }
  assert.equal(validarMontoAbono(" 10000 "), 10000)
  assert.equal(validarMontoAbono(999999999999), 999999999999)
})

test("el saldo solo considera el monto asignado de pagos completados", () => {
  assert.equal(
    sumarPagosCompletados([
      { montoAsociado: "20000", pago: { estado: "COMPLETADO" } },
      ...["PENDIENTE", "FALLIDO", "ANULADO", "REEMBOLSADO"].map((estado) => ({
        montoAsociado: 100000,
        pago: { estado },
      })),
      { montoAsociado: 50000 },
    ]),
    20000
  )
})

type Payment = {
  idPago: number
  estado: string
  metodoPago: string
  monto: number
  idUsuario: number
}
type Assignment = { idPago: number; montoAsociado: number; tipoAbono: string }

// Adaptador en memoria: simula la transacción y el bloqueo de la ODT sin tocar la BD.
function scenario(
  options: {
    initial?: number
    estado?: string
    inactiveMethod?: boolean
    missingOrder?: boolean
    fail?: "assignment" | "audit"
  } = {}
) {
  let payments: Payment[] = options.initial
    ? [
        {
          idPago: 1,
          estado: "COMPLETADO",
          metodoPago: "EFECTIVO",
          monto: options.initial,
          idUsuario: 1,
        },
      ]
    : []
  let assignments: Assignment[] = options.initial
    ? [{ idPago: 1, montoAsociado: options.initial, tipoAbono: "abono" }]
    : []
  let estadoPago = options.initial ? "PARCIAL" : "PENDIENTE"
  let audits: unknown[] = []
  let tail = Promise.resolve()
  async function pay(montoPago: unknown, metodoPago = "TRANSFERENCIA") {
    let release: (() => void) | undefined
    let snapshot:
      | {
          payments: Payment[]
          assignments: Assignment[]
          estadoPago: string
          audits: unknown[]
        }
      | undefined
    const tx = {
      $queryRaw: async () => {
        const previous = tail
        tail = new Promise<void>((resolve) => {
          release = resolve
        })
        await previous
        snapshot = structuredClone({
          payments,
          assignments,
          estadoPago,
          audits,
        })
        return []
      },
      ordenDeTrabajo: {
        findUnique: async () => {
          assert.ok(snapshot, "el saldo debe leerse después de bloquear la ODT")
          return options.missingOrder
            ? null
            : {
                idOrdenDeTrabajo: 7,
                estado: options.estado ?? "POR_REALIZAR",
                montoTotal: 50000,
                venta: {
                  idVenta: 5,
                  estadoPago,
                  asignacionesPago: assignments.map((assignment) => ({
                    ...assignment,
                    pago: payments.find(
                      (payment) => payment.idPago === assignment.idPago
                    ),
                  })),
                },
              }
        },
      },
      metodoPago: {
        findUnique: async ({ where }: { where: { codigo: string } }) =>
          ["EFECTIVO", "TRANSFERENCIA", "DEBITO"].includes(where.codigo)
            ? { estado: options.inactiveMethod ? "INACTIVO" : "ACTIVO" }
            : null,
      },
      pago: {
        create: async ({ data }: { data: Omit<Payment, "idPago"> }) => {
          const payment = { ...data, idPago: payments.length + 1 }
          payments.push(payment)
          return payment
        },
      },
      asignacionPago: {
        create: async ({ data }: { data: Assignment }) => {
          if (options.fail === "assignment") throw new Error("falló asignación")
          assignments.push(data)
          return data
        },
      },
      venta: {
        update: async ({ data }: { data: { estadoPago: string } }) => {
          estadoPago = data.estadoPago
          return { estadoPago }
        },
      },
      auditoria: {
        create: async (data: unknown) => {
          if (options.fail === "audit") throw new Error("falló auditoría")
          audits.push(data)
          return data
        },
      },
    }
    try {
      return await registrarAbonoOrdenTrabajo(
        tx as unknown as Prisma.TransactionClient,
        { idOrdenDeTrabajo: 7, idUsuario: 99, metodoPago, montoPago }
      )
    } catch (error) {
      if (snapshot) ({ payments, assignments, estadoPago, audits } = snapshot)
      throw error
    } finally {
      release?.()
    }
  }
  return {
    pay,
    state: () => ({ payments, assignments, estadoPago, audits }),
    setPaymentStatus: (estado: string) => {
      payments[0].estado = estado
    },
  }
}

test("registra varios abonos con métodos diferentes y completa el saldo exacto", async () => {
  const s = scenario()
  const initial = await s.pay(20000, "EFECTIVO")
  assert.deepEqual(initial.resumenPago, {
    total: 50000,
    totalPagado: 20000,
    saldoPendiente: 30000,
    estadoPago: "PARCIAL",
  })
  const partial = await s.pay(10000, "TRANSFERENCIA")
  assert.equal(partial.resumenPago.saldoPendiente, 20000)
  assert.equal(partial.resumenPago.estadoPago, "PARCIAL")
  const final = await s.pay(20000, "DEBITO")
  assert.deepEqual(final.resumenPago, {
    total: 50000,
    totalPagado: 50000,
    saldoPendiente: 0,
    estadoPago: "PAGADA",
  })
  assert.deepEqual(
    s.state().payments.map((payment) => payment.metodoPago),
    ["EFECTIVO", "TRANSFERENCIA", "DEBITO"]
  )
  assert.deepEqual(
    s.state().assignments.map((assignment) => assignment.tipoAbono),
    ["abono", "abono", "pago_total"]
  )
  assert.ok(s.state().payments.every((payment) => payment.idUsuario === 99))
  assert.equal(s.state().audits.length, 3)
})

test("rechaza pagar más que el saldo o volver a cobrar una orden saldada sin escribir datos", async () => {
  for (const [initial, amount, code] of [
    [20000, 30001, "MONTO_EXCEDE_SALDO"],
    [50000, 1, "ORDEN_SIN_SALDO"],
  ] as const) {
    const s = scenario({ initial })
    const before = structuredClone(s.state())
    await assert.rejects(s.pay(amount), { code })
    assert.deepEqual(s.state(), before)
  }
})

test("rechaza ODT anuladas, inexistentes y métodos inválidos o inactivos", async () => {
  for (const [options, method, code] of [
    [{ estado: "ANULADA" }, "EFECTIVO", "ORDEN_ANULADA"],
    [{ missingOrder: true }, "EFECTIVO", "ORDEN_NO_EXISTE"],
    [{ inactiveMethod: true }, "EFECTIVO", "METODO_PAGO_INVALIDO"],
    [{}, "OTRO", "METODO_PAGO_INVALIDO"],
  ] as const) {
    const s = scenario(options)
    await assert.rejects(s.pay(10000, method), { code })
    assert.equal(s.state().payments.length, 0)
  }
})

test("los pagos no completados no reducen el saldo disponible para nuevos abonos", async () => {
  for (const estado of ["PENDIENTE", "FALLIDO", "ANULADO", "REEMBOLSADO"]) {
    const s = scenario({ initial: 40000 })
    s.setPaymentStatus(estado)
    const result = await s.pay(30000)
    assert.equal(result.resumenPago.totalPagado, 30000)
    assert.equal(result.resumenPago.saldoPendiente, 20000)
    assert.equal(result.resumenPago.estadoPago, "PARCIAL")
  }
})

test("dos pagos simultáneos recalculan el saldo bajo bloqueo y evitan sobrepagos", async () => {
  const s = scenario({ initial: 20000 })
  const results = await Promise.allSettled([s.pay(20000), s.pay(20000)])
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1
  )
  const rejected = results.find(
    (result) => result.status === "rejected"
  ) as PromiseRejectedResult
  assert.equal(rejected.reason.code, "MONTO_EXCEDE_SALDO")
  assert.equal(
    s
      .state()
      .assignments.reduce(
        (sum, assignment) => sum + assignment.montoAsociado,
        0
      ),
    40000
  )
  const final = await s.pay(10000)
  assert.equal(final.resumenPago.estadoPago, "PAGADA")
})

test("si falla la asignación o auditoría se revierten pago, saldo y estado", async () => {
  for (const fail of ["assignment", "audit"] as const) {
    const s = scenario({ initial: 20000, fail })
    const before = structuredClone(s.state())
    await assert.rejects(s.pay(10000))
    assert.deepEqual(s.state(), before)
  }
})
