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
