import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { calcularDiasServicio } from "@/lib/service-time"
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit"
import {
  ESTADO_OT,
  ESTADOS_OT_CERRADOS,
  TRANSICIONES_OT,
} from "@/lib/work-order-status"
import { NextResponse } from "next/server"
import { z } from "zod"
import { bloquearOrdenesTrabajo } from "@/app/api/_lib/work-order-lock"
import {
  eliminarBicicletasOrden,
  limpiarArchivosOrdenAnulada,
} from "@/app/api/_lib/cancelled-order-cleanup"

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

    const resultado = await db.$transaction(async (tx) => {
      await bloquearOrdenesTrabajo(tx, [idOrdenDeTrabajo])
      const ordenTrabajo = await tx.ordenDeTrabajo.findUnique({
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

      const reanulacion =
        estado === ESTADO_OT.ANULADA && estadoActual === ESTADO_OT.ANULADA

      if (estado === ESTADO_OT.ANULADA) {
        if (ESTADOS_OT_CERRADOS.includes(estadoActual) && !reanulacion) {
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

      // La entrega real es un instante, no una fecha local convertida a UTC.
      // new Date() conserva el día real en Santiago cuando calcularDiasServicio
      // compara ambos valores como días calendario de la tienda.
      const fechaEntregaReal =
        estado === ESTADO_OT.ENTREGADO ? new Date() : undefined

      // UR 5.15: service time is computed and stored when the bike is effectively delivered.
      const diasServicio =
        estado === ESTADO_OT.ENTREGADO
          ? calcularDiasServicio(
              ordenTrabajo.venta.fechaRegistro,
              fechaEntregaReal
            )
          : undefined

      if (
        estado === ESTADO_OT.ENTREGADO &&
        (!ordenTrabajo.venta.fechaRegistro ||
          Number.isNaN(ordenTrabajo.venta.fechaRegistro.getTime()))
      ) {
        return NextResponse.json(
          {
            code: "TIEMPO_SERVICIO_INVALIDO",
            message:
              "No se pudo calcular el tiempo de servicio: la orden no tiene una fecha de ingreso válida",
          },
          { status: 422 }
        )
      }

      if (diasServicio === null) {
        return NextResponse.json(
          {
            code: "RANGO_TIEMPO_SERVICIO_INVALIDO",
            message:
              "La fecha de entrega no puede ser anterior a la fecha de ingreso de la orden",
          },
          { status: 409 }
        )
      }

      const { bicicletas, archivosPendientes } =
        estado === ESTADO_OT.ANULADA
          ? await eliminarBicicletasOrden(tx, idOrdenDeTrabajo)
          : { bicicletas: [], archivosPendientes: [] }
      // También permite limpiar bicicletas de anulaciones hechas por la API antigua.
      if (reanulacion && bicicletas.length === 0) {
        return { orden: ordenTrabajo, bicicletasEliminadas: 0 }
      }
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
          ...(estado === ESTADO_OT.ANULADA ? { bicicletas } : {}),
        },
        valorNuevo: {
          estado: orden.estado,
          fechaEntregaReal: orden.fechaEntregaReal,
          diasServicio: orden.diasServicio,
          ...(estado === ESTADO_OT.ANULADA
            ? { archivosPendientes, bicicletasEliminadas: bicicletas.length }
            : {}),
        },
        detalleCambio:
          estado === ESTADO_OT.ANULADA
            ? "Anulacion de orden de trabajo"
            : `Cambio de estado de orden a ${estado}`,
      })

      return { orden, bicicletasEliminadas: bicicletas.length }
    })

    if (resultado instanceof NextResponse) return resultado
    const ordenActualizada = resultado.orden
    let limpiezaArchivos
    if (estado === ESTADO_OT.ANULADA) {
      try {
        const limpieza = await limpiarArchivosOrdenAnulada(
          idOrdenDeTrabajo,
          session.user.idUsuario
        )
        limpiezaArchivos = {
          ...limpieza,
          estado: limpieza.pendientes ? "pendiente" : "completada",
        }
      } catch (error) {
        // El commit ya ocurrió. La auditoría conserva las URLs para reintentar.
        console.error("[ANULACION_LIMPIEZA_PENDIENTE]", error)
        limpiezaArchivos = { estado: "pendiente" }
      }
    }
    return NextResponse.json({
      ...ordenActualizada,
      estadoOrden: ordenActualizada.estado,
      ...(estado === ESTADO_OT.ANULADA
        ? {
            bicicletasEliminadas: resultado.bicicletasEliminadas,
            limpiezaArchivos,
            ...(limpiezaArchivos?.estado === "pendiente"
              ? {
                  advertencia:
                    "La orden fue anulada. Hay archivos pendientes de limpieza; repita la solicitud para reintentar.",
                }
              : {}),
          }
        : {}),
    })
  } catch (error) {
    console.log("[ACTUALIZAR_ESTADO_ORDEN]", error)

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
