import type { StatusType } from "@/components/common/StatusBadge"

export const ESTADO_PAGO = {
  PENDIENTE: "PENDIENTE",
  PARCIAL: "PARCIAL",
  PAGADA: "PAGADA",
  REEMBOLSADA: "REEMBOLSADA",
  ANULADA: "ANULADA",
} as const

export type EstadoPago = (typeof ESTADO_PAGO)[keyof typeof ESTADO_PAGO]

export const NOMBRES_ESTADO_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Abono",
  PAGADA: "Pagada",
  REEMBOLSADA: "Reembolsada",
  ANULADA: "Anulada",
}

export function getNombreEstadoPago(estado?: string | null) {
  const codigo = estado?.trim().toUpperCase() as EstadoPago | undefined
  return (codigo && NOMBRES_ESTADO_PAGO[codigo]) || estado || "Pendiente"
}

export function getPaymentStatusBadgeVariant(estado?: string | null): StatusType {
  const codigo = estado?.trim().toUpperCase()
  if (codigo === ESTADO_PAGO.PAGADA) return "success"
  if (codigo === ESTADO_PAGO.PARCIAL) return "warning"
  if (codigo === ESTADO_PAGO.REEMBOLSADA) return "info"
  if (codigo === ESTADO_PAGO.ANULADA) return "neutral"
  return "danger"
}
