import { EstadoRegistro } from "@/generated/prisma"

export function resolverEstadoRegistro(value: unknown): EstadoRegistro | null {
  if (typeof value !== "string") {
    return null
  }

  const estado = value.trim().toUpperCase()

  return Object.values(EstadoRegistro).includes(estado as EstadoRegistro)
    ? (estado as EstadoRegistro)
    : null
}
