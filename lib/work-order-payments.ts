import {
  EstadoPago,
  EstadoPagoVenta,
  EstadoRegistro,
  type Prisma,
} from "@/generated/prisma"
import { bloquearOrdenesTrabajo } from "@/app/api/_lib/work-order-lock"
import { sumarPagosCompletados } from "@/lib/payment-summary"
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit"
import { ESTADO_OT } from "@/lib/work-order-status"

export class WorkOrderPaymentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message)
    this.name = "WorkOrderPaymentError"
  }
}

const MAX_PAYMENT_AMOUNT = 999999999999

export function validarMontoAbono(value: unknown) {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !/^\d+$/.test(value.trim()))
  ) {
    throw new WorkOrderPaymentError(
      "MONTO_PAGO_INVALIDO",
      "Indica un monto entero positivo en pesos."
    )
  }
  const monto = Number(value)
  if (
    !Number.isSafeInteger(monto) ||
    monto <= 0 ||
    monto > MAX_PAYMENT_AMOUNT
  ) {
    throw new WorkOrderPaymentError(
      "MONTO_PAGO_INVALIDO",
      "El monto debe ser un entero positivo dentro del rango permitido."
    )
  }
  return monto
}

/** Mantiene compatibilidad con los nombres utilizados por los clientes anteriores. */
export function leerMontoAbono(data: Record<string, unknown>) {
  const values = ["montoPago", "monto_pagado", "montoPagado", "monto"]
    .filter((key) => data[key] !== undefined)
    .map((key) => data[key])
  if (!values.length) return undefined
  const amounts = values.map(validarMontoAbono)
  if (amounts.some((amount) => amount !== amounts[0])) {
    throw new WorkOrderPaymentError(
      "MONTOS_PAGO_INCONSISTENTES",
      "Los campos de monto enviados no coinciden."
    )
  }
  return amounts[0]
}

/** Debe ejecutarse dentro de una transacción; bloquea la ODT antes de leer su saldo. */
export async function registrarAbonoOrdenTrabajo(
  tx: Prisma.TransactionClient,
  input: {
    idOrdenDeTrabajo: number
    idUsuario: number
    metodoPago: string
    montoPago: unknown
  }
) {
  const monto = validarMontoAbono(input.montoPago)
  await bloquearOrdenesTrabajo(tx, [input.idOrdenDeTrabajo])
  const orden = await tx.ordenDeTrabajo.findUnique({
    where: { idOrdenDeTrabajo: input.idOrdenDeTrabajo },
    include: {
      venta: {
        include: {
          asignacionesPago: { include: { pago: { select: { estado: true } } } },
        },
      },
    },
  })
  if (!orden)
    throw new WorkOrderPaymentError(
      "ORDEN_NO_EXISTE",
      "La orden de trabajo no existe.",
      404
    )
  if (orden.estado === ESTADO_OT.ANULADA)
    throw new WorkOrderPaymentError(
      "ORDEN_ANULADA",
      "No se pueden registrar pagos en una orden anulada.",
      409
    )
  const metodoPago = input.metodoPago.trim().toUpperCase()
  const metodo = await tx.metodoPago.findUnique({
    where: { codigo: metodoPago },
  })
  if (!metodo || metodo.estado !== EstadoRegistro.ACTIVO)
    throw new WorkOrderPaymentError(
      "METODO_PAGO_INVALIDO",
      "Selecciona un método de pago activo."
    )
  const total = Number(orden.montoTotal)
  const totalAnterior = sumarPagosCompletados(orden.venta.asignacionesPago)
  const saldoAnterior = Math.max(0, total - totalAnterior)
  if (saldoAnterior === 0)
    throw new WorkOrderPaymentError(
      "ORDEN_SIN_SALDO",
      "La orden ya está saldada. Actualiza sus datos.",
      409
    )
  if (monto > saldoAnterior)
    throw new WorkOrderPaymentError(
      "MONTO_EXCEDE_SALDO",
      `El monto supera el saldo actual de $${saldoAnterior.toLocaleString("es-CL")}. Actualiza los datos de la orden.`,
      409
    )
  const totalPagado = totalAnterior + monto
  const saldoPendiente = total - totalPagado
  const estadoPago =
    saldoPendiente === 0 ? EstadoPagoVenta.PAGADA : EstadoPagoVenta.PARCIAL
  const pago = await tx.pago.create({
    data: {
      idUsuario: input.idUsuario,
      fechaRegistro: new Date(),
      estado: EstadoPago.COMPLETADO,
      metodoPago,
      monto,
    },
  })
  await tx.asignacionPago.create({
    data: {
      idPago: pago.idPago,
      idVenta: orden.venta.idVenta,
      idOrdenDeCompra: null,
      montoAsociado: monto,
      tipoAbono: saldoPendiente === 0 ? "pago_total" : "abono",
    },
  })
  await tx.venta.update({
    where: { idVenta: orden.venta.idVenta },
    data: { estadoPago },
  })
  await registrarAuditoriaOrdenTrabajo(tx, {
    idUsuario: input.idUsuario,
    idOrdenDeTrabajo: input.idOrdenDeTrabajo,
    tipoOperacion: "registro_pago",
    valorAnterior: {
      totalPagado: totalAnterior,
      saldoPendiente: saldoAnterior,
      estadoPago: orden.venta.estadoPago,
    },
    valorNuevo: {
      idPago: pago.idPago,
      metodoPago,
      monto,
      totalPagado,
      saldoPendiente,
      estadoPago,
    },
    detalleCambio:
      saldoPendiente === 0
        ? "Pago del saldo de la orden de trabajo"
        : "Abono parcial a la orden de trabajo",
  })
  return {
    pago,
    resumenPago: { total, totalPagado, saldoPendiente, estadoPago },
  }
}
