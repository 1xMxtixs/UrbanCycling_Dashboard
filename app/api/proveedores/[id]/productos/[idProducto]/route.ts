import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  associationId,
  lockSupplier,
  ProductSupplierError,
  productSupplierErrorResponse,
  requireProductSupplierPermission,
} from "@/lib/product-suppliers"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; idProducto: string }> }
) {
  try {
    const response = await requireProductSupplierPermission(true)
    if (response) return response
    const values = await params
    const idProveedor = associationId(values.id)
    const idProducto = associationId(values.idProducto)
    const result = await db.$transaction(async (tx) => {
      // Se permite retirar asociaciones incluso si el proveedor o producto está inactivo.
      await lockSupplier(tx, idProveedor, false)
      const product = await tx.producto.findUnique({
        where: { idProducto },
        select: { idProducto: true },
      })
      if (!product)
        throw new ProductSupplierError(
          "PRODUCTO_NO_EXISTE",
          "El producto no existe.",
          404
        )
      return tx.productoProveedor.deleteMany({
        where: { idProveedor, idProducto },
      })
    })
    return NextResponse.json({
      code: "PRODUCTO_DESVINCULADO",
      message: "Asociación retirada.",
      eliminadas: result.count,
    })
  } catch (error) {
    return productSupplierErrorResponse(error)
  }
}
