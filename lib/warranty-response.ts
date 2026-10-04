import { EstadoReclamoGarantia } from "@/generated/prisma"

const NOMBRE_ESTADO_GARANTIA: Record<EstadoReclamoGarantia, string> = {
  [EstadoReclamoGarantia.INGRESADO]: "Ingresado",
  [EstadoReclamoGarantia.EN_REVISION]: "En revisión",
  [EstadoReclamoGarantia.EN_ESPERA]: "En espera",
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
