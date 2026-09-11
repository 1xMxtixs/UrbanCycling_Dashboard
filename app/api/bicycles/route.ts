// Endpoints generales de bicicletas para listar y registrar bicicletas vinculadas.
import { NextResponse } from "next/server"

import {
  MAX_BICYCLE_IMAGES,
  normalizarImagenesBicicleta,
} from "@/lib/bicycle-images"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

function getErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code)
  }

  return null
}

type BicycleWithRelations = Awaited<
  ReturnType<typeof db.bicicleta.findMany>
>[number] & {
  imagenes?: Array<{ idImagenBicicleta: number; urlImagen: string }>
  ordenDeTrabajo?: {
    estado: string
    montoTotal: unknown
    venta?: {
      cliente: {
        primerNombre: string | null
        apellidoPaterno: string | null
        apellidoMaterno: string | null
        razonSocial: string | null
        rut: string
      } | null
    }
  }
}

function mapBicycleResponse(bicycle: BicycleWithRelations) {
  const imagenUrl = bicycle.imagenes?.[0]?.urlImagen ?? null
  const imagenes =
    bicycle.imagenes?.map((imagen) => ({
      idImagenBicicleta: imagen.idImagenBicicleta,
      urlImagen: imagen.urlImagen,
      url: imagen.urlImagen,
    })) ?? []
  const ordenDeTrabajo = bicycle.ordenDeTrabajo
    ? {
        ...bicycle.ordenDeTrabajo,
        estadoOrden: bicycle.ordenDeTrabajo.estado,
        total: bicycle.ordenDeTrabajo.montoTotal,
        cliente: bicycle.ordenDeTrabajo.venta?.cliente,
      }
    : null

  return {
    ...bicycle,
    descripcion: bicycle.descripcionAdicional,
    imagenes,
    imagenesUrl: imagenes.map((imagen) => imagen.urlImagen),
    imagenUrl,
    ordenDeTrabajo,
  }
}

export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.BICYCLES_READ)

    if (response) {
      return response
    }

    const bicycles = await db.bicicleta.findMany({
      orderBy: {
        idBicicleta: "desc",
      },
      include: {
        imagenes: true,
        ordenDeTrabajo: {
          include: {
            venta: {
              include: {
                cliente: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(bicycles.map(mapBicycleResponse))
  } catch (error) {
    console.log("[BICYCLES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.BICYCLES_CREATE)

    if (response) {
      return response
    }

    const data = await request.json()
    const idOrdenDeTrabajo = Number(data.idOrdenDeTrabajo)
    const tipo = String(data.tipo ?? "urbana").trim()
    const marca = String(data.marca ?? "").trim()
    const modelo = String(data.modelo ?? "").trim()
    const color = String(data.color ?? "").trim()
    const imagenes = normalizarImagenesBicicleta(data)

    if (!Number.isInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
      return new NextResponse("Invalid work order id", { status: 400 })
    }

    if (!tipo || !marca || !modelo || !color) {
      return new NextResponse("Tipo, marca, modelo y color son obligatorios", {
        status: 400,
      })
    }

    if (imagenes.length > MAX_BICYCLE_IMAGES) {
      return NextResponse.json(
        {
          code: "MAX_IMAGENES_BICICLETA",
          message: `Solo se pueden asociar hasta ${MAX_BICYCLE_IMAGES} imagenes por bicicleta`,
        },
        { status: 400 }
      )
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
        tipo,
        marca,
        modelo,
        color,
        descripcionAdicional: data.descripcion ?? data.descripcionAdicional ?? null,
        imagenes: imagenes.length
          ? {
              create: imagenes.map((urlImagen) => ({
                urlImagen,
              })),
            }
          : undefined,
      },
      include: {
        imagenes: true,
        ordenDeTrabajo: {
          include: {
            venta: {
              include: {
                cliente: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(mapBicycleResponse(bicycle), { status: 201 })
  } catch (error) {
    console.log("[BICYCLES_POST]", error)

    const errorCode = getErrorCode(error)

    if (errorCode === "P2002") {
      return new NextResponse(
        "La orden seleccionada ya tiene una bicicleta vinculada.",
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
