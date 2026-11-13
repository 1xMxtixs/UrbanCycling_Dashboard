import assert from "node:assert/strict"
import { test } from "node:test"
import type { Prisma } from "@/generated/prisma"
import { agregarProductoOrden } from "./add-work-order-product"
import { agruparLineasProductosOrden, seleccionarProductoOrden, validarCantidadProducto } from "./work-order-products"

const productLine = (idProducto: number, cantidad: number, precioUnitario = 1000) => ({
  idProducto, cantidad, precioUnitario, descuentoUnitario: 100, costoUnitario: 300,
})

test("creación: agrupa por ID, conserva valores y no altera el input", () => {
  const input = [productLine(1, 2), productLine(2, 1), productLine(1, 3)]
  assert.deepEqual(agruparLineasProductosOrden(input), [productLine(1, 5), productLine(2, 1)])
  assert.equal(input[0].cantidad, 2)
})

test("creación: rechaza precios, descuentos o costos incompatibles", () => {
  for (const field of ["precioUnitario", "descuentoUnitario", "costoUnitario"] as const) {
    assert.throws(() => agruparLineasProductosOrden([
      productLine(1, 2), { ...productLine(1, 3), [field]: 999 },
    ]), { code: "PRODUCTO_CON_VALORES_DISTINTOS" })
  }
})

test("cantidades: rechaza cero, negativos, fracciones y desbordamientos", () => {
  for (const quantity of [0, -1, 1.5, NaN, Infinity, 2147483648]) {
    assert.throws(() => validarCantidadProducto(quantity), { code: "CANTIDAD_INVALIDA" })
  }
  assert.throws(() => agruparLineasProductosOrden([productLine(1, 2147483647), productLine(1, 1)]))
})

test("formulario: fusiona la fila seleccionada y conserva el precio existente", () => {
  const input = [
    { idProducto: "1", cantidad: 2, precioUnitario: 800 },
    { idProducto: "", cantidad: 3, precioUnitario: 0 },
  ]
  assert.deepEqual(seleccionarProductoOrden(input, 1, "1", 1000), [
    { idProducto: "1", cantidad: 5, precioUnitario: 800 },
  ])
  assert.equal(input.length, 2)
})

// Adaptador transaccional en memoria: simula el bloqueo de la ODT y los efectos
// de las SP, para probar la orquestación sin conectarse a datos del usuario.
function scenario(options: { stock?: number; existing?: boolean; duplicates?: boolean; estado?: string; pago?: boolean; dte?: boolean; activo?: boolean; productoExiste?: boolean; ordenExiste?: boolean } = {}) {
  type Line = ReturnType<typeof productLine> & { idLineaDeOrdenDeTrabajo: number; idOrdenDeTrabajo: number; idServicio: null }
  let lines: Line[] = options.existing ? [{ ...productLine(1, 2, 800), idLineaDeOrdenDeTrabajo: 7, idOrdenDeTrabajo: 1, idServicio: null }] : []
  if (options.duplicates) lines.push({ ...lines[0], idLineaDeOrdenDeTrabajo: 8 })
  let stock = options.stock ?? 20
  let total = 0
  let movements: number[] = []
  let audits: unknown[] = []
  let pending = Promise.resolve()
  async function run(cantidad: number) {
    let release: (() => void) | undefined
    let snapshot: { lines: Line[]; stock: number; total: number; movements: number[]; audits: unknown[] } | undefined
    const tx = {
      $queryRaw: async (sql: TemplateStringsArray) => {
        if (sql.join("").includes("FOR UPDATE")) {
          const previous = pending
          pending = new Promise<void>((resolve) => { release = resolve })
          await previous
          snapshot = structuredClone({ lines, stock, total, movements, audits })
          return []
        }
        return [{ montoTotal: total }]
      },
      $executeRaw: async (sql: TemplateStringsArray, ...args: unknown[]) => {
        if (sql.join("").includes("sp_descontar_stock_productos")) {
          const [item] = JSON.parse(String(args[0])) as { cantidad: number }[]
          if (stock < item.cantidad) throw new Error("Stock insuficiente")
          stock -= item.cantidad
          movements.push(item.cantidad)
        } else {
          total = lines.reduce((sum, line) => sum + line.cantidad * (line.precioUnitario - line.descuentoUnitario), 0)
        }
      },
      ordenDeTrabajo: {
        findUnique: async () => {
          assert.ok(snapshot, "la orden debe leerse después de bloquearla")
          return options.ordenExiste === false ? null : {
            estado: options.estado ?? "EN_CURSO", montoTotal: total,
            venta: { estadoPago: "PENDIENTE", asignacionesPago: options.pago ? [{}] : [], origenesDTE: options.dte ? [{}] : [] },
          }
        },
        findUniqueOrThrow: async () => ({ montoTotal: total }),
      },
      producto: { findUnique: async () => options.productoExiste === false ? null : ({
        idProducto: 1, nombre: "Cámara", estado: options.activo === false ? "INACTIVO" : "ACTIVO", precioVenta: 1000, costoPromedio: 300,
      }) },
      lineaDeOrdenDeTrabajo: {
        findMany: async () => structuredClone(lines),
        create: async ({ data }: { data: Omit<Line, "idLineaDeOrdenDeTrabajo"> }) => {
          const line = { ...data, idLineaDeOrdenDeTrabajo: 7 }
          lines.push(line)
          return line
        },
        update: async ({ data }: { data: { cantidad: { increment: number } } }) => {
          lines[0] = { ...lines[0], cantidad: lines[0].cantidad + data.cantidad.increment }
          return lines[0]
        },
      },
      auditoria: { create: async (data: unknown) => { audits.push(data); return data } },
    }
    try {
      return await agregarProductoOrden(tx as unknown as Prisma.TransactionClient, { idOrdenDeTrabajo: 1, idProducto: 1, cantidad, idUsuario: 1 })
    } catch (err) {
      if (snapshot) ({ lines, stock, total, movements, audits } = snapshot)
      throw err
    } finally {
      release?.()
    }
  }
  return { run, state: () => ({ lines, stock, total, movements, audits }) }
}

