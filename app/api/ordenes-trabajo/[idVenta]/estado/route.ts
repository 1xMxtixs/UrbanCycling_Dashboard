import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { calcularDiasServicio } from "@/lib/service-time"
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit"
import {
  ESTADO_OT,
  ESTADOS_OT_CERRADOS,
  ESTADOS_OT_FINALIZADOS,
  TRANSICIONES_OT,
} from "@/lib/work-order-status"
import { NextResponse } from "next/server"
import { z } from "zod"

const actualizarEstadoSchema = z.object({
  estado: z.enum(ESTADO_OT),
})

// Valida y ejecuta una transicion de estado de la orden, registrando fechas, dias de servicio y auditoria.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.WORK_ORDERS_UPDATE_STATUS
    )

    if (response || !session) {
      return response
    }

    const { idVenta } = await params
    const validation = actualizarEstadoSchema.safeParse(await req.json())
    const idOrdenDeTrabajo = Number(idVenta)

    if (!validation.success) {
      return NextResponse.json(
        {
          code: "ESTADO_INVALIDO",
          message: "Debe ingresar un estado valido",
          estadosPermitidos: Object.values(ESTADO_OT),
        },
        { status: 400 }
      )
    }

    const { estado } = validation.data

    if (!Number.isInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
      return NextResponse.json(
        { code: "ID_INVALIDO", message: "El ID de la orden no es válido" },
        { status: 400 }
      )
    }

    const ordenTrabajo = await db.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo,
      },
      include: {
        venta: { select: { fechaRegistro: true } },
      },
    })

    if (!ordenTrabajo) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden no existe",
        },
        { status: 404 }
      )
    }

    const estadoActualValidation = z
      .enum(ESTADO_OT)
      .safeParse(ordenTrabajo.estado)

    if (!estadoActualValidation.success) {
      return NextResponse.json(
        {
          code: "ESTADO_ACTUAL_INVALIDO",
          message: "La orden posee un estado no reconocido",
        },
        { status: 409 }
      )
    }

    const estadoActual = estadoActualValidation.data

    if (estado === ESTADO_OT.ANULADA) {
      if (ESTADOS_OT_CERRADOS.includes(estadoActual)) {
        return NextResponse.json(
          {
            code: "ANULACION_NO_PERMITIDA",
            message: "La orden ya se encuentra entregada o anulada",
          },
          { status: 409 }
        )
      }
    } else {
      const estadosSiguientes = TRANSICIONES_OT[estadoActual]

      if (!estadosSiguientes.includes(estado)) {
        return NextResponse.json(
          {
            code: "CAMBIO_ESTADO_NO_PERMITIDO",
            message: `No se puede cambiar una orden desde "${estadoActual}" a "${estado}"`,
          },
          { status: 409 }
        )
      }
    }

    const fechaEntregaReal = ESTADOS_OT_FINALIZADOS.includes(estado)
      ? (() => {
          const now = new Date()
          const localStr = now.toLocaleDateString("sv-SE", { timeZone: "America/Santiago" })
          return new Date(`${localStr}T00:00:00.000Z`)
        })()
      : undefined

    // UR 5.15: service time is computed and stored when the bike is effectively delivered.
    const diasServicio =
      estado === ESTADO_OT.ENTREGADO
        ? calcularDiasServicio(
            ordenTrabajo.venta.fechaRegistro,
            fechaEntregaReal
          )
        : undefined

    if (diasServicio === null) {
      return NextResponse.json(
        {
          code: "TIEMPO_SERVICIO_INVALIDO",
          message:
            "No se pudo calcular el tiempo de servicio: la orden no tiene una fecha de ingreso válida",
        },
        { status: 422 }
      )
    }

    const ordenActualizada = await db.$transaction(async (tx) => {
      const orden = await tx.ordenDeTrabajo.update({
        where: {
          idOrdenDeTrabajo,
        },
        data: {
          estado,
          fechaEntregaReal,
          diasServicio,
        },
      })

      await registrarAuditoriaOrdenTrabajo(tx, {
        idUsuario: session.user.idUsuario,
        tipoOperacion:
          estado === ESTADO_OT.ANULADA ? "anulacion_orden" : "cambio_estado",
        idOrdenDeTrabajo,
        valorAnterior: {
          estado: ordenTrabajo.estado,
          fechaEntregaReal: ordenTrabajo.fechaEntregaReal,
          diasServicio: ordenTrabajo.diasServicio,
        },
        valorNuevo: {
          estado: orden.estado,
          fechaEntregaReal: orden.fechaEntregaReal,
          diasServicio: orden.diasServicio,
        },
        detalleCambio:
          estado === ESTADO_OT.ANULADA
            ? "Anulacion de orden de trabajo"
            : `Cambio de estado de orden a ${estado}`,
      })

      return orden
    })

    return NextResponse.json({
      ...ordenActualizada,
      estadoOrden: ordenActualizada.estado,
    })
  } catch (error) {
    console.log("[ACTUALIZAR_ESTADO_ORDEN]", error)

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
