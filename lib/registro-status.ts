export const ESTADO_REGISTRO = { ACTIVO: "ACTIVO", INACTIVO: "INACTIVO" } as const
export type EstadoRegistro = (typeof ESTADO_REGISTRO)[keyof typeof ESTADO_REGISTRO]

export function isRegistroActivo(estado?: string | null) {
  return estado?.trim().toUpperCase() === ESTADO_REGISTRO.ACTIVO
}

export function getNombreEstadoRegistro(estado?: string | null) {
  return isRegistroActivo(estado) ? "Activo" : "Inactivo"
}
