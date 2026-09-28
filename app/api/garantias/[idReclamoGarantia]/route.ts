import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import {
  formatearFechaGarantia,
  presentarEstadoGarantia,
} from "@/lib/warranty-response"

type RouteContext = {
  params: Promise<{
    idReclamoGarantia: string
  }>
}

/** Valida el ID recibido en la URL antes de enviarlo a Prisma. */
function obtenerIdGarantia(value: string) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const idReclamoGarantia = Number(value)

  if (!Number.isSafeInteger(idReclamoGarantia) || idReclamoGarantia <= 0) {
    return null
  }

  return idReclamoGarantia
}

/**
 * GET /api/garantias/:idReclamoGarantia
 * Entrega la ficha que utiliza la vista de detalle de una solicitud. Incluye
 * la información de ingreso y los campos de resolución, que permanecen nulos
 * hasta que un CU posterior registre el veredicto.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    // Consultar una garantía requiere el mismo permiso que alimenta el listado.
    const { response } = await requirePermission(PERMISSIONS.WARRANTIES_READ)

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

    // La garantía guarda idVentaReclamada. Desde esa venta se obtiene la OT
    // original para que el frontend pueda enlazar su ficha o historial.
    const solicitud = await db.reclamoGarantia.findUnique({
      where: {
        idReclamoGarantia,
      },
      select: {
        idReclamoGarantia: true,
        idVentaGenerada: true,
        fechaRegistro: true,
        estado: true,
        motivo: true,
        tipoResolucion: true,
        justificacionResolucion: true,
        ventaReclamada: {
          select: {
            idVenta: true,
            ordenDeTrabajo: {
              select: {
                idOrdenDeTrabajo: true,
              },
            },
          },
        },
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

    // motivo corresponde a la observación de ingreso definida para CU74. Los
    // campos de resolución quedan disponibles para que la misma vista sirva
    // cuando CU76 registre un veredicto.
    return NextResponse.json(
      {
        code: "GARANTIA_CARGADA",
        garantia: {
          idReclamoGarantia: solicitud.idReclamoGarantia,
          idOrdenDeTrabajo:
            solicitud.ventaReclamada.ordenDeTrabajo?.idOrdenDeTrabajo ?? null,
          idVenta: solicitud.ventaReclamada.idVenta,
          fechaIngreso: formatearFechaGarantia(solicitud.fechaRegistro),
          estado: presentarEstadoGarantia(solicitud.estado),
          motivo: solicitud.motivo,
          veredicto: solicitud.tipoResolucion,
          observacionesResolucion: solicitud.justificacionResolucion,
          idVentaGenerada: solicitud.idVentaGenerada,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[GARANTIAS_ID_GET]", error)

    return NextResponse.json(
      {
        code: "ERROR_CARGAR_GARANTIA",
        message: "No fue posible cargar la solicitud de garantía",
      },
      { status: 500 }
    )
  }
}
