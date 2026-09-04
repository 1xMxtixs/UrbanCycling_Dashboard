export function normalizarTexto(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().replace(/\s+/g, " ")
}

export function normalizarTextoOpcional(value: unknown): string | null {
  return normalizarTexto(value) || null
}

export function separarNombres(nombres: string) {
  const partes = normalizarTexto(nombres).split(" ")

  return {
    primerNombre: partes[0],
    segundoNombre: partes.slice(1).join(" ") || null,
  }
}

export function separarApellidos(apellidos: string) {
  const partes = normalizarTexto(apellidos).split(" ")

  return {
    apellidoPaterno: partes[0],
    apellidoMaterno: partes.slice(1).join(" ") || null,
  }
}
