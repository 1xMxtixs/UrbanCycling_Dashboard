// Endpoints del inventario para consultar, actualizar o eliminar un producto por ID.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function parseProductId(id: string): number {
  const productId = Number(id)

  if (!Number.isInteger(productId) || productId <= 0) {
    return Number.NaN
  }

  return productId
}

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

function validateStockMinimum(stockMinimo: unknown) {
  if (stockMinimo === undefined || stockMinimo === null || stockMinimo === "") {
    return NextResponse.json(
      {
        code: "STOCK_MINIMO_NO_CONFIGURADO",
        message:
          "Debe definir un stock mínimo para el producto antes de guardarlo.",
      },
      { status: 422 },
    )
  }

  if (
    typeof stockMinimo !== "number" ||
    !Number.isInteger(stockMinimo) ||
    stockMinimo < 0
  ) {
    return NextResponse.json(
      {
        code: "STOCK_MINIMO_INVALIDO",
        message: "El stock mínimo debe ser un número entero mayor o igual a 0.",
      },
      { status: 422 },
    )
  }

  return null
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_READ)

    if (response) {
      return response
    }

    const { id } = await context.params
    const productId = parseProductId(id)

    if (Number.isNaN(productId)) {
      return new NextResponse("Invalid product id", { status: 400 })
    }

    const product = await db.producto.findUnique({
      where: {
        idProducto: productId,
      },
    })

    if (!product) {
      return new NextResponse("Product not found", { status: 404 })
    }

    return NextResponse.json(withImageAlias(product))
  } catch (error) {
    console.log("[INVENTORY_ID_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_UPDATE)

    if (response) {
      return response
    }

    const { id } = await context.params
    const productId = parseProductId(id)
    const data = await request.json()

    if (Number.isNaN(productId)) {
      return new NextResponse("Invalid product id", { status: 400 })
    }

    if ("stockMinimo" in data) {
      const stockMinimumValidation = validateStockMinimum(data.stockMinimo)

      if (stockMinimumValidation) {
        return stockMinimumValidation
      }
    }

    if (data.nombre) {
      const existingProduct = await db.producto.findUnique({
        where: {
          nombre: data.nombre,
        },
      })

      if (existingProduct && existingProduct.idProducto !== productId) {
        return new NextResponse("Product already exists", { status: 409 })
      }
    }

    const productExists = await db.producto.findUnique({
      where: {
        idProducto: productId,
      },
    })

    if (!productExists) {
      return new NextResponse("Product not found", { status: 404 })
    }

    const product = await db.producto.update({
      where: {
        idProducto: productId,
      },
      data: {
        tipoProducto: data.tipoProducto,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precioVenta: data.precioVenta,
        costoPromedio: data.costoPromedio ?? data.precioCosto,
        stockActual: data.stockActual,
        stockMinimo: data.stockMinimo,
        estado: data.estado,
        urlImagen: data.urlImagen ?? data.imageUrl,
      },
    })

    return NextResponse.json(withImageAlias(product))
  } catch (error) {
    console.log("[INVENTORY_ID_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_DELETE)

    if (response) {
      return response
    }

    const { id } = await context.params
    const productId = parseProductId(id)

    if (Number.isNaN(productId)) {
      return new NextResponse("Invalid product id", { status: 400 })
    }

    const product = await db.producto.findUnique({
      where: {
        idProducto: productId,
      },
    })

    if (!product) {
      return new NextResponse("Product not found", { status: 404 })
    }

    await db.producto.delete({
      where: {
        idProducto: productId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log("[INVENTORY_ID_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
