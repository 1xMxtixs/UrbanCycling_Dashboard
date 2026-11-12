import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import {
  bloquearOrdenesTrabajo,
  exigirOrdenAbierta,
  respuestaErrorBicicleta,
  BicycleOrderError,
} from "@/app/api/_lib/work-order-lock"
import { encolarBorrado, intentarBorrado } from "@/app/api/_lib/image-jobs"

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
    const { session, response } = await requirePermission(
      PERMISSIONS.BICYCLES_UPDATE
    )

    if (response || !session) {
      return response ?? new NextResponse("No autorizado", { status: 401 })
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

    const bicicleta = await db.bicicleta.findUnique({
      where: { idBicicleta: bicycleId },
    })
    if (!bicicleta)
      return new NextResponse("Bicycle not found", { status: 404 })
    const limpiezaId = await db.$transaction(async (tx) => {
      await bloquearOrdenesTrabajo(tx, [bicicleta.idOrdenDeTrabajo])
      const actual = await tx.bicicleta.findUnique({
        where: { idBicicleta: bicycleId },
      })
      if (!actual || actual.idOrdenDeTrabajo !== bicicleta.idOrdenDeTrabajo)
        throw new BicycleOrderError(
          409,
          "BICICLETA_MODIFICADA",
          "La bicicleta cambió; vuelva a intentar"
        )
      await exigirOrdenAbierta(tx, actual.idOrdenDeTrabajo)
      const imagen = await tx.imagenBicicleta.findFirst({
        where: { idImagenBicicleta: bicycleImageId, idBicicleta: bicycleId },
      })
      if (!imagen) return null
      const job = await encolarBorrado(
        tx,
        [imagen.urlImagen],
        session.user.idUsuario,
        bicycleId
      )
      await tx.imagenBicicleta.delete({
        where: { idImagenBicicleta: bicycleImageId },
      })
      return job
    })
    const limpieza = await intentarBorrado(limpiezaId)
    if (limpieza.pendientes !== 0)
      return NextResponse.json({ eliminada: true, limpiezaArchivos: limpieza })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const response = respuestaErrorBicicleta(error)
    if (response) return response
    console.log("[BICYCLES_IMAGES_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
