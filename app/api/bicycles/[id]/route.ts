// Endpoints de bicicletas para consultar, actualizar o eliminar un registro por ID.
import { NextResponse } from "next/server"

import {
  MAX_BICYCLE_IMAGES,
  normalizarImagenesBicicleta,
} from "@/lib/bicycle-images"
import { registrarAuditoriaBicicleta } from "@/lib/bicycle-audit"
import {
  actualizarBicicletaSchema,
  normalizarPayloadBicicleta,
  respuestaValidacionBicicleta,
} from "@/lib/bicycle-validation"
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

/** Actualiza parcialmente una bicicleta asociada a una ODT abierta. */
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

    if (Number.isNaN(bicycleId)) {
      return new NextResponse("Invalid bicycle id", { status: 400 })
    }

    const rawData = await request.json()
    const payload = normalizarPayloadBicicleta(rawData)
    const resultadoValidacion = actualizarBicicletaSchema.safeParse(payload)

    if (!resultadoValidacion.success) {
      return NextResponse.json(
        respuestaValidacionBicicleta(resultadoValidacion.error),
        { status: 400 }
      )
    }

    const data = resultadoValidacion.data

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
        : data.idOrdenDeTrabajo

    const imagenes = normalizarImagenesBicicleta(rawData)
    const imagenesTemporales = payload.imagenesTemporales
    const replaceImages =
      imagenesTemporales !== undefined ||
      "imagenes" in payload ||
      "imagenesUrl" in payload ||
      "imagenesUrls" in payload ||
      "imagenUrl" in payload

    if (imagenes.some((url) => url.includes("/tmp/bicicletas/")))
      throw new ImagenError(
        "Las imágenes temporales deben confirmarse mediante su identificador firmado"
      )
    if (
      imagenesTemporales !== undefined &&
      (!Array.isArray(imagenesTemporales) ||
        imagenesTemporales.length > MAX_BICYCLE_IMAGES)
    )
      throw new ImagenError("Lista de imágenes temporales inválida")
    if (
      replaceImages &&
      imagenes.length + (imagenesTemporales?.length ?? 0) > MAX_BICYCLE_IMAGES
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
      imagenesTemporales,
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
        imagenesTemporales !== undefined &&
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
          descripcionAdicional: data.descripcionAdicional,
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

      // Conserva los valores previos y posteriores dentro de la transaccion.
      await registrarAuditoriaBicicleta(tx, {
        idUsuario: session.user.idUsuario,
        idBicicleta: bicycleId,
        idOrdenDeTrabajo: bicycle.idOrdenDeTrabajo,
        tipoOperacion: "EDITAR_BICICLETA",
        valorAnterior: actual,
        valorNuevo: bicycle,
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
        { code: "IMAGEN_BICICLETA_INVALIDA", message: error.message },
        { status: error.status }
      )
    const response = respuestaErrorBicicleta(error)
    if (response) return response
    console.log("[BICYCLES_ID_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

/** Elimina fisicamente una bicicleta y sus imagenes desde una ODT abierta. */
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
      // Serializa eliminaciones y ediciones concurrentes sobre la misma ODT.
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

      // Mantiene la misma regla de estado utilizada al crear y editar.
      await exigirOrdenAbierta(tx, actual.idOrdenDeTrabajo)

      const job = await encolarBorrado(
        tx,
        actual.imagenes.map((i) => i.urlImagen),
        session.user.idUsuario,
        bicycleId
      )

      // El borrado fisico de imagenes y bicicleta es intencional.
      await tx.imagenBicicleta.deleteMany({ where: { idBicicleta: bicycleId } })
      await tx.bicicleta.delete({ where: { idBicicleta: bicycleId } })

      // La auditoria conserva la fotografia eliminada sin restaurar el registro.
      await registrarAuditoriaBicicleta(tx, {
        idUsuario: session.user.idUsuario,
        idBicicleta: bicycleId,
        idOrdenDeTrabajo: actual.idOrdenDeTrabajo,
        tipoOperacion: "ELIMINAR_BICICLETA",
        valorAnterior: actual,
        valorNuevo: { eliminada: true },
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
    console.log("[BICYCLES_ID_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
