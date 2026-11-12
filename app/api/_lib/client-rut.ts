import { validarYFormatearRut, type RutValidationResult } from "@/lib/client-rut"

/** La ausencia de RUT se guarda como null; un RUT informado conserva su validación. */
export function validarRutOpcional(value: unknown): RutValidationResult | {
  valid: true
  formatted: null
  compact: null
} {
  if (value == null || (typeof value === "string" && !value.trim())) {
    return { valid: true, formatted: null, compact: null }
  }
  if (typeof value !== "string") {
    return { valid: false, error: "El RUT debe ser texto" }
  }
  return validarYFormatearRut(value)
}
