// Endpoints de bicicletas para consultar, actualizar o eliminar un registro por ID.
import { NextResponse } from "next/server"

import {
  MAX_BICYCLE_IMAGES,
  normalizarImagenesBicicleta,
} from "@/lib/bicycle-images"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import {
  BicycleOrderError,
  bloquearOrdenesTrabajo,
  exigirOrdenAbierta,
  respuestaErrorBicicleta,
} from "@/app/api/_lib/work-order-lock"
import {
  ImagenError,
  prepararImagenes,
  confirmarPreparadas,
  liberarPreparadas,
  limpiarConfirmadas,
  encolarBorrado,
  intentarBorrado,
  type Preparada,
} from "@/app/api/_lib/image-jobs"

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
  let preparadas: Preparada[] = []
  let guardada = false
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.BICYCLES_UPDATE
    )

    if (response || !session) {
      return response ?? new NextResponse("No autorizado", { status: 401 })
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

    const idOrdenDeTrabajo =
      data.idOrdenDeTrabajo === undefined
        ? bicycleExists.idOrdenDeTrabajo
        : Number(data.idOrdenDeTrabajo)
    if (!Number.isInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
      return new NextResponse("Invalid work order id", { status: 400 })
    }

    const imagenes = normalizarImagenesBicicleta(data)
    const replaceImages =
      data.imagenesTemporales !== undefined ||
      "imagenes" in data ||
      "imagenesUrl" in data ||
      "imagenesUrls" in data ||
      "imagenUrl" in data

    if (imagenes.some((url) => url.includes("/tmp/bicicletas/")))
      throw new ImagenError(
        "Las imágenes temporales deben confirmarse mediante su identificador firmado"
      )
    if (
      data.imagenesTemporales !== undefined &&
      (!Array.isArray(data.imagenesTemporales) ||
        data.imagenesTemporales.length > MAX_BICYCLE_IMAGES)
    )
      throw new ImagenError("Lista de imágenes temporales inválida")
    if (
      replaceImages &&
      imagenes.length + (data.imagenesTemporales?.length ?? 0) >
        MAX_BICYCLE_IMAGES
    ) {
      return NextResponse.json(
        {
          code: "MAX_IMAGENES_BICICLETA",
          message: `Solo se pueden asociar hasta ${MAX_BICYCLE_IMAGES} imagenes por bicicleta`,
        },
        { status: 400 }
      )
    }

    preparadas = await prepararImagenes(
      data.imagenesTemporales,
      session.user.idUsuario,
      bicycleId
    )
    const finales = [
      ...new Set([...imagenes, ...preparadas.map((p) => p.job.url)]),
    ]
    const resultado = await db.$transaction(async (tx) => {
      await bloquearOrdenesTrabajo(tx, [
        bicycleExists.idOrdenDeTrabajo,
        idOrdenDeTrabajo,
      ])
      const actual = await tx.bicicleta.findUnique({
        where: { idBicicleta: bicycleId },
        include: { imagenes: true },
      })
      if (!actual)
        throw new BicycleOrderError(
          404,
          "BICICLETA_NO_EXISTE",
          "La bicicleta no existe"
        )
      if (actual.idOrdenDeTrabajo !== bicycleExists.idOrdenDeTrabajo) {
        throw new BicycleOrderError(
          409,
          "BICICLETA_MODIFICADA",
          "La bicicleta cambió de orden; vuelva a intentar"
        )
      }
      await exigirOrdenAbierta(tx, actual.idOrdenDeTrabajo)
      await exigirOrdenAbierta(tx, idOrdenDeTrabajo)
      if (
        data.imagenesTemporales !== undefined &&
        imagenes.some(
          (url) => !actual.imagenes.some((i) => i.urlImagen === url)
        )
      )
        throw new ImagenError(
          "Solo se pueden conservar imágenes actuales o confirmar nuevas subidas",
          409
        )
      await confirmarPreparadas(tx, preparadas, bicycleId)
      const limpiezaId = await encolarBorrado(
        tx,
        replaceImages
          ? actual.imagenes
              .map((i) => i.urlImagen)
              .filter((url) => !finales.includes(url))
          : [],
        session.user.idUsuario,
        bicycleId
      )
      const bicycle = await tx.bicicleta.update({
        where: {
          idBicicleta: bicycleId,
        },
        data: {
          idOrdenDeTrabajo,
          tipo: data.tipo,
          marca: data.marca,
          modelo: data.modelo,
          color: data.color,
          descripcionAdicional:
            data.descripcionAdicional ?? data.descripcion ?? undefined,
          imagenes: replaceImages
            ? {
                deleteMany: {},
                create: finales.map((urlImagen) => ({
                  urlImagen,
                })),
              }
            : undefined,
        },
        include: {
          imagenes: true,
        },
      })
      return { bicycle, limpiezaId }
    })
    guardada = true
    await limpiarConfirmadas(preparadas)
    const limpiezaArchivos = await intentarBorrado(resultado.limpiezaId)
    return NextResponse.json({
      ...mapBicycleResponse(resultado.bicycle),
      limpiezaArchivos,
    })
  } catch (error) {
    if (!guardada) await liberarPreparadas(preparadas)
    if (error instanceof ImagenError)
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    const response = respuestaErrorBicicleta(error)
    if (response) return response
    console.log("[BICYCLES_ID_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.BICYCLES_DELETE
    )

    if (response || !session) {
      return response ?? new NextResponse("No autorizado", { status: 401 })
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

    const limpiezaId = await db.$transaction(async (tx) => {
      await bloquearOrdenesTrabajo(tx, [bicycle.idOrdenDeTrabajo])
      const actual = await tx.bicicleta.findUnique({
        where: { idBicicleta: bicycleId },
        include: { imagenes: true },
      })
      if (!actual) return null
      if (actual.idOrdenDeTrabajo !== bicycle.idOrdenDeTrabajo)
        throw new BicycleOrderError(
          409,
          "BICICLETA_MODIFICADA",
          "La bicicleta cambió de orden; vuelva a intentar"
        )
      const job = await encolarBorrado(
        tx,
        actual.imagenes.map((i) => i.urlImagen),
        session.user.idUsuario,
        bicycleId
      )
      await tx.imagenBicicleta.deleteMany({ where: { idBicicleta: bicycleId } })
      await tx.bicicleta.delete({ where: { idBicicleta: bicycleId } })
      return job
    })
    const limpieza = await intentarBorrado(limpiezaId)
    if (limpieza.pendientes !== 0)
      return NextResponse.json({ eliminada: true, limpiezaArchivos: limpieza })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    const response = respuestaErrorBicicleta(error)
    if (response) return response
    console.log("[BICYCLES_ID_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
