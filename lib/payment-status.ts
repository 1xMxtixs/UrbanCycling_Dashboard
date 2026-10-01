export const ESTADO_PAGO = {
  PENDIENTE: "PENDIENTE",
  ABONO: "PARCIAL",
  PAGADA: "PAGADA",
} as const

export type EstadoPago = (typeof ESTADO_PAGO)[keyof typeof ESTADO_PAGO]

export function getNombreEstadoPago(estado?: string | null) {
  const normalizado = estado?.toUpperCase()
  switch (normalizado) {
    case ESTADO_PAGO.PAGADA:
      return "Pagada"
    case ESTADO_PAGO.ABONO:
    case "ABONO":
      return "Abono"
    case ESTADO_PAGO.PENDIENTE:
      return "Pendiente"
    default:
      return estado || "Pendiente"
  }
}
