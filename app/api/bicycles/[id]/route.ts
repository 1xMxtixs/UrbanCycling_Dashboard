// Endpoints de bicicletas para consultar, actualizar o eliminar un registro por ID.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

const MAX_BICYCLE_IMAGES = 8

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type BicycleResponse = {
  idBicicleta: number
  idOrdenDeTrabajo: number
  tipo: string
  marca: string
  modelo: string
  color: string
  descripcionAdicional: string | null
  imagenes?: Array<{ idImagenBicicleta: number; urlImagen: string }>
  ordenDeTrabajo?: unknown
}

function parseBicycleId(id: string): number {
  const bicycleId = Number(id)

  if (!Number.isInteger(bicycleId) || bicycleId <= 0) {
    return Number.NaN
  }

  return bicycleId
}

function mapBicycleResponse(bicycle: BicycleResponse) {
  const imagenes =
    bicycle.imagenes?.map((imagen) => ({
      idImagenBicicleta: imagen.idImagenBicicleta,
      urlImagen: imagen.urlImagen,
      url: imagen.urlImagen,
    })) ?? []

  return {
    ...bicycle,
    descripcion: bicycle.descripcionAdicional,
    imagenes,
    imagenesUrl: imagenes.map((imagen) => imagen.urlImagen),
    imagenUrl: imagenes[0]?.urlImagen ?? null,
  }
}

function normalizarImagenes(data: Record<string, unknown>) {
  const rawImages = data.imagenes ?? data.imagenesUrl ?? data.imagenesUrls
  const urls = Array.isArray(rawImages)
    ? rawImages
        .map((image) => {
          if (typeof image === "string") {
            return image.trim()
          }

          if (image && typeof image === "object" && "urlImagen" in image) {
            return String(image.urlImagen ?? "").trim()
          }

          if (image && typeof image === "object" && "url" in image) {
            return String(image.url ?? "").trim()
          }

          return ""
        })
        .filter(Boolean)
    : []

  const imagenUrl = data.imagenUrl ? String(data.imagenUrl).trim() : ""

  return Array.from(new Set([imagenUrl, ...urls].filter(Boolean)))
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.BICYCLES_READ)

    if (response) {
      return response
    }

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
        imagenes: true,
        ordenDeTrabajo: true,
      },
    })

    if (!bicycle) {
      return new NextResponse("Bicycle not found", { status: 404 })
    }

    return NextResponse.json(mapBicycleResponse(bicycle))
  } catch (error) {
    console.log("[BICYCLES_ID_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.BICYCLES_UPDATE)

    if (response) {
      return response
    }

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
      const idOrdenDeTrabajo = Number(data.idOrdenDeTrabajo)

      if (!Number.isInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
        return new NextResponse("Invalid work order id", { status: 400 })
      }

      const existingWorkOrder = await db.ordenDeTrabajo.findUnique({
        where: {
          idOrdenDeTrabajo,
        },
      })

      if (!existingWorkOrder) {
        return new NextResponse("Work order not found", { status: 404 })
      }
    }

    const imagenes = normalizarImagenes(data)
    const replaceImages =
      "imagenes" in data ||
      "imagenesUrl" in data ||
      "imagenesUrls" in data ||
      "imagenUrl" in data

    if (replaceImages && imagenes.length > MAX_BICYCLE_IMAGES) {
      return NextResponse.json(
        {
          code: "MAX_IMAGENES_BICICLETA",
          message: `Solo se pueden asociar hasta ${MAX_BICYCLE_IMAGES} imagenes por bicicleta`,
        },
        { status: 400 }
      )
    }

    const bicycle = await db.bicicleta.update({
      where: {
        idBicicleta: bicycleId,
      },
      data: {
        idOrdenDeTrabajo: data.idOrdenDeTrabajo,
        tipo: data.tipo,
        marca: data.marca,
        modelo: data.modelo,
        color: data.color,
        descripcionAdicional:
          data.descripcionAdicional ?? data.descripcion ?? undefined,
        imagenes: replaceImages
          ? {
              deleteMany: {},
              create: imagenes.map((urlImagen) => ({
                urlImagen,
              })),
            }
          : undefined,
      },
      include: {
        imagenes: true,
      },
    })

    return NextResponse.json(mapBicycleResponse(bicycle))
  } catch (error) {
    console.log("[BICYCLES_ID_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.BICYCLES_DELETE)

    if (response) {
      return response
    }

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
