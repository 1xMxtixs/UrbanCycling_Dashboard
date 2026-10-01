export const ESTADO_VENTA = { BORRADOR: "BORRADOR", COMPLETADA: "COMPLETADA", ANULADA: "ANULADA" } as const
export type EstadoVenta = (typeof ESTADO_VENTA)[keyof typeof ESTADO_VENTA]
export const isVentaAnulada = (estado?: string | null) => estado?.trim().toUpperCase() === ESTADO_VENTA.ANULADA
