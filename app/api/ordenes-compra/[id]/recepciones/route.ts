import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

const uint = z.number().int().min(0).max(4294967295)
const receptionSchema = z
  .object({
    lineas: z
      .array(
        z.object({
          idLineaDeOrdenDeCompra: uint.positive(),
          cantidadRecibida: uint,
          // El acumulado observado permite detectar una recepción concurrente o un reintento.
          cantidadRecibidaAnterior: uint,
        })
      )
      .min(1)
      .max(500),
  })
  .refine(
    (data) => data.lineas.some((line) => line.cantidadRecibida > 0),
    "Ingrese al menos una cantidad recibida mayor que cero."
  )

class ReceptionError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string
  ) {
    super(message)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.PURCHASE_ORDERS_UPDATE
    )
    if (response || !session)
      return response ?? new NextResponse("No autorizado", { status: 401 })
    if (!session.user.permisos.includes(PERMISSIONS.INVENTORY_UPDATE)) {
      return new NextResponse("Sin permisos para actualizar inventario", {
        status: 403,
      })
    }
    const { id } = await params
    const idOrdenDeCompra = Number(id)
    if (
      !/^\d+$/.test(id) ||
      !Number.isSafeInteger(idOrdenDeCompra) ||
      idOrdenDeCompra <= 0 ||
      idOrdenDeCompra > 4294967295
    ) {
      throw new ReceptionError(
        "ID_ORDEN_COMPRA_INVALIDO",
        400,
        "El identificador de la orden no es válido."
      )
    }
    let body: unknown
    try {
      body = await request.json()
    } catch {
      throw new ReceptionError(
        "DATOS_INVALIDOS",
        400,
        "El cuerpo debe ser JSON válido."
      )
    }
    const validation = receptionSchema.safeParse(body)
    if (!validation.success) {
      throw new ReceptionError(
        "RECEPCION_INVALIDA",
        400,
        validation.error.issues[0]?.message ?? "Cantidades inválidas."
      )
    }
    const inputs = validation.data.lineas
    const requested = new Map(
      inputs.map((line) => [line.idLineaDeOrdenDeCompra, line])
    )
    if (requested.size !== inputs.length) {
      throw new ReceptionError(
        "LINEA_REPETIDA",
        400,
        "Cada línea puede aparecer una sola vez en la recepción."
      )
    }

    const result = await db.$transaction(async (tx) => {
      // Mismo bloqueo usado por pagos, cierres y anulaciones.
      await tx.$queryRaw`SELECT id_orden_de_compra FROM ordenes_de_compra WHERE id_orden_de_compra = ${idOrdenDeCompra} FOR UPDATE`
      await tx.$queryRaw`SELECT id_linea_de_orden_de_compra FROM lineas_de_orden_de_compra WHERE id_orden_de_compra = ${idOrdenDeCompra} ORDER BY id_linea_de_orden_de_compra FOR UPDATE`
      const order = await tx.ordenDeCompra.findUnique({
        where: { idOrdenDeCompra },
        include: { lineas: true },
      })
      if (!order)
        throw new ReceptionError(
          "ORDEN_COMPRA_NO_ENCONTRADA",
          404,
          "La orden de compra no existe."
        )
      if (order.estado !== "ENVIADA") {
        throw new ReceptionError(
          "ORDEN_NO_RECEPCIONABLE",
          409,
          "Solo se puede recibir una orden ENVIADA."
        )
      }
      if (
        !order.lineas.length ||
        order.lineas.some(
          (line) =>
            line.cantidadOrdenada <= 0 ||
            line.cantidadRecibida > line.cantidadOrdenada
        )
      ) {
        throw new ReceptionError(
          "CANTIDADES_ORDEN_INVALIDAS",
          409,
          "Las cantidades registradas de la orden no son coherentes."
        )
      }
      for (const input of inputs) {
        const line = order.lineas.find(
          (item) => item.idLineaDeOrdenDeCompra === input.idLineaDeOrdenDeCompra
        )
        if (!line)
          throw new ReceptionError(
            "LINEA_NO_PERTENECE_ORDEN",
            400,
            "Una de las líneas no pertenece a esta orden."
          )
        if (input.cantidadRecibidaAnterior !== line.cantidadRecibida) {
          throw new ReceptionError(
            "RECEPCION_DESACTUALIZADA",
            409,
            "La recepción cambió. Actualice el detalle antes de confirmar otra entrega."
          )
        }
        if (
          input.cantidadRecibida >
          line.cantidadOrdenada - line.cantidadRecibida
        ) {
          throw new ReceptionError(
            "CANTIDAD_EXCEDE_PENDIENTE",
            409,
            "La cantidad recibida no puede superar las unidades pendientes."
          )
        }
      }

      const movements = []
      const orderedLines = [...order.lineas].sort(
        (a, b) =>
          a.idProducto - b.idProducto ||
          a.idLineaDeOrdenDeCompra - b.idLineaDeOrdenDeCompra
      )
      for (const line of orderedLines) {
        const quantity =
          requested.get(line.idLineaDeOrdenDeCompra)?.cantidadRecibida ?? 0
        if (!quantity) continue
        const updated = await tx.producto.updateMany({
          where: {
            idProducto: line.idProducto,
            stockActual: { lte: 4294967295 - quantity },
          },
          data: { stockActual: { increment: quantity } },
        })
        if (!updated.count)
          throw new ReceptionError(
            "STOCK_FUERA_DE_RANGO",
            409,
            "El producto no está disponible o la recepción supera el límite de stock."
          )
        const movement = await tx.movimientoInventario.create({
          data: {
            idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra,
            tipoMovimiento: "ENTRADA",
            cantidad: quantity,
            costoUnitario: line.precioCostoUnitario,
          },
          select: { idMovimientoInventario: true },
        })
        await tx.lineaDeOrdenDeCompra.update({
          where: { idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra },
          data: { cantidadRecibida: { increment: quantity } },
        })
        await tx.auditoria.create({
          data: {
            idUsuario: session.user.idUsuario,
            tipoOperacion: "RECEPCION_INVENTARIO",
            nombreTablaAfectada: "movimientos_inventario",
            registroAfectado: movement.idMovimientoInventario,
            valorAnterior: {
              idOrdenDeCompra,
              idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra,
              cantidadRecibida: line.cantidadRecibida,
            },
            valorNuevo: {
              idOrdenDeCompra,
              idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra,
              idProducto: line.idProducto,
              cantidad: quantity,
              cantidadRecibida: line.cantidadRecibida + quantity,
              tipoMovimiento: "ENTRADA",
            },
            detalleCambio:
              "Recepción física de productos desde una orden de compra.",
          },
        })
        movements.push({
          idMovimientoInventario: movement.idMovimientoInventario,
          idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra,
          cantidad: quantity,
        })
      }
      const complete = order.lineas.every(
        (line) =>
          line.cantidadRecibida +
            (requested.get(line.idLineaDeOrdenDeCompra)?.cantidadRecibida ??
              0) ===
          line.cantidadOrdenada
      )
      const purchaseOrder = await tx.ordenDeCompra.update({
        where: { idOrdenDeCompra },
        data: {
          estadoRecepcion: complete ? "RECIBIDA" : "PARCIAL",
          fechaEntregaReal: complete ? new Date() : null,
        },
        include: {
          lineas: {
            include: {
              producto: { select: { idProducto: true, nombre: true } },
            },
          },
        },
      })
      return { purchaseOrder, movements }
    })
    return NextResponse.json(
      {
        code: "RECEPCION_REGISTRADA",
        message: "Recepción registrada e inventario actualizado.",
        ...result,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ReceptionError)
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status }
      )
    console.error("[PURCHASE_ORDER_RECEPTION_POST]", error)
    return NextResponse.json(
      {
        code: "ERROR_REGISTRAR_RECEPCION",
        message: "No fue posible registrar la recepción.",
      },
      { status: 500 }
    )
  }
}
