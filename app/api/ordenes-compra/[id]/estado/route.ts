// Controlador para ejecutar transiciones administrativas de una orden de compra.
import { NextResponse } from "next/server"

import {
  EstadoOrdenCompra,
  EstadoPago,
  EstadoPagoOrdenCompra,
  EstadoRecepcionOrdenCompra,
} from "@/generated/prisma"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{ id: string }>
}

type PurchaseOrderAction = "ENVIAR" | "ANULAR" | "COMPLETAR"

class PurchaseOrderTransitionError extends Error {
  /** Conserva el código y HTTP status que la ruta devolverá al cliente. */
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Convierte el identificador de ruta en un entero positivo seguro.
 * Devuelve null si el parámetro no puede identificar una orden.
 */
function parsePurchaseOrderId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/**
 * PATCH /api/ordenes-compra/:id/estado
 * Permite enviar borradores, completar órdenes enviadas ya pagadas y recibidas,
 * o anular órdenes sin recepciones ni pagos, usando los enums existentes.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(
      PERMISSIONS.PURCHASE_ORDERS_UPDATE,
    )

    if (response) {
      return response
    }

    const { id } = await context.params
    const idOrdenDeCompra = parsePurchaseOrderId(id)

    if (!idOrdenDeCompra) {
      return NextResponse.json(
        {
          code: "ID_ORDEN_COMPRA_INVALIDO",
          message: "El identificador de la orden de compra no es válido.",
        },
        { status: 400 },
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { code: "DATOS_INVALIDOS", message: "El cuerpo debe ser JSON válido." },
        { status: 400 },
      )
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { code: "DATOS_INVALIDOS", message: "El cuerpo debe ser un objeto JSON." },
        { status: 400 },
      )
    }

    const actionInput = (body as Record<string, unknown>).accion
    if (
      actionInput !== "ENVIAR" &&
      actionInput !== "ANULAR" &&
      actionInput !== "COMPLETAR"
    ) {
      return NextResponse.json(
        {
          code: "ACCION_INVALIDA",
          message: "La acción debe ser ENVIAR, COMPLETAR o ANULAR.",
        },
        { status: 400 },
      )
    }

    const accion: PurchaseOrderAction = actionInput
    const purchaseOrder = await db.$transaction(async (tx) => {
      // Serializa las transiciones con pagos y recepciones que bloquean esta fila.
      await tx.$queryRaw<Array<{ idOrdenDeCompra: number }>>`
        SELECT id_orden_de_compra AS idOrdenDeCompra
        FROM ordenes_de_compra
        WHERE id_orden_de_compra = ${idOrdenDeCompra}
        FOR UPDATE
      `
      const order = await tx.ordenDeCompra.findUnique({
        where: { idOrdenDeCompra },
        include: {
          lineas: { select: { cantidadRecibida: true } },
          asignacionesPago: {
            where: {
              pago: { is: { estado: EstadoPago.COMPLETADO } },
            },
            select: { montoAsociado: true },
          },
        },
      })

      if (!order) {
        throw new PurchaseOrderTransitionError(
          "ORDEN_COMPRA_NO_ENCONTRADA",
          404,
          "No existe una orden de compra con el ID indicado.",
        )
      }

      if (accion === "ENVIAR") {
        if (order.estado !== EstadoOrdenCompra.BORRADOR) {
          throw new PurchaseOrderTransitionError(
            "TRANSICION_ESTADO_INVALIDA",
            409,
            "Solo se puede enviar una orden que esté en BORRADOR.",
          )
        }

        return tx.ordenDeCompra.update({
          where: { idOrdenDeCompra },
          data: { estado: EstadoOrdenCompra.ENVIADA },
        })
      }

      if (accion === "COMPLETAR") {
        if (order.estado !== EstadoOrdenCompra.ENVIADA) {
          throw new PurchaseOrderTransitionError(
            "TRANSICION_ESTADO_INVALIDA",
            409,
            "Solo se puede completar una orden que esté en ENVIADA.",
          )
        }

        if (order.estadoRecepcion !== EstadoRecepcionOrdenCompra.RECIBIDA) {
          throw new PurchaseOrderTransitionError(
            "ORDEN_NO_RECIBIDA",
            409,
            "La orden debe estar completamente recibida para poder completarse.",
          )
        }

        if (order.estadoPago !== EstadoPagoOrdenCompra.PAGADA) {
          throw new PurchaseOrderTransitionError(
            "ORDEN_NO_PAGADA",
            409,
            "La orden debe estar completamente pagada para poder completarse.",
          )
        }

        return tx.ordenDeCompra.update({
          where: { idOrdenDeCompra },
          data: { estado: EstadoOrdenCompra.COMPLETADA },
        })
      }

      if (
        order.estado !== EstadoOrdenCompra.BORRADOR &&
        order.estado !== EstadoOrdenCompra.ENVIADA
      ) {
        throw new PurchaseOrderTransitionError(
          "TRANSICION_ESTADO_INVALIDA",
          409,
          "Solo se puede anular una orden en BORRADOR o ENVIADA.",
        )
      }

      const hasReceivedProducts = order.lineas.some(
        (line) => line.cantidadRecibida > 0,
      )
      const hasRecordedPayments = order.asignacionesPago.some(
        (assignment) => assignment.montoAsociado.greaterThan(0),
      )
      const hasNonPendingSubstate =
        order.estadoRecepcion !== EstadoRecepcionOrdenCompra.PENDIENTE ||
        order.estadoPago !== EstadoPagoOrdenCompra.PENDIENTE

      if (hasReceivedProducts || hasRecordedPayments || hasNonPendingSubstate) {
        throw new PurchaseOrderTransitionError(
          "ORDEN_COMPRA_CON_MOVIMIENTOS",
          409,
          "No se puede anular una orden con mercadería recibida o pagos completados.",
        )
      }

      return tx.ordenDeCompra.update({
        where: { idOrdenDeCompra },
        data: {
          estado: EstadoOrdenCompra.ANULADA,
          estadoPago: EstadoPagoOrdenCompra.ANULADA,
          estadoRecepcion: EstadoRecepcionOrdenCompra.ANULADA,
        },
      })
    })

    const responseByAction = {
      ENVIAR: {
        code: "ORDEN_COMPRA_ENVIADA",
        message: "La orden de compra quedó marcada como enviada.",
      },
      COMPLETAR: {
        code: "ORDEN_COMPRA_COMPLETADA",
        message: "La orden de compra fue completada correctamente.",
      },
      ANULAR: {
        code: "ORDEN_COMPRA_ANULADA",
        message: "La orden de compra fue anulada.",
      },
    }[accion]

    return NextResponse.json({ ...responseByAction, purchaseOrder })
  } catch (error) {
    if (error instanceof PurchaseOrderTransitionError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      )
    }

    console.error("[PURCHASE_ORDER_STATE_PATCH]", error)
    return NextResponse.json(
      {
        code: "ERROR_ACTUALIZAR_ESTADO_ORDEN_COMPRA",
        message: "No fue posible actualizar el estado de la orden de compra.",
      },
      { status: 500 },
    )
  }
}
