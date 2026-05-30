// Endpoints generales del inventario para listar productos y registrar nuevos items.
import { NextResponse } from "next/server"
import { createInMemoryInventoryRepository } from "@/lib/inventory/inMemoryInventoryRepository"

const inventoryRepository = createInMemoryInventoryRepository()

export async function GET() {
  try {
    const products = await inventoryRepository.findMany()

    return NextResponse.json(products)
  } catch (error) {
    console.log("[INVENTORY_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const existingProduct = await inventoryRepository.findByName(data.nombre)

    if (existingProduct) {
      return new NextResponse("Product already exists", { status: 409 })
    }

    const product = await inventoryRepository.create(data)

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.log("[INVENTORY_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
