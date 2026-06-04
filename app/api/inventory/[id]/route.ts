// Endpoints del inventario para consultar, actualizar o eliminar un producto por ID.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

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

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { response } = await requireAuth()

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

    return NextResponse.json(product)
  } catch (error) {
    console.log("[INVENTORY_ID_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requireAuth()

    if (response) {
      return response
    }

    const { id } = await context.params
    const productId = parseProductId(id)
    const data = await request.json()

    if (Number.isNaN(productId)) {
      return new NextResponse("Invalid product id", { status: 400 })
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
        stockActual: data.stockActual,
        stockMinimo: data.stockMinimo,
        estado: data.estado,
      },
    })

    return NextResponse.json(product)
  } catch (error) {
    console.log("[INVENTORY_ID_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { response } = await requireAuth()

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
