// Endpoint para consultar los productos cuyo stock alcanzó su umbral mínimo.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

function withImageAlias(product: {
  idProducto: number
  urlImagen: string
}) {
  return {
    ...product,
    imagenesProducto: product.urlImagen
      ? [
          {
            idImagenProducto: product.idProducto,
            idProducto: product.idProducto,
            url: product.urlImagen,
          },
        ]
      : [],
  }
}

export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_READ)

    if (response) {
      return response
    }

    const products = await db.producto.findMany({
      orderBy: [{ stockActual: "asc" }, { idProducto: "desc" }],
    })

    // stockMinimo es obligatorio en el esquema. La validación se conserva para
    // proteger el caso de datos heredados o inconsistentes en la base de datos.
    const productsWithoutMinimum = products.filter(
      (product) => product.stockMinimo == null,
    )

    if (productsWithoutMinimum.length > 0) {
      return NextResponse.json(
        {
          code: "STOCK_MINIMO_NO_CONFIGURADO",
          message:
            "Hay productos sin stock mínimo configurado. Defina el umbral antes de consultar los productos críticos.",
          products: productsWithoutMinimum.map(withImageAlias),
          count: productsWithoutMinimum.length,
        },
        { status: 422 },
      )
    }

    const criticalProducts = products.filter(
      (product) => product.stockActual <= product.stockMinimo,
    )

    return NextResponse.json({
      code:
        criticalProducts.length > 0
          ? "STOCK_BAJO_ENCONTRADO"
          : "SIN_STOCK_BAJO",
      message:
        criticalProducts.length > 0
          ? "Productos con stock igual o inferior al mínimo configurado."
          : "No existen productos con stock igual o inferior al mínimo configurado.",
      products: criticalProducts.map(withImageAlias),
      count: criticalProducts.length,
    })
  } catch (error) {
    console.log("[INVENTORY_LOW_STOCK_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
