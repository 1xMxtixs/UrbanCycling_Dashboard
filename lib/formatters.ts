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

export type UserNombreInput = {
  primerNombre?: string | null
  apellidoPaterno?: string | null
  apellidoMaterno?: string | null
  correoElectronico?: string | null
} | null | undefined

/** Formatea el nombre completo de un usuario; cae en el correo o en un texto genérico si no hay datos. */
export function formatUserName(user: UserNombreInput): string {
  if (!user) return "Usuario sin nombre"
  const parts = [user.primerNombre, user.apellidoPaterno, user.apellidoMaterno].filter(Boolean)
  if (parts.length > 0) return parts.join(" ").trim()
  return user.correoElectronico?.trim() || "Usuario sin nombre"
}

/** Convierte una fecha ISO o string al formato visual DD-MM-YYYY (es-CL). */
export function formatDateCL(fecha: unknown): string {
  if (!fecha || typeof fecha !== "string") {
    return ""
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
    return fecha
  }

  const date = new Date(fecha)
  if (Number.isNaN(date.getTime())) {
    return fecha
  }

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}
