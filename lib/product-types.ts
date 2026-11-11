export const TIPOS_PRODUCTO = [
  "Repuesto",
  "Accesorio",
  "Herramienta",
  "Insumo",
] as const

function capitalizeProductType(value: string): string {
  const normalized = value.trim().toLocaleLowerCase("es-CL")
  return normalized
    ? normalized[0].toLocaleUpperCase("es-CL") + normalized.slice(1)
    : ""
}

export function formatTipoProducto(value?: string | null): string {
  const trimmed = value?.trim() ?? ""
  return trimmed ? capitalizeProductType(trimmed) : "—"
}

export function canonicalTipoProducto(value?: string | null): string {
  const trimmed = value?.trim() ?? ""
  if (!trimmed) return "—"

  const canonical = TIPOS_PRODUCTO.find(
    (type) => type.toLocaleLowerCase("es-CL") === trimmed.toLocaleLowerCase("es-CL")
  )
  return canonical ?? formatTipoProducto(trimmed)
}

export function getTipoProductoOptions(current?: string | null): string[] {
  const options: string[] = [...TIPOS_PRODUCTO]
  const canonicalCurrent = canonicalTipoProducto(current)

  if (canonicalCurrent !== "—" && !options.includes(canonicalCurrent)) {
    options.push(canonicalCurrent)
  }

  return options
}
