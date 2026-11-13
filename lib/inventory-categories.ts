import { EstadoRegistro, Prisma } from "@/generated/prisma"

export class InventoryCategoryError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message)
    this.name = "InventoryCategoryError"
  }
}

export function parseCategoryId(value: string) {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new InventoryCategoryError(
      "CATEGORIA_INVALIDA",
      "La categoría indicada no es válida."
    )
  }
  return id
}

export function parseCategoryInput(body: unknown, partial = false) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new InventoryCategoryError(
      "DATOS_INVALIDOS",
      "Debe enviar un objeto JSON válido."
    )
  }
  const input = body as Record<string, unknown>
  const data: {
    nombre?: string
    descripcion?: string | null
    estado?: EstadoRegistro
  } = {}
  if (!partial || input.nombre !== undefined) {
    if (typeof input.nombre !== "string")
      throw new InventoryCategoryError(
        "NOMBRE_INVALIDO",
        "El nombre es obligatorio."
      )
    const nombre = input.nombre.normalize("NFC").trim().replace(/\s+/g, " ")
    if (!nombre || nombre.length > 50)
      throw new InventoryCategoryError(
        "NOMBRE_INVALIDO",
        "El nombre debe tener entre 1 y 50 caracteres."
      )
    data.nombre = nombre
  }
  if (input.descripcion !== undefined) {
    if (input.descripcion !== null && typeof input.descripcion !== "string") {
      throw new InventoryCategoryError(
        "DESCRIPCION_INVALIDA",
        "La descripción debe ser texto."
      )
    }
    const descripcion =
      typeof input.descripcion === "string" ? input.descripcion.trim() : ""
    if (descripcion.length > 255)
      throw new InventoryCategoryError(
        "DESCRIPCION_INVALIDA",
        "La descripción admite hasta 255 caracteres."
      )
    data.descripcion = descripcion || null
  }
  if (input.estado !== undefined) {
    if (
      input.estado !== EstadoRegistro.ACTIVO &&
      input.estado !== EstadoRegistro.INACTIVO
    ) {
      throw new InventoryCategoryError(
        "ESTADO_INVALIDO",
        "El estado debe ser ACTIVO o INACTIVO."
      )
    }
    data.estado = input.estado
  } else if (!partial) data.estado = EstadoRegistro.ACTIVO
  if (Object.keys(data).length === 0)
    throw new InventoryCategoryError(
      "CAMPOS_REQUERIDOS",
      "Indique los campos que desea modificar."
    )
  return data
}

async function lockCategories(tx: Prisma.TransactionClient, ids: number[]) {
  if (!ids.length) return
  await tx.$queryRaw`SELECT id_categoria FROM categorias
    WHERE id_categoria IN (${Prisma.join([...new Set(ids)].sort((a, b) => a - b))})
    ORDER BY id_categoria FOR UPDATE`
}

/** Serializa asignaciones con cambios de estado y eliminaciones de categorías. */
export async function validarCategoriasAsignables(
  tx: Prisma.TransactionClient,
  ids: number[],
  idProducto?: number
) {
  if (!ids.length) return
  await lockCategories(tx, ids)
  const categories = await tx.categoria.findMany({
    where: { idCategoria: { in: ids } },
    select: { idCategoria: true, estado: true },
  })
  const assigned = idProducto
    ? await tx.categoriaProducto.findMany({
        where: { idProducto },
        select: { idCategoria: true },
      })
    : []
  const previousIds = new Set(assigned.map((item) => item.idCategoria))
  if (
    categories.length !== ids.length ||
    categories.some(
      (category) =>
        category.estado !== EstadoRegistro.ACTIVO &&
        !previousIds.has(category.idCategoria)
    )
  ) {
    throw new InventoryCategoryError(
      "CATEGORIAS_INVALIDAS",
      "Las categorías deben existir y estar activas. Solo se pueden conservar categorías inactivas que el producto ya tenía."
    )
  }
}

export async function crearCategoria(
  tx: Prisma.TransactionClient,
  body: unknown
) {
  const data = parseCategoryInput(body)
  const repeated = await tx.categoria.findUnique({
    where: { nombre: data.nombre! },
    select: { idCategoria: true },
  })
  if (repeated)
    throw new InventoryCategoryError(
      "CATEGORIA_DUPLICADA",
      "Ya existe una categoría con ese nombre.",
      409
    )
  return tx.categoria.create({ data: { ...data, nombre: data.nombre! } })
}

export async function editarCategoria(
  tx: Prisma.TransactionClient,
  idCategoria: number,
  body: unknown
) {
  const data = parseCategoryInput(body, true)
  await lockCategories(tx, [idCategoria])
  const category = await tx.categoria.findUnique({ where: { idCategoria } })
  if (!category)
    throw new InventoryCategoryError(
      "CATEGORIA_NO_EXISTE",
      "La categoría no existe.",
      404
    )
  if (data.nombre) {
    const repeated = await tx.categoria.findUnique({
      where: { nombre: data.nombre },
      select: { idCategoria: true },
    })
    if (repeated && repeated.idCategoria !== idCategoria)
      throw new InventoryCategoryError(
        "CATEGORIA_DUPLICADA",
        "Ya existe una categoría con ese nombre.",
        409
      )
  }
  return tx.categoria.update({ where: { idCategoria }, data })
}

export async function eliminarCategoria(
  tx: Prisma.TransactionClient,
  idCategoria: number
) {
  await lockCategories(tx, [idCategoria])
  const category = await tx.categoria.findUnique({ where: { idCategoria } })
  if (!category)
    throw new InventoryCategoryError(
      "CATEGORIA_NO_EXISTE",
      "La categoría no existe.",
      404
    )
  const associations = await tx.categoriaProducto.count({
    where: { idCategoria },
  })
  if (associations > 0)
    throw new InventoryCategoryError(
      "CATEGORIA_CON_PRODUCTOS",
      "La categoría tiene productos asociados. Puedes desactivarla para conservar sus asociaciones.",
      409
    )
  await tx.categoria.delete({ where: { idCategoria } })
}
