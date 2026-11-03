import { Prisma } from "@/generated/prisma"
import { NextResponse } from "next/server"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

export type ProductSupplierSummary = {
  idProveedor: number
  razonSocial: string
  rut: string
  estado: string
}

export const productSuppliersInclude = {
  Proveedores: {
    select: {
      proveedor: {
        select: {
          idProveedor: true,
          razonSocial: true,
          rut: true,
          estado: true,
        },
      },
    },
    orderBy: { idProveedor: "asc" },
  },
} as const

export function supplierSummaries(
  relations: Array<{ proveedor: ProductSupplierSummary }> = []
) {
  return Array.from(
    new Map(
      relations.map(({ proveedor }) => [proveedor.idProveedor, proveedor])
    ).values()
  )
}

export class ProductSupplierError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message)
  }
}

export function associationId(value: unknown) {
  const id =
    typeof value === "number" ||
    (typeof value === "string" && /^\d+$/.test(value))
      ? Number(value)
      : Number.NaN
  if (!Number.isSafeInteger(id) || id <= 0 || id > 4294967295) {
    throw new ProductSupplierError(
      "ID_INVALIDO",
      "Indique un identificador entero positivo válido.",
      400
    )
  }
  return id
}

export function associationProductIds(body: unknown) {
  if (
    !body ||
    typeof body !== "object" ||
    !("idProductos" in body) ||
    !Array.isArray(body.idProductos) ||
    !body.idProductos.length ||
    body.idProductos.length > 500
  ) {
    throw new ProductSupplierError(
      "PRODUCTOS_INVALIDOS",
      "Seleccione entre 1 y 500 productos.",
      400
    )
  }
  return [...new Set(body.idProductos.map(associationId))].sort((a, b) => a - b)
}

export async function requireProductSupplierPermission(write = false) {
  const { session, response } = await requirePermission(
    PERMISSIONS.SUPPLIERS_READ
  )
  if (response || !session)
    return response ?? new NextResponse("Sin sesión", { status: 401 })
  const required = write
    ? [
        PERMISSIONS.INVENTORY_READ,
        PERMISSIONS.SUPPLIERS_UPDATE,
        PERMISSIONS.INVENTORY_UPDATE,
      ]
    : [PERMISSIONS.INVENTORY_READ]
  return required.every((permission) =>
    session.user.permisos.includes(permission)
  )
    ? null
    : new NextResponse("Sin permisos", { status: 403 })
}

// Todas las escrituras de asociaciones toman primero el mismo bloqueo de proveedor.
// Esto serializa solicitudes simultáneas sin necesitar un índice único nuevo.
export async function lockSupplier(
  tx: Prisma.TransactionClient,
  idProveedor: number,
  active: boolean
) {
  await tx.$queryRaw`SELECT id_proveedor FROM proveedores WHERE id_proveedor = ${idProveedor} FOR UPDATE`
  const supplier = await tx.proveedor.findUnique({ where: { idProveedor } })
  if (!supplier)
    throw new ProductSupplierError(
      "PROVEEDOR_NO_EXISTE",
      "El proveedor no existe.",
      404
    )
  if (active && supplier.estado !== "ACTIVO") {
    throw new ProductSupplierError(
      "PROVEEDOR_INACTIVO",
      "El proveedor debe estar activo para asociar productos.",
      409
    )
  }
  return supplier
}

export async function associateProducts(
  tx: Prisma.TransactionClient,
  idProveedor: number,
  ids: number[]
) {
  await lockSupplier(tx, idProveedor, true)
  // Leer el estado desde la consulta bloqueante evita validar una versión anterior
  // del producto si otra transacción lo inactivó mientras esperábamos el bloqueo.
  const products = await tx.$queryRaw<
    Array<{ idProducto: number; estado: string }>
  >`
    SELECT id_producto AS idProducto, estado FROM productos
    WHERE id_producto IN (${Prisma.join(ids)}) ORDER BY id_producto FOR UPDATE
  `
  if (products.length !== ids.length) {
    throw new ProductSupplierError(
      "PRODUCTO_NO_EXISTE",
      "Uno o más productos no existen. No se guardaron asociaciones.",
      404
    )
  }
  if (products.some((product) => product.estado !== "ACTIVO")) {
    throw new ProductSupplierError(
      "PRODUCTO_INACTIVO",
      "Todos los productos seleccionados deben estar activos.",
      409
    )
  }
  const existing = await tx.productoProveedor.findMany({
    where: { idProveedor, idProducto: { in: ids } },
    select: { idProducto: true },
  })
  const existingIds = new Set(existing.map((item) => item.idProducto))
  const data = ids
    .filter((id) => !existingIds.has(id))
    .map((idProducto) => ({ idProducto, idProveedor }))
  if (data.length) await tx.productoProveedor.createMany({ data })
  return { asociadas: data.length, existentes: ids.length - data.length }
}

export function productSupplierErrorResponse(error: unknown) {
  if (error instanceof ProductSupplierError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.status }
    )
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        code: "JSON_INVALIDO",
        message: "La solicitud debe contener JSON válido.",
      },
      { status: 400 }
    )
  }
  console.error("[PRODUCTO_PROVEEDOR]", error)
  return NextResponse.json(
    {
      code: "ERROR_ASOCIACION",
      message: "No fue posible procesar las asociaciones.",
    },
    { status: 500 }
  )
}
