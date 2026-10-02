const MAX_SUPPLIER_CODE_LENGTH = 50

export type ProductSupplierCodeResult =
  | { status: "absent" }
  | { status: "valid"; value: string | null }
  | { status: "invalid" }

/** Detecta caracteres de control que no deben formar parte del código. */
function hasControlCharacters(value: string) {
  return Array.from(value).some((character) => {
    const characterCode = character.charCodeAt(0)
    return characterCode <= 31 || characterCode === 127
  })
}

/**
 * Lee codigoProveedor desde el cuerpo de una solicitud.
 * Distingue entre campo ausente, retiro de asociación y código válido.
 */
export function parseProductSupplierCode(
  data: Record<string, unknown>,
): ProductSupplierCodeResult {
  const hasCamelCase = Object.prototype.hasOwnProperty.call(
    data,
    "codigoProveedor",
  )
  const hasSnakeCase = Object.prototype.hasOwnProperty.call(
    data,
    "codigo_proveedor",
  )

  if (!hasCamelCase && !hasSnakeCase) {
    return { status: "absent" }
  }

  // Evita interpretar dos valores distintos dentro de la misma solicitud.
  if (hasCamelCase && hasSnakeCase) {
    return { status: "invalid" }
  }

  const value = hasCamelCase
    ? data.codigoProveedor
    : data.codigo_proveedor

  // null retira la asociación lógica del producto.
  if (value === null) {
    return { status: "valid", value: null }
  }

  if (typeof value !== "string") {
    return { status: "invalid" }
  }

  const normalizedValue = value.trim()

  if (
    normalizedValue.length === 0 ||
    normalizedValue.length > MAX_SUPPLIER_CODE_LENGTH ||
    hasControlCharacters(normalizedValue)
  ) {
    return { status: "invalid" }
  }

  return {
    status: "valid",
    value: normalizedValue,
  }
}