test("edición: crea un producto y registra stock, totales y auditoría", async () => {
  const s = scenario()
  const result = await s.run(3)
  assert.equal(result.acumulado, false)
  assert.equal(s.state().lines.length, 1)
  assert.equal(s.state().lines[0].cantidad, 3)
  assert.equal(s.state().stock, 17)
  assert.equal(s.state().total, 3000)
  assert.deepEqual(s.state().movements, [3])
  assert.equal(s.state().audits.length, 1)
})

test("edición: acumula conservando ID, precio y descuento; consume solo el incremento", async () => {
  const s = scenario({ existing: true })
  await s.run(3)
  assert.equal(s.state().lines.length, 1)
  assert.deepEqual(s.state().lines[0], { ...productLine(1, 5, 800), idLineaDeOrdenDeTrabajo: 7, idOrdenDeTrabajo: 1, idServicio: null })
  assert.equal(s.state().total, 3500)
  assert.equal(s.state().stock, 17)
})

test("Por realizar: permite incorporar productos nuevos y acumular cantidades existentes", async () => {
  for (const existing of [false, true]) {
    const s = scenario({ estado: "POR_REALIZAR", existing })
    const result = await s.run(3)
    assert.equal(result.acumulado, existing)
    assert.equal(s.state().lines.length, 1)
    assert.equal(s.state().lines[0].cantidad, existing ? 5 : 3)
    assert.equal(s.state().stock, 17)
    assert.equal(s.state().total, existing ? 3500 : 3000)
    assert.deepEqual(s.state().movements, [3])
    assert.equal(s.state().audits.length, 1)
  }
})

test("stock insuficiente: revierte la creación o el incremento de la línea", async () => {
  for (const existing of [true, false]) {
    const s = scenario({ stock: 1, existing })
    const before = structuredClone(s.state())
    await assert.rejects(s.run(3), { code: "STOCK_INSUFICIENTE" })
    assert.deepEqual(s.state(), before)
  }
})

test("dos incorporaciones simultáneas: una sola línea y ninguna cantidad perdida", async () => {
  const s = scenario()
  await Promise.all([s.run(2), s.run(3)])
  assert.equal(s.state().lines.length, 1)
  assert.equal(s.state().lines[0].cantidad, 5)
  assert.equal(s.state().stock, 15)
  assert.deepEqual(s.state().movements, [2, 3])
})

test("rechaza estados, pagos, documentos, productos inactivos y duplicados históricos sin cambios", async () => {
  for (const options of [
    { estado: "ENTREGADO" }, { estado: "ANULADA" }, { estado: "EN_ESPERA" }, { estado: "LISTO_PARA_ENTREGAR" },
    { estado: "POR_REALIZAR", pago: true }, { estado: "POR_REALIZAR", dte: true },
    { pago: true }, { dte: true }, { activo: false }, { productoExiste: false },
    { ordenExiste: false }, { existing: true, duplicates: true },
  ]) {
    const s = scenario(options)
    const before = structuredClone(s.state())
    await assert.rejects(s.run(1))
    assert.deepEqual(s.state(), before)
  }
})
