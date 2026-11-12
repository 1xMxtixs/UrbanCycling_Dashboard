export type RutValidationResult =
  | {
      valid: true
      formatted: string
      compact: string
    }
  | {
      valid: false
      error: string
    }

/** Normaliza la ausencia de RUT; los valores informados conservan su validación. */
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

export function validarYFormatearRut(value: string): RutValidationResult {
  const rutIngresado = value.trim().toUpperCase()

  if (!rutIngresado) {
    return {
      valid: false,
      error: "Debe indicar un RUT",
    }
  }

  if (!/^[0-9.\-\sK]+$/.test(rutIngresado)) {
    return {
      valid: false,
      error: "El RUT contiene caracteres no permitidos",
    }
  }

  const rutLimpio = rutIngresado.replace(/[.\-\s]/g, "")

  if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) {
    return {
      valid: false,
      error: "El RUT debe contener entre 7 y 8 dígitos más su dígito verificador",
    }
  }

  const cuerpo = rutLimpio.slice(0, -1)
  const digitoVerificador = rutLimpio.slice(-1)
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return {
    valid: true,
    formatted: `${cuerpoFormateado}-${digitoVerificador}`,
    compact: `${cuerpo}-${digitoVerificador}`,
  }
}
