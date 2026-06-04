
import { NextResponse } from "next/server"

import { db } from "@/lib/db"

function getErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code)
  }

  return null
}

export async function GET() {
  try {
    const bicycles = await db.bicicleta.findMany({
      orderBy: {
        idBicicleta: "desc",
      },
      include: {
        ordenDeTrabajo: {
          include: {
            cliente: true,
          },
        },
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
    const idOrdenDeTrabajo = Number(data.idOrdenDeTrabajo)
    const marca = String(data.marca ?? "").trim()
    const modelo = String(data.modelo ?? "").trim()
    const color = String(data.color ?? "").trim()

    if (!Number.isInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
      return new NextResponse("Invalid work order id", { status: 400 })
    }

    if (!marca || !modelo || !color) {
      return new NextResponse("Marca, modelo y color son obligatorios", {
        status: 400,
      })
    }

    const existingWorkOrder = await db.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo,
      },
    })

    if (!existingWorkOrder) {
      return new NextResponse("Work order not found", { status: 404 })
    }

    const bicycle = await db.bicicleta.create({
      data: {
        idOrdenDeTrabajo,
        marca,
        modelo,
        color,
        descripcion: data.descripcion ?? null,
        imagenUrl: data.imagenUrl ?? null,
      },
    })

    return NextResponse.json(bicycle, { status: 201 })
  } catch (error) {
    console.log("[BICYCLES_POST]", error)

    const errorCode = getErrorCode(error)

    if (errorCode === "P2002") {
      return new NextResponse(
        "La orden seleccionada ya tiene una bicicleta vinculada. Aplica las migraciones para permitir varias bicicletas por orden.",
        { status: 409 }
      )
    }

    if (errorCode === "P2022") {
      return new NextResponse(
        "La base de datos no esta sincronizada. Ejecuta las migraciones pendientes.",
        { status: 500 }
      )
    }

    return new NextResponse("Internal Error", { status: 500 })
  }
}
