export type ClienteNombreInput = {
  razonSocial?: string | null
  primerNombre?: string | null
  apellidoPaterno?: string | null
  apellidoMaterno?: string | null
} | null | undefined

export function formatClientName(cliente: ClienteNombreInput): string {
  if (!cliente) return "Sin cliente"
  if (cliente.razonSocial?.trim()) return cliente.razonSocial.trim()

  const parts = [cliente.primerNombre, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean)
  return parts.length > 0 ? parts.join(" ").trim() : "Sin cliente"
}

/** Formatea un monto como moneda chilena sin decimales. */
export function formatCLP(amount: number): string {
  return amount.toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  })
}

/** Acepta valores opcionales de formularios para el catálogo de servicios. */
export function formatCurrency(value: number | string | null | undefined): string {
  return Number(value || 0).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  })
}
