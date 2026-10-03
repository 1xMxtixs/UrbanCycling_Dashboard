import { z } from "zod"

export const productSearchQuerySchema = z
  .string()
  .trim()
  .min(1, "Ingrese el nombre que desea buscar.")
  .max(100, "La búsqueda no puede superar los 100 caracteres.")
  .refine((value) => !/[\u0000-\u001F\u007F]/.test(value), {
    message: "La búsqueda contiene caracteres no válidos.",
  })

export function sortArticleSearchResults<T extends { nombre: string }>(
  items: T[],
  query: string
) {
  const normalizedQuery = query.toLocaleLowerCase()

  return [...items].sort((left, right) => {
    const leftIsExact = left.nombre.toLocaleLowerCase() === normalizedQuery
    const rightIsExact = right.nombre.toLocaleLowerCase() === normalizedQuery

    if (leftIsExact !== rightIsExact) {
      return leftIsExact ? -1 : 1
    }

    return left.nombre.localeCompare(right.nombre, "es")
  })
}
