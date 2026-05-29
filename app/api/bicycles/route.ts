// Endpoints generales de bicicletas para listar registros y crear nuevas bicicletas.
import { NextResponse } from "next/server"

import { createInMemoryBicycleRepository } from "@/lib/bicycles/inMemoryBicycleRepository"
import type { BicycleFilters } from "@/lib/bicycles/types"

const bicycleRepository = createInMemoryBicycleRepository()

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback
  }

  return parsedValue
}

function parseBicycleFilters(searchParams: URLSearchParams) {
  const page = parsePositiveInteger(searchParams.get("page"), 1)
  const limit = Math.min(
    parsePositiveInteger(searchParams.get("limit"), 20),
    100
  )
  const idVenta = Number(searchParams.get("id_venta"))
  const filters: BicycleFilters = {
    search: searchParams.get("search")?.trim() || undefined,
    id_venta: Number.isInteger(idVenta) && idVenta > 0 ? idVenta : undefined,
    marca: searchParams.get("marca")?.trim() || undefined,
    modelo: searchParams.get("modelo")?.trim() || undefined,
    color: searchParams.get("color")?.trim() || undefined,
  }

  return { filters, page, limit }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { filters, page, limit } = parseBicycleFilters(searchParams)
    const bicycles = await bicycleRepository.findMany(filters, { page, limit })

    return NextResponse.json(bicycles)
  } catch (error) {
    console.log("[BICYCLES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const bicycle = await bicycleRepository.create(data)

    return NextResponse.json(bicycle, { status: 201 })
  } catch (error) {
    console.log("[BICYCLES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
