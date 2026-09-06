import { NextResponse } from "next/server"

import {
  MAX_BICYCLE_IMAGES,
  normalizarImagenesBicicleta,
} from "@/lib/bicycle-images"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

const POST_DELAY_MS = 1_000

function esperar(milisegundos: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milisegundos)
  })
}

function parsePositiveInteger(value: string) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN
  }

  return parsedValue
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
    const imagenes = normalizarImagenesBicicleta(data)

    if (imagenes.length === 0) {
      return NextResponse.json(
        {
          code: "IMAGEN_REQUERIDA",
          message: "Debe indicar al menos una imagen",
        },
        { status: 400 }
      )
    }

    const created = await db.$transaction(async (tx) => {
      // El bloqueo de la bicicleta serializa POST concurrentes/simultaneos, incluso entre instancias.
      const bicycles = await tx.$queryRaw<Array<{ idBicicleta: number }>>`
        SELECT id_bicicleta AS idBicicleta
        FROM bicicletas
        WHERE id_bicicleta = ${bicycleId}
        FOR UPDATE
      `

      if (bicycles.length === 0) {
        throw new BicycleNotFoundError()
      }

      await esperar(POST_DELAY_MS)

      const imagenesActuales = await tx.imagenBicicleta.count({
        where: { idBicicleta: bicycleId },
      })

      if (imagenesActuales + imagenes.length > MAX_BICYCLE_IMAGES) {
        throw new BicycleImagesLimitError()
      }

      return Promise.all(
        imagenes.map((urlImagen) =>
          tx.imagenBicicleta.create({
            data: {
              idBicicleta: bicycleId,
              urlImagen,
            },
          })
        )
      )
    }, {
      maxWait: 30_000,
      timeout: 30_000,
    })

    return NextResponse.json(
      created.map((imagen) => ({
        ...imagen,
        url: imagen.urlImagen,
      })),
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof BicycleNotFoundError) {
      return new NextResponse("Bicycle not found", { status: 404 })
    }

    if (error instanceof BicycleImagesLimitError) {
      return NextResponse.json(
        {
          code: "MAX_IMAGENES_BICICLETA",
          message: `Solo se pueden asociar hasta ${MAX_BICYCLE_IMAGES} imagenes por bicicleta`,
        },
        { status: 400 }
      )
    }

    console.log("[BICYCLES_IMAGES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

class BicycleNotFoundError extends Error {}

class BicycleImagesLimitError extends Error {}
