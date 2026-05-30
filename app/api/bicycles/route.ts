// Endpoints generales de bicicletas para listar registros y crear nuevas bicicletas.
import { NextResponse } from "next/server"

import { createInMemoryBicycleRepository } from "@/lib/bicycles/inMemoryBicycleRepository"

const bicycleRepository = createInMemoryBicycleRepository()

export async function GET() {
  try {
    const bicycles = await bicycleRepository.findMany()

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
