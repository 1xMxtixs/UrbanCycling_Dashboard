// Endpoints generales de bicicletas para listar y registrar bicicletas vinculadas.
import { NextResponse } from "next/server"

import {
  MAX_BICYCLE_IMAGES,
  normalizarImagenesBicicleta,
} from "@/lib/bicycle-images"
import { db } from "@/lib/db"
import { registrarAuditoriaBicicleta } from "@/lib/bicycle-audit"
import {
  crearBicicletaSchema,
  normalizarPayloadBicicleta,
  respuestaValidacionBicicleta,
} from "@/lib/bicycle-validation"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import {
  bloquearOrdenesTrabajo,
  exigirOrdenAbierta,
  respuestaErrorBicicleta,
} from "@/app/api/_lib/work-order-lock"
import {
  confirmarPreparadas,
  ImagenError,
  liberarPreparadas,
  limpiarConfirmadas,
  prepararImagenes,
  type Preparada,
} from "@/app/api/_lib/image-jobs"

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
        rut: string | null
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

/** Registra una bicicleta vinculada obligatoriamente a una ODT abierta. */
export async function POST(request: Request) {
  let preparadas: Preparada[] = []
  let guardada = false

  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.BICYCLES_CREATE
    )

    if (response || !session) {
      return response ?? new NextResponse("No autorizado", { status: 401 })
    }

    const rawData = await request.json()
    const payload = normalizarPayloadBicicleta(rawData)
    const resultado = crearBicicletaSchema.safeParse(payload)

    if (!resultado.success) {
      return NextResponse.json(respuestaValidacionBicicleta(resultado.error), {
        status: 400,
      })
    }

    const data = resultado.data
    const imagenes = normalizarImagenesBicicleta(rawData)
    const imagenesTemporales = payload.imagenesTemporales

    if (imagenes.some((url) => url.includes("/tmp/bicicletas/"))) {
      throw new ImagenError(
        "Las imagenes temporales deben confirmarse mediante su identificador firmado"
      )
    }
    if (
      imagenesTemporales !== undefined &&
      (!Array.isArray(imagenesTemporales) ||
        imagenesTemporales.length > MAX_BICYCLE_IMAGES)
    ) {
      throw new ImagenError("Lista de imagenes temporales invalida")
    }
    if (
      imagenes.length + (imagenesTemporales?.length ?? 0) >
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
      imagenesTemporales,
      session.user.idUsuario
    )
    const finales = [
      ...new Set([...imagenes, ...preparadas.map((item) => item.job.url)]),
    ]

    const bicycle = await db.$transaction(async (tx) => {
      // Serializa las modificaciones concurrentes sobre la misma ODT.
      await bloquearOrdenesTrabajo(tx, [data.idOrdenDeTrabajo])
      await exigirOrdenAbierta(tx, data.idOrdenDeTrabajo)

      const creada = await tx.bicicleta.create({
        data: {
          idOrdenDeTrabajo: data.idOrdenDeTrabajo,
          tipo: data.tipo,
          marca: data.marca,
          modelo: data.modelo,
          color: data.color,
          descripcionAdicional: data.descripcionAdicional ?? null,
          imagenes: finales.length
            ? {
                create: finales.map((urlImagen) => ({
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

      // Vincula los temporales al ID generado antes de confirmar la transaccion.
      await confirmarPreparadas(tx, preparadas, creada.idBicicleta)
      await registrarAuditoriaBicicleta(tx, {
        idUsuario: session.user.idUsuario,
        idBicicleta: creada.idBicicleta,
        idOrdenDeTrabajo: creada.idOrdenDeTrabajo,
        tipoOperacion: "CREAR_BICICLETA",
        valorAnterior: {},
        valorNuevo: {
          idBicicleta: creada.idBicicleta,
          idOrdenDeTrabajo: creada.idOrdenDeTrabajo,
          tipo: creada.tipo,
          marca: creada.marca,
          modelo: creada.modelo,
          color: creada.color,
          descripcionAdicional: creada.descripcionAdicional,
          imagenes: creada.imagenes,
        },
      })

      return creada
    })

    guardada = true
    await limpiarConfirmadas(preparadas)
    return NextResponse.json(mapBicycleResponse(bicycle), { status: 201 })
  } catch (error) {
    if (!guardada) await liberarPreparadas(preparadas)
    if (error instanceof ImagenError) {
      return NextResponse.json(
        { code: "IMAGEN_BICICLETA_INVALIDA", message: error.message },
        { status: error.status }
      )
    }
    const response = respuestaErrorBicicleta(error)
    if (response) return response
    console.error("[BICYCLES_POST]", error)

    const errorCode = getErrorCode(error)

    if (errorCode === "P2022") {
      return NextResponse.json(
        {
          code: "BASE_DATOS_NO_SINCRONIZADA",
          message:
            "La base de datos no esta sincronizada. Ejecuta las migraciones pendientes.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        code: "ERROR_CREAR_BICICLETA",
        message: "No se pudo registrar la bicicleta",
      },
      { status: 500 }
    )
  }
}
