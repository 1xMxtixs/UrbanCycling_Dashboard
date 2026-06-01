// Endpoints generales de bicicletas para listar registros y crear nuevas bicicletas.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export async function GET() {
  try {
    const bicycles = await db.bicicleta.findMany({
      orderBy: {
        idBicicleta: "desc",
      },
      include: {
        ordenDeTrabajo: true,
      },
    })

    return NextResponse.json(bicycles)
  } catch (error) {
    console.log("[BICYCLES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const existingWorkOrder = await db.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo: data.idOrdenDeTrabajo,
      },
    })

    if (!existingWorkOrder) {
      return new NextResponse("Work order not found", { status: 404 })
    }

    const existingBicycle = await db.bicicleta.findUnique({
      where: {
        idOrdenDeTrabajo: data.idOrdenDeTrabajo,
      },
    })

    if (existingBicycle) {
      return new NextResponse("Work order already has a bicycle", {
        status: 409,
      })
    }

    const bicycle = await db.bicicleta.create({
      data: {
        idOrdenDeTrabajo: data.idOrdenDeTrabajo,
        marca: data.marca,
        modelo: data.modelo,
        color: data.color,
        descripcion: data.descripcion ?? null,
      },
    })

    return NextResponse.json(bicycle, { status: 201 })
  } catch (error) {
    console.log("[BICYCLES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}