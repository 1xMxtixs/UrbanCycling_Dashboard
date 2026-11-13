export function capitalizarCadaPalabra(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((palabra) => {
      const partes = palabra.split("-")

      return partes
        .map((parte) => {
          if (!parte) {
            return parte
          }

          return parte.charAt(0).toLocaleUpperCase() + parte.slice(1).toLocaleLowerCase()
        })
        .join("-")
    })
    .join(" ")
}

export function normalizarTexto(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return capitalizarCadaPalabra(value)
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
