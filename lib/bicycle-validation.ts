import { z } from "zod"

const campoRequerido = (nombre: string) =>
  z
    .string()
    .trim()
    .min(1, `${nombre} es obligatorio`)
    .max(50, `${nombre} no puede superar los 50 caracteres`)

const camposBicicletaSchema = z.object({
  tipo: campoRequerido("El tipo"),
  marca: campoRequerido("La marca"),
  modelo: campoRequerido("El modelo"),
  color: campoRequerido("El color"),
  descripcionAdicional: z
    .string()
    .trim()
    .max(500, "La descripcion no puede superar los 500 caracteres")
    .nullable()
    .optional(),
})

export const crearBicicletaSchema = camposBicicletaSchema.extend({
  idOrdenDeTrabajo: z.coerce
    .number()
    .int("La orden de trabajo debe ser valida")
    .positive("La orden de trabajo debe ser valida"),
  // Conserva el valor utilizado por el backend cuando el formulario no envia el tipo.
  tipo: campoRequerido("El tipo").default("urbana"),
})

export const actualizarBicicletaSchema = camposBicicletaSchema
  .partial()
  .extend({
    idOrdenDeTrabajo: z.coerce
      .number()
      .int("La orden de trabajo debe ser valida")
      .positive("La orden de trabajo debe ser valida")
      .optional(),
  })

/**
 * Normaliza los alias aceptados actualmente por la API antes de validar el
 * payload. La relacion con la ODT permanece obligatoria en el esquema.
 */
export function normalizarPayloadBicicleta(
  value: unknown
): Record<string, unknown> {
  const data =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {}

  return {
    ...data,
    descripcionAdicional:
      data.descripcionAdicional ?? data.descripcion ?? undefined,
  }
}

/** Construye una respuesta uniforme para payloads de bicicleta invalidos. */
export function respuestaValidacionBicicleta(error: z.ZodError) {
  return {
    code: "BICICLETA_INVALIDA",
    message:
      error.issues[0]?.message ?? "Los datos de la bicicleta no son validos",
    fields: error.flatten().fieldErrors,
  }
}
