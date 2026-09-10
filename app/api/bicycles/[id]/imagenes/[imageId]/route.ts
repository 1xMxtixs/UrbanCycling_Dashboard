import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{
    id: string
    imageId: string
  }>
}

function parsePositiveInteger(value: string) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN
  }

  return parsedValue
}

export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.BICYCLES_UPDATE)

    if (response) {
      return response
    }

    const { id, imageId } = await context.params
    const bicycleId = parsePositiveInteger(id)
    const bicycleImageId = parsePositiveInteger(imageId)

    if (Number.isNaN(bicycleId) || Number.isNaN(bicycleImageId)) {
      return new NextResponse("Invalid image id", { status: 400 })
    }

    const image = await db.imagenBicicleta.findFirst({
      where: {
        idImagenBicicleta: bicycleImageId,
        idBicicleta: bicycleId,
      },
    })

    if (!image) {
      return new NextResponse("Image not found", { status: 404 })
    }

    await db.imagenBicicleta.delete({
      where: {
        idImagenBicicleta: bicycleImageId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log("[BICYCLES_IMAGES_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
