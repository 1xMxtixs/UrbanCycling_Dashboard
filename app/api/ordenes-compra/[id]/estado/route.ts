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
 * Permite enviar borradores, completar órdenes enviadas y pagadas ingresando
 * sus productos al inventario, o anular órdenes sin movimientos asociados.
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
    const result = await db.$transaction(async (tx) => {
      // Serializa pagos, cierres y anulaciones asociados a esta orden.
      await tx.$queryRaw<Array<{ idOrdenDeCompra: number }>>`
        SELECT id_orden_de_compra AS idOrdenDeCompra
        FROM ordenes_de_compra
        WHERE id_orden_de_compra = ${idOrdenDeCompra}
        FOR UPDATE
      `
      const order = await tx.ordenDeCompra.findUnique({
        where: { idOrdenDeCompra },
        include: {
          lineas: {
            select: {
              idLineaDeOrdenDeCompra: true,
              idProducto: true,
              cantidadOrdenada: true,
              cantidadRecibida: true,
              precioCostoUnitario: true,
            },
          },
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

        return {
          purchaseOrder: await tx.ordenDeCompra.update({
            where: { idOrdenDeCompra },
            data: { estado: EstadoOrdenCompra.ENVIADA },
          }),
          movements: [],
        }
      }

      if (accion === "COMPLETAR") {
        if (order.estado !== EstadoOrdenCompra.ENVIADA) {
          throw new PurchaseOrderTransitionError(
            "TRANSICION_ESTADO_INVALIDA",
            409,
            "Solo se puede completar una orden que esté en ENVIADA.",
          )
        }

        if (order.estadoPago !== EstadoPagoOrdenCompra.PAGADA) {
          throw new PurchaseOrderTransitionError(
            "ORDEN_NO_PAGADA",
            409,
            "La orden debe estar completamente pagada para poder completarse.",
          )
        }

        if (order.lineas.length === 0) {
          throw new PurchaseOrderTransitionError(
            "ORDEN_COMPRA_SIN_LINEAS",
            409,
            "No se puede completar una orden sin productos.",
          )
        }

        const movements: Array<{
          idMovimientoInventario: number
          idLineaDeOrdenDeCompra: number
          cantidad: number
        }> = []

        for (const line of order.lineas) {
          if (
            line.cantidadOrdenada <= 0 ||
            line.cantidadRecibida < 0 ||
            line.cantidadRecibida > line.cantidadOrdenada
          ) {
            throw new PurchaseOrderTransitionError(
              "CANTIDADES_ORDEN_INVALIDAS",
              409,
              "Las cantidades de los productos de la orden no son coherentes.",
            )
          }

          const quantityToAdd =
            line.cantidadOrdenada - line.cantidadRecibida

          // Solo se incorpora la diferencia para evitar duplicar stock histórico.
          if (quantityToAdd > 0) {
            await tx.producto.update({
              where: { idProducto: line.idProducto },
              data: {
                stockActual: { increment: quantityToAdd },
              },
            })

            const movement = await tx.movimientoInventario.create({
              data: {
                idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra,
                tipoMovimiento: "ENTRADA",
                cantidad: quantityToAdd,
                costoUnitario: line.precioCostoUnitario,
              },
              select: { idMovimientoInventario: true },
            })

            movements.push({
              idMovimientoInventario: movement.idMovimientoInventario,
              idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra,
              cantidad: quantityToAdd,
            })
          }

          await tx.lineaDeOrdenDeCompra.update({
            where: {
              idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra,
            },
            data: { cantidadRecibida: line.cantidadOrdenada },
          })
        }

        const purchaseOrder = await tx.ordenDeCompra.update({
          where: { idOrdenDeCompra },
          data: {
            estado: EstadoOrdenCompra.COMPLETADA,
            estadoRecepcion: EstadoRecepcionOrdenCompra.RECIBIDA,
            fechaEntregaReal: order.fechaEntregaReal ?? new Date(),
          },
        })

        return { purchaseOrder, movements }
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
      const hasNonPendingPayment =
        order.estadoPago !== EstadoPagoOrdenCompra.PENDIENTE

      if (hasReceivedProducts || hasRecordedPayments || hasNonPendingPayment) {
        throw new PurchaseOrderTransitionError(
          "ORDEN_COMPRA_CON_MOVIMIENTOS",
          409,
          "No se puede anular una orden con mercadería recibida o pagos completados.",
        )
      }

      return {
        purchaseOrder: await tx.ordenDeCompra.update({
          where: { idOrdenDeCompra },
          data: {
            estado: EstadoOrdenCompra.ANULADA,
            estadoPago: EstadoPagoOrdenCompra.ANULADA,
            estadoRecepcion: EstadoRecepcionOrdenCompra.ANULADA,
          },
        }),
        movements: [],
      }
    })

    const responseByAction = {
      ENVIAR: {
        code: "ORDEN_COMPRA_ENVIADA",
        message: "La orden de compra quedó marcada como enviada.",
      },
      COMPLETAR: {
        code: "ORDEN_COMPRA_COMPLETADA",
        message:
          "La orden fue completada y sus productos ingresaron al inventario.",
      },
      ANULAR: {
        code: "ORDEN_COMPRA_ANULADA",
        message: "La orden de compra fue anulada.",
      },
    }[accion]

    return NextResponse.json({
      ...responseByAction,
      purchaseOrder: result.purchaseOrder,
      ...(accion === "COMPLETAR" ? { movements: result.movements } : {}),
    })
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
