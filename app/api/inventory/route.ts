// Endpoints generales del inventario para listar productos y registrar nuevos items.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

export async function GET() {
  try {
    const { response } = await requireAuth()

    if (response) {
      return response
    }

    const products = await db.producto.findMany({
      orderBy: {
        idProducto: "desc",
      },
      include: {
        imagenesProducto: true,
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.log("[INVENTORY_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { response } = await requireAuth()

    if (response) {
      return response
    }

    const data = await request.json()
    const existingProduct = await db.producto.findUnique({
      where: {
        nombre: data.nombre,
      },
    })

    if (existingProduct) {
      return new NextResponse("Product already exists", { status: 409 })
    }

    const product = await db.producto.create({
      data: {
        tipoProducto: data.tipoProducto,
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        precioVenta: data.precioVenta,
        stockActual: data.stockActual,
        stockMinimo: data.stockMinimo,
        estado: data.estado,
        // Si se subió imagen, crear el registro en ImagenesProducto
        ...(data.imageUrl && {
          imagenesProducto: {
            create: {
              url: data.imageUrl,
            },
          },
        }),
      },
      include: {
        imagenesProducto: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.log("[INVENTORY_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
