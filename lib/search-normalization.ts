/** Normaliza texto para búsquedas tolerantes a mayúsculas, tildes y diéresis. */
export function normalizeSearchText(value: string | number | null | undefined): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CL")
    .trim()
}

export function includesNormalizedText(
  value: string | number | null | undefined,
  query: string,
): boolean {
  return normalizeSearchText(value).includes(normalizeSearchText(query))
}
