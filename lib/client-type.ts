export function esClienteJuridico(tipo?: string | null): boolean {
  const normalized = (tipo ?? "").trim().toLowerCase()
  return normalized === "juridica" || normalized === "juridico"
}
