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

function parsePositiveInteger(value: string) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN
  }

  return parsedValue
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

  const singleUrl = data.urlImagen ?? data.url ?? data.imagenUrl
  const imagenUrl = singleUrl ? String(singleUrl).trim() : ""

  return Array.from(new Set([imagenUrl, ...urls].filter(Boolean)))
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.BICYCLES_UPDATE)

    if (response) {
      return response
    }

    const { id } = await context.params
    const bicycleId = parsePositiveInteger(id)

    if (Number.isNaN(bicycleId)) {
      return new NextResponse("Invalid bicycle id", { status: 400 })
    }

    const data = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const imagenes = normalizarImagenes(data)

    if (imagenes.length === 0) {
      return NextResponse.json(
        {
          code: "IMAGEN_REQUERIDA",
          message: "Debe indicar al menos una imagen",
        },
        { status: 400 }
      )
    }

    const bicycle = await db.bicicleta.findUnique({
      where: {
        idBicicleta: bicycleId,
      },
      include: {
        imagenes: true,
      },
    })

    if (!bicycle) {
      return new NextResponse("Bicycle not found", { status: 404 })
    }

    if (bicycle.imagenes.length + imagenes.length > MAX_BICYCLE_IMAGES) {
      return NextResponse.json(
        {
          code: "MAX_IMAGENES_BICICLETA",
          message: `Solo se pueden asociar hasta ${MAX_BICYCLE_IMAGES} imagenes por bicicleta`,
        },
        { status: 400 }
      )
    }

    const created = await db.$transaction(
      imagenes.map((urlImagen) =>
        db.imagenBicicleta.create({
          data: {
            idBicicleta: bicycleId,
            urlImagen,
          },
        })
      )
    )

    return NextResponse.json(
      created.map((imagen) => ({
        ...imagen,
        url: imagen.urlImagen,
      })),
      { status: 201 }
    )
  } catch (error) {
    console.log("[BICYCLES_IMAGES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
