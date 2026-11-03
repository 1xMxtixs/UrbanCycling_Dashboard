import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  associateProducts,
  associationId,
  associationProductIds,
  ProductSupplierError,
  productSupplierErrorResponse,
  requireProductSupplierPermission,
} from "@/lib/product-suppliers"

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  try {
    const response = await requireProductSupplierPermission()
    if (response) return response
    const idProveedor = associationId((await params).id)
    const supplier = await db.proveedor.findUnique({
      where: { idProveedor },
      select: { idProveedor: true },
    })
    if (!supplier)
      throw new ProductSupplierError(
        "PROVEEDOR_NO_EXISTE",
        "El proveedor no existe.",
        404
      )
    const relations = await db.productoProveedor.findMany({
      where: { idProveedor },
      select: {
        producto: { select: { idProducto: true, nombre: true, estado: true } },
      },
      orderBy: { idProducto: "asc" },
    })
    const products = Array.from(
      new Map(
        relations.map(({ producto }) => [producto.idProducto, producto])
      ).values()
    )
    return NextResponse.json({ products, count: products.length })
  } catch (error) {
    return productSupplierErrorResponse(error)
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const response = await requireProductSupplierPermission(true)
    if (response) return response
    const idProveedor = associationId((await params).id)
    const ids = associationProductIds(await request.json())
    const result = await db.$transaction((tx) =>
      associateProducts(tx, idProveedor, ids)
    )
    return NextResponse.json({
      code: "PRODUCTOS_ASOCIADOS",
      message: "Asociaciones guardadas correctamente.",
      ...result,
    })
  } catch (error) {
    return productSupplierErrorResponse(error)
  }
}
