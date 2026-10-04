import { EstadoRegistro } from "@/generated/prisma"

/**
 * Convierte valores de formularios como "activo" al enum que espera Prisma.
 * Devuelve null para que cada controlador responda 400 antes de escribir.
 */
export function resolverEstadoRegistro(value: unknown): EstadoRegistro | null {
  if (typeof value !== "string") {
    return null
  }

  const estado = value.trim().toUpperCase()

  return Object.values(EstadoRegistro).includes(estado as EstadoRegistro)
    ? (estado as EstadoRegistro)
    : null
}
