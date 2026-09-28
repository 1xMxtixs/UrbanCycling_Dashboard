export const ESTADO_PAGO = {
  PENDIENTE: "pendiente",
  ABONO: "abono",
  PAGADA: "pagada",
} as const

export type EstadoPago = (typeof ESTADO_PAGO)[keyof typeof ESTADO_PAGO]

export function getNombreEstadoPago(estado?: string | null) {
  switch (estado) {
    case ESTADO_PAGO.PAGADA:
      return "Pagada"
    case ESTADO_PAGO.ABONO:
      return "Abono"
    case ESTADO_PAGO.PENDIENTE:
      return "Pendiente"
    default:
      return estado || "Pendiente"
  }
}
