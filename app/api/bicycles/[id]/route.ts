// Endpoints de bicicletas para consultar, actualizar o eliminar un registro por ID.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"

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

    const bicycle = await db.bicicleta.findUnique({
      where: {
        idBicicleta: bicycleId,
      },
      include: {
        ordenDeTrabajo: true,
      },
    })

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

    const bicycleExists = await db.bicicleta.findUnique({
      where: {
        idBicicleta: bicycleId,
      },
    })

    if (!bicycleExists) {
      return new NextResponse("Bicycle not found", { status: 404 })
    }

    if (
      data.idOrdenDeTrabajo &&
      data.idOrdenDeTrabajo !== bicycleExists.idOrdenDeTrabajo
    ) {
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

      if (existingBicycle && existingBicycle.idBicicleta !== bicycleId) {
        return new NextResponse("Work order already has a bicycle", {
          status: 409,
        })
      }
    }

    const bicycle = await db.bicicleta.update({
      where: {
        idBicicleta: bicycleId,
      },
      data: {
        idOrdenDeTrabajo: data.idOrdenDeTrabajo,
        marca: data.marca,
        modelo: data.modelo,
        color: data.color,
        descripcion: data.descripcion,
      },
    })

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

    const bicycle = await db.bicicleta.findUnique({
      where: {
        idBicicleta: bicycleId,
      },
    })

    if (!bicycle) {
      return new NextResponse("Bicycle not found", { status: 404 })
    }

    await db.bicicleta.delete({
      where: {
        idBicicleta: bicycleId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log("[BICYCLES_ID_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}