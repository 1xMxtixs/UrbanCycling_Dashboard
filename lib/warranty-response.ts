import { EstadoReclamoGarantia } from "@/generated/prisma"

// CU75 agrupa los estados internos de trabajo bajo las tres etiquetas que ve
// el usuario. El código original viaja junto al nombre para que el frontend no
// pierda información necesaria para habilitar acciones de CU posteriores.
const NOMBRE_ESTADO_GARANTIA: Record<EstadoReclamoGarantia, string> = {
  [EstadoReclamoGarantia.INGRESADO]: "Pendiente",
  [EstadoReclamoGarantia.EN_REVISION]: "Pendiente",
  [EstadoReclamoGarantia.EN_ESPERA]: "Pendiente",
  [EstadoReclamoGarantia.APROBADO]: "Aprobada",
  [EstadoReclamoGarantia.RECHAZADO]: "Rechazada",
}

/**
 * Convierte la fecha persistida en UTC al formato que muestran las vistas de
 * garantías. Usar UTC evita que el día cambie según la zona horaria del servidor.
 */
export function formatearFechaGarantia(fecha: Date) {
  const dia = String(fecha.getUTCDate()).padStart(2, "0")
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, "0")
  const anio = fecha.getUTCFullYear()

  return `${dia}-${mes}-${anio}`
}

/**
 * Conserva el código interno para los flujos del backend y agrega la etiqueta
 * resumida que el frontend usa para Pendiente, Aprobada o Rechazada.
 */
export function presentarEstadoGarantia(estado: EstadoReclamoGarantia) {
  return {
    codigo: estado,
    nombre: NOMBRE_ESTADO_GARANTIA[estado],
  }
}
