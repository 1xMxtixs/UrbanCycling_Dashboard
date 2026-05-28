// Endpoints generales del inventario para listar productos y registrar nuevos items.
import { NextResponse } from "next/server"

import { createInMemoryInventoryRepository } from "@/lib/inventory/inMemoryInventoryRepository"
import type {
  InventoryProductFilters,
  ProductStatus,
} from "@/lib/inventory/types"

const inventoryRepository = createInMemoryInventoryRepository()

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback
  }

  return parsedValue
}

function parseInventoryFilters(searchParams: URLSearchParams) {
  const page = parsePositiveInteger(searchParams.get("page"), 1)
  const limit = Math.min(
    parsePositiveInteger(searchParams.get("limit"), 20),
    100
  )
  const categoriaId = Number(searchParams.get("categoriaId"))
  const estado = searchParams.get("estado")
  const filters: InventoryProductFilters = {
    search: searchParams.get("search")?.trim() || undefined,
    tipo: searchParams.get("tipo")?.trim() || undefined,
    estado:
      estado === "activo" || estado === "inactivo"
        ? (estado as ProductStatus)
        : undefined,
    categoriaId:
      Number.isInteger(categoriaId) && categoriaId > 0
        ? categoriaId
        : undefined,
    lowStock: searchParams.get("lowStock") === "true" ? true : undefined,
  }

  return { filters, page, limit }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { filters, page, limit } = parseInventoryFilters(searchParams)
    const products = await inventoryRepository.findMany(filters, {
      page,
      limit,
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
