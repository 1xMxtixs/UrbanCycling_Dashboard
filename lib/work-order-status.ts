export const ESTADO_OT = {
  POR_REALIZAR: "POR_REALIZAR",
  EN_ESPERA: "EN_ESPERA",
  EN_CURSO: "EN_CURSO",
  LISTO_PARA_ENTREGAR: "LISTO_PARA_ENTREGAR",
  ENTREGADO: "ENTREGADO",
  ANULADA: "ANULADA",
} as const

export type EstadoOt = (typeof ESTADO_OT)[keyof typeof ESTADO_OT]

export const NOMBRES_ESTADO_OT: Record<EstadoOt, string> = {
  [ESTADO_OT.POR_REALIZAR]: "Por realizar",
  [ESTADO_OT.EN_ESPERA]: "En espera",
  [ESTADO_OT.EN_CURSO]: "En curso",
  [ESTADO_OT.LISTO_PARA_ENTREGAR]: "Listo para entregar",
  [ESTADO_OT.ENTREGADO]: "Entregado",
  [ESTADO_OT.ANULADA]: "Anulada",
}

// Define el flujo operativo permitido para una orden de trabajo usando los codigos persistidos en la base de datos.
export const TRANSICIONES_OT: Record<EstadoOt, EstadoOt[]> = {
  POR_REALIZAR: [ESTADO_OT.EN_CURSO, ESTADO_OT.EN_ESPERA],
  EN_ESPERA: [ESTADO_OT.EN_CURSO, ESTADO_OT.LISTO_PARA_ENTREGAR],
  EN_CURSO: [ESTADO_OT.LISTO_PARA_ENTREGAR, ESTADO_OT.EN_ESPERA],
  LISTO_PARA_ENTREGAR: [ESTADO_OT.ENTREGADO, ESTADO_OT.EN_CURSO],
  ENTREGADO: [],
  ANULADA: [],
}

export const ACTIVE_WORK_ORDER_STATUSES: EstadoOt[] = [
  ESTADO_OT.POR_REALIZAR,
  ESTADO_OT.EN_ESPERA,
  ESTADO_OT.EN_CURSO,
  ESTADO_OT.LISTO_PARA_ENTREGAR,
]

export const ESTADOS_OT_FINALIZADOS: EstadoOt[] = [
  ESTADO_OT.LISTO_PARA_ENTREGAR,
  ESTADO_OT.ENTREGADO,
]

export const ESTADOS_OT_CERRADOS: EstadoOt[] = [
  ESTADO_OT.ENTREGADO,
  ESTADO_OT.ANULADA,
]

/**
 * Una OT está retrasada cuando ya venció el día comprometido y aún no se cerró.
 * Es un indicador de presentación: nunca se persiste ni altera el estado operativo.
 */
export function isOrdenTrabajoRetrasada(
  estado: string,
  fechaEntregaEstimada?: string | Date | null,
  ahora = new Date()
) {
  if (!fechaEntregaEstimada || ESTADOS_OT_CERRADOS.includes(estado as EstadoOt)) {
    return false
  }

  const fecha = new Date(fechaEntregaEstimada)
  if (Number.isNaN(fecha.getTime())) return false

  const finDelDiaEstimado = new Date(
    fecha.getUTCFullYear(),
    fecha.getUTCMonth(),
    fecha.getUTCDate(),
    23,
    59,
    59,
    999
  )

  return finDelDiaEstimado < ahora
}

export function getNombreEstadoOt(estado: string, nombre?: string | null) {
  return nombre || NOMBRES_ESTADO_OT[estado as EstadoOt] || estado
}

export function getNombreEstadoOtVisible(
  estado: string,
  fechaEntregaEstimada?: string | Date | null,
  nombre?: string | null
) {
  const nombreEstado = getNombreEstadoOt(estado, nombre)
  return isOrdenTrabajoRetrasada(estado, fechaEntregaEstimada)
    ? `${nombreEstado} (retrasada)`
    : nombreEstado
}
