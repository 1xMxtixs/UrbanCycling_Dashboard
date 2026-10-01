// Controlador para registrar recepciones parciales o completas de una orden.
import { NextResponse } from "next/server"

import {
  EstadoOrdenCompra,
  EstadoRecepcionOrdenCompra,
} from "@/generated/prisma"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{ id: string }>
}

type ReceptionLineInput = {
  idLineaDeOrdenDeCompra: number
  cantidadRecibida: number
}

type RegisteredMovement = {
  idMovimientoInventario: number
  idLineaDeOrdenDeCompra: number
  cantidad: number
}

const MAX_UNSIGNED_INT = 4_294_967_295

class PurchaseReceptionError extends Error {
  /** Mantiene el código y HTTP status asociados a la validación del flujo. */
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Convierte un ID recibido desde la ruta o el cuerpo en un entero positivo seguro.
 * Devuelve null si no es un entero positivo compatible con los IDs/cantidades
 * unsigned de la base de datos.
 */
function parsePositiveInteger(value: unknown) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN

  return Number.isSafeInteger(parsedValue) &&
    parsedValue > 0 &&
    parsedValue <= MAX_UNSIGNED_INT
    ? parsedValue
    : null
}

/**
 * Valida las cantidades acumuladas incluidas en el cuerpo de la recepción.
 * Rechaza líneas repetidas para evitar aplicar dos veces una misma instrucción.
 */
function parseReceptionLines(value: unknown): ReceptionLineInput[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null
  }

  const lines: ReceptionLineInput[] = []
  const lineIds = new Set<number>()

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return null
    }

    const data = item as Record<string, unknown>
    const idLineaDeOrdenDeCompra = parsePositiveInteger(
      data.idLineaDeOrdenDeCompra ?? data.id_linea_de_orden_de_compra,
    )
    const cantidadRecibida = parsePositiveInteger(
      data.cantidadRecibida ?? data.cantidad_recibida,
    )

    if (
      !idLineaDeOrdenDeCompra ||
      !cantidadRecibida ||
      lineIds.has(idLineaDeOrdenDeCompra)
    ) {
      return null
    }

    lineIds.add(idLineaDeOrdenDeCompra)
    lines.push({ idLineaDeOrdenDeCompra, cantidadRecibida })
  }

  return lines
}

