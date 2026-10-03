import { NextResponse } from "next/server"
import { z } from "zod"

import { EstadoReclamoGarantia } from "@/generated/prisma"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { presentarEstadoGarantia } from "@/lib/warranty-response"

type RouteContext = {
  params: Promise<{
    idReclamoGarantia: string
  }>
}

const cambiarEstadoSchema = z
  .object({
    // La resolución conserva su propio endpoint; aquí solo se gestionan los
    // estados operativos de una solicitud aún pendiente.
    estado: z.enum(["EN_REVISION", "EN_ESPERA"]),
  })
  .strict()

const TRANSICIONES_GARANTIA: Record<
  EstadoReclamoGarantia,
  EstadoReclamoGarantia[]
> = {
  [EstadoReclamoGarantia.INGRESADO]: [
    EstadoReclamoGarantia.EN_REVISION,
    EstadoReclamoGarantia.EN_ESPERA,
  ],
  [EstadoReclamoGarantia.EN_REVISION]: [
    EstadoReclamoGarantia.EN_ESPERA,
  ],
  [EstadoReclamoGarantia.EN_ESPERA]: [
    EstadoReclamoGarantia.EN_REVISION,
  ],
  [EstadoReclamoGarantia.APROBADO]: [],
  [EstadoReclamoGarantia.RECHAZADO]: [],
}

function obtenerIdGarantia(value: string) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const idReclamoGarantia = Number(value)

  return Number.isSafeInteger(idReclamoGarantia) && idReclamoGarantia > 0
    ? idReclamoGarantia
    : null
}

/**
 * PATCH /api/garantias/:idReclamoGarantia/estado
 *
 * Mueve una solicitud pendiente entre En revisión y En espera. Aprobar o
 * rechazar es una acción final y se realiza en /resolucion por un administrador.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    // Asesor Técnico y Administrador poseen este permiso, por lo que ambos
    // pueden registrar el avance técnico sin obtener permiso de resolución.
    const { response } = await requirePermission(PERMISSIONS.WARRANTIES_UPDATE)

    if (response) {
      return response
    }

    const { idReclamoGarantia: idParam } = await context.params
    const idReclamoGarantia = obtenerIdGarantia(idParam)

    if (!idReclamoGarantia) {
      return NextResponse.json(
        {
          code: "ID_GARANTIA_INVALIDO",
          message: "El identificador de la solicitud de garantía no es válido",
        },
        { status: 400 }
      )
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          code: "JSON_INVALIDO",
          message: "El cuerpo de la solicitud no contiene un JSON válido",
        },
        { status: 400 }
      )
    }

    const validation = cambiarEstadoSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          code: "ESTADO_GARANTIA_INVALIDO",
          message: "El estado debe ser EN_REVISION o EN_ESPERA",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const solicitud = await db.reclamoGarantia.findUnique({
      where: { idReclamoGarantia },
      select: {
        estado: true,
        tipoResolucion: true,
      },
    })

    if (!solicitud) {
      return NextResponse.json(
        {
          code: "GARANTIA_NO_ENCONTRADA",
          message: "La solicitud de garantía indicada no existe",
        },
        { status: 404 }
      )
    }

    const estadoDestino = validation.data.estado as EstadoReclamoGarantia
    const transicionesPermitidas = TRANSICIONES_GARANTIA[solicitud.estado]

    if (
      solicitud.tipoResolucion !== null ||
      !transicionesPermitidas.includes(estadoDestino)
    ) {
      return NextResponse.json(
        {
          code: "CAMBIO_ESTADO_NO_PERMITIDO",
          message: "No se permite cambiar la solicitud desde su estado actual",
        },
        { status: 409 }
      )
    }

    // La condición incorpora el estado leído a la escritura. Si otra persona
    // resolvió o movió la solicitud entre ambas operaciones, no se sobrescribe.
    const resultado = await db.reclamoGarantia.updateMany({
      where: {
        idReclamoGarantia,
        estado: solicitud.estado,
        tipoResolucion: null,
      },
      data: {
        estado: estadoDestino,
      },
    })

    if (resultado.count === 0) {
      return NextResponse.json(
        {
          code: "CAMBIO_ESTADO_NO_PERMITIDO",
          message: "La solicitud cambió antes de poder actualizar su estado",
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        code: "ESTADO_GARANTIA_ACTUALIZADO",
        message: "El estado de la solicitud fue actualizado correctamente",
        garantia: {
          idReclamoGarantia,
          estado: presentarEstadoGarantia(estadoDestino),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[GARANTIAS_ESTADO_PATCH]", error)

    return NextResponse.json(
      {
        code: "ERROR_ACTUALIZAR_ESTADO_GARANTIA",
        message: "No fue posible actualizar el estado de la solicitud",
      },
      { status: 500 }
    )
  }
}
