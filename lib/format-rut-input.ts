/**
 * Aplica el formato visual del RUT mientras el usuario escribe. No calcula el
 * dígito verificador porque el proyecto utiliza validación estructural.
 */
export function formatRutInput(value: string) {
  const cleaned = value
    .toUpperCase()
    .replace(/[^0-9K]/g, "")
    .slice(0, 9)

  if (cleaned.length <= 1) {
    return cleaned
  }

  const body = cleaned.slice(0, -1)
  const checkDigit = cleaned.slice(-1)
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `${formattedBody}-${checkDigit}`
}