/**
 * POST /api/ordenes-compra/:id/recepciones
 * Registra cantidades acumuladas, incrementa inventario por la diferencia y
 * deriva el estado logístico sin modificar los estados administrativo o de pago.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(
      PERMISSIONS.PURCHASE_ORDERS_UPDATE,
    )

    if (response) {
      return response
    }

    const { id } = await context.params
    const idOrdenDeCompra = parsePositiveInteger(id)

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
        {
          code: "DATOS_INVALIDOS",
          message: "El cuerpo debe contener datos JSON válidos.",
        },
        { status: 400 },
      )
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          code: "DATOS_INVALIDOS",
          message: "El cuerpo debe contener un objeto JSON válido.",
        },
        { status: 400 },
      )
    }

    const lines = parseReceptionLines(
      (body as Record<string, unknown>).lineas,
    )

    if (!lines) {
      return NextResponse.json(
        {
          code: "LINEAS_RECEPCION_INVALIDAS",
          message:
            "Debe informar líneas únicas con cantidades acumuladas positivas.",
        },
        { status: 400 },
      )
    }

    const result = await db.$transaction(async (tx) => {
      // Serializa recepciones de una orden y sincroniza el flujo con su anulación.
      const lockedOrders = await tx.$queryRaw<
        Array<{ idOrdenDeCompra: number }>
      >`
        SELECT id_orden_de_compra AS idOrdenDeCompra
        FROM ordenes_de_compra
        WHERE id_orden_de_compra = ${idOrdenDeCompra}
        FOR UPDATE
      `

      if (lockedOrders.length === 0) {
        throw new PurchaseReceptionError(
          "ORDEN_COMPRA_NO_ENCONTRADA",
          404,
          "No existe una orden de compra con el ID indicado.",
        )
      }

      const order = await tx.ordenDeCompra.findUnique({
        where: { idOrdenDeCompra },
        include: { lineas: true },
      })

      if (!order) {
        throw new PurchaseReceptionError(
          "ORDEN_COMPRA_NO_ENCONTRADA",
          404,
          "No existe una orden de compra con el ID indicado.",
        )
      }

      if (order.estado !== EstadoOrdenCompra.ENVIADA) {
        throw new PurchaseReceptionError(
          "ORDEN_NO_RECIBIBLE",
          409,
          "Solo se puede recibir mercadería de una orden ENVIADA.",
        )
      }

      if (order.estadoRecepcion === EstadoRecepcionOrdenCompra.ANULADA) {
        throw new PurchaseReceptionError(
          "RECEPCION_ANULADA",
          409,
          "No se puede recibir mercadería de una recepción anulada.",
        )
      }

      if (order.lineas.length === 0) {
        throw new PurchaseReceptionError(
          "ORDEN_COMPRA_SIN_LINEAS",
          409,
          "No se puede registrar recepción para una orden sin líneas.",
        )
      }

      const linesById = new Map(
        order.lineas.map((line) => [line.idLineaDeOrdenDeCompra, line]),
      )
      const movements: RegisteredMovement[] = []

      for (const input of lines) {
        const line = linesById.get(input.idLineaDeOrdenDeCompra)

        if (!line) {
          throw new PurchaseReceptionError(
            "LINEA_NO_PERTENECE_A_ORDEN",
            400,
            `La línea ${input.idLineaDeOrdenDeCompra} no pertenece a esta orden.`,
          )
        }

        if (
          input.cantidadRecibida < line.cantidadRecibida ||
          input.cantidadRecibida > line.cantidadOrdenada
        ) {
          throw new PurchaseReceptionError(
            "CANTIDAD_RECIBIDA_INVALIDA",
            409,
            "La cantidad acumulada no puede disminuir ni superar la cantidad ordenada.",
          )
        }

        const difference = input.cantidadRecibida - line.cantidadRecibida

        // Repetir el mismo acumulado no vuelve a incrementar stock ni movimientos.
        if (difference === 0) {
          continue
        }

        await tx.lineaDeOrdenDeCompra.update({
          where: { idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra },
          data: { cantidadRecibida: input.cantidadRecibida },
        })

        await tx.producto.update({
          where: { idProducto: line.idProducto },
          data: { stockActual: { increment: difference } },
        })

        const movement = await tx.movimientoInventario.create({
          data: {
            idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra,
            tipoMovimiento: "ENTRADA",
            cantidad: difference,
            costoUnitario: line.precioCostoUnitario,
          },
          select: { idMovimientoInventario: true },
        })

        movements.push({
          idMovimientoInventario: movement.idMovimientoInventario,
          idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra,
          cantidad: difference,
        })
      }

      const updatedLines = await tx.lineaDeOrdenDeCompra.findMany({
        where: { idOrdenDeCompra },
        select: {
          cantidadOrdenada: true,
          cantidadRecibida: true,
        },
      })

      const receivedAll = updatedLines.every(
        (line) => line.cantidadRecibida === line.cantidadOrdenada,
      )
      const hasReceivedProducts = updatedLines.some(
        (line) => line.cantidadRecibida > 0,
      )
      const estadoRecepcion = receivedAll
        ? EstadoRecepcionOrdenCompra.RECIBIDA
        : hasReceivedProducts
          ? EstadoRecepcionOrdenCompra.PARCIAL
          : EstadoRecepcionOrdenCompra.PENDIENTE

      const purchaseOrder = await tx.ordenDeCompra.update({
        where: { idOrdenDeCompra },
        data: {
          estadoRecepcion,
          fechaEntregaReal: receivedAll
            ? order.fechaEntregaReal ?? new Date()
            : null,
        },
        include: {
          proveedor: {
            select: { idProveedor: true, razonSocial: true },
          },
          lineas: {
            include: {
              producto: {
                select: { idProducto: true, nombre: true },
              },
            },
            orderBy: { idLineaDeOrdenDeCompra: "asc" },
          },
        },
      })

      return { purchaseOrder, movements }
    })

    return NextResponse.json({
      code: "RECEPCION_ORDEN_COMPRA_REGISTRADA",
      message: "La recepción fue registrada correctamente.",
      purchaseOrder: result.purchaseOrder,
      movements: result.movements,
    })
  } catch (error) {
    if (error instanceof PurchaseReceptionError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      )
    }

    console.error("[PURCHASE_ORDER_RECEPTION_POST]", error)
    return NextResponse.json(
      {
        code: "ERROR_REGISTRAR_RECEPCION",
        message: "No fue posible registrar la recepción de la orden de compra.",
      },
      { status: 500 },
    )
  }
}
