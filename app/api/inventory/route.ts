// Endpoints generales del inventario para listar productos y registrar nuevos items.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export async function GET() {
  try {
    const products = await db.producto.findMany({
      orderBy: {
        idProducto: "desc",
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
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.log("[INVENTORY_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
