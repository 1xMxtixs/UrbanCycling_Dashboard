import type { StatusType } from "@/components/common/StatusBadge"

export const ESTADO_COMPRA = {
  BORRADOR: "BORRADOR",
  ENVIADA: "ENVIADA",
  COMPLETADA: "COMPLETADA",
  ANULADA: "ANULADA",
} as const

export const ESTADO_PAGO_COMPRA = {
  PENDIENTE: "PENDIENTE",
  PARCIAL: "PARCIAL",
  PAGADA: "PAGADA",
  ANULADA: "ANULADA",
} as const

export const ESTADOS_COMPRA = [
  { value: ESTADO_COMPRA.BORRADOR, label: "Borrador" },
  { value: ESTADO_COMPRA.ENVIADA, label: "Enviada" },
  { value: ESTADO_COMPRA.COMPLETADA, label: "Completada" },
  { value: ESTADO_COMPRA.ANULADA, label: "Anulada" },
] as const

export const ESTADOS_PAGO_COMPRA = [
  { value: ESTADO_PAGO_COMPRA.PENDIENTE, label: "Pendiente" },
  { value: ESTADO_PAGO_COMPRA.PARCIAL, label: "Parcial" },
  { value: ESTADO_PAGO_COMPRA.PAGADA, label: "Pagada" },
  { value: ESTADO_PAGO_COMPRA.ANULADA, label: "Anulada" },
] as const

type PurchaseStatusBadge = { label: string; status: StatusType }

function normalizeState(value?: string | null) {
  return value?.trim().toLocaleUpperCase("es-CL").replace(/[\s-]+/g, "_") ?? ""
}

function formatStateLabel(value?: string | null) {
  const label = value?.trim().replace(/[_-]+/g, " ").toLocaleLowerCase("es-CL") ?? ""
  return label ? label[0].toLocaleUpperCase("es-CL") + label.slice(1) : "—"
}

export function getEstadoCompraBadge(estado?: string | null): PurchaseStatusBadge {
  const normalized = normalizeState(estado)

  if (normalized === ESTADO_COMPRA.BORRADOR) return { label: "Borrador", status: "neutral" }
  if (normalized === ESTADO_COMPRA.ENVIADA || normalized === "EN_TRANSITO") {
    return { label: normalized === "EN_TRANSITO" ? "En tránsito" : "Enviada", status: "info" }
  }
  if (normalized === ESTADO_COMPRA.COMPLETADA || normalized === "RECIBIDA") {
    return { label: normalized === "RECIBIDA" ? "Recibida" : "Completada", status: "success" }
  }
  if (normalized === ESTADO_COMPRA.ANULADA || normalized === "CANCELADA") {
    return { label: "Anulada", status: "danger" }
  }

  return { label: formatStateLabel(estado), status: "neutral" }
}

export function getPagoCompraBadge(
  estado: string | null | undefined,
  pago: string | null | undefined
): PurchaseStatusBadge {
  const orderState = normalizeState(estado)
  const paymentState = normalizeState(pago)

  if (orderState === ESTADO_COMPRA.BORRADOR || orderState === ESTADO_COMPRA.ANULADA) {
    return { label: "—", status: "neutral" }
  }
  if (paymentState === ESTADO_PAGO_COMPRA.PAGADA) return { label: "Pagada", status: "success" }
  if (paymentState === ESTADO_PAGO_COMPRA.PENDIENTE) return { label: "Pendiente", status: "warning" }
  if (paymentState === ESTADO_PAGO_COMPRA.PARCIAL || paymentState === "ABONO") {
    return { label: "Parcial", status: "info" }
  }
  if (paymentState === ESTADO_PAGO_COMPRA.ANULADA) return { label: "Anulada", status: "neutral" }

  return { label: formatStateLabel(pago), status: "neutral" }
}
