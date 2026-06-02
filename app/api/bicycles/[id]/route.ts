// Endpoints de bicicletas para consultar, actualizar o eliminar un registro por ID.
import { NextResponse } from "next/server"

import { createInMemoryBicycleRepository } from "@/lib/bicycles/inMemoryBicycleRepository"

const bicycleRepository = createInMemoryBicycleRepository()

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function parseBicycleId(id: string): number {
  const bicycleId = Number(id)

  if (!Number.isInteger(bicycleId) || bicycleId <= 0) {
    return Number.NaN
  }

  return bicycleId
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const bicycleId = parseBicycleId(id)

    if (Number.isNaN(bicycleId)) {
      return new NextResponse("Invalid bicycle id", { status: 400 })
    }

    const bicycle = await bicycleRepository.findById(bicycleId)

    if (!bicycle) {
      return new NextResponse("Bicycle not found", { status: 404 })
    }

    return NextResponse.json(bicycle)
  } catch (error) {
    console.log("[BICYCLES_ID_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const bicycleId = parseBicycleId(id)
    const data = await request.json()

    if (Number.isNaN(bicycleId)) {
      return new NextResponse("Invalid bicycle id", { status: 400 })
    }

    const bicycle = await bicycleRepository.update(bicycleId, data)

    if (!bicycle) {
      return new NextResponse("Bicycle not found", { status: 404 })
    }

    return NextResponse.json(bicycle)
  } catch (error) {
    console.log("[BICYCLES_ID_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const bicycleId = parseBicycleId(id)

    if (Number.isNaN(bicycleId)) {
      return new NextResponse("Invalid bicycle id", { status: 400 })
    }

    const deletedBicycle = await bicycleRepository.delete(bicycleId)

    if (!deletedBicycle) {
      return new NextResponse("Bicycle not found", { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log("[BICYCLES_ID_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
