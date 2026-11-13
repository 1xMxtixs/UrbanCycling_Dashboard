import {
  EstadoDocumentoTributario,
  EstadoPagoVenta,
  type Prisma,
} from "@/generated/prisma"
import { bloquearOrdenesTrabajo } from "@/app/api/_lib/work-order-lock"
import {
  ajustarStockPorCantidadLineaOrden,
  recalcularTotalesOrdenTrabajo,
} from "@/lib/stored-procedures"
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit"
import { ESTADO_OT } from "@/lib/work-order-status"
import { WorkOrderProductError } from "@/lib/work-order-products"

type RemoveWorkOrderProductInput = {
  idOrdenDeTrabajo: number
  idLineaDeOrdenDeTrabajo: number
  idUsuario: number
}

/**
 * Elimina una linea directa de producto de una ODT y devuelve todas sus
 * unidades al inventario. El llamador debe ejecutar este metodo dentro de una
 * transaccion para que stock, linea, totales y auditoria cambien en conjunto.
 */
export async function eliminarProductoOrden(
  tx: Prisma.TransactionClient,
  input: RemoveWorkOrderProductInput,
) {
  const { idOrdenDeTrabajo, idLineaDeOrdenDeTrabajo, idUsuario } = input

  // Serializa las modificaciones concurrentes de productos sobre la misma ODT.
  await bloquearOrdenesTrabajo(tx, [idOrdenDeTrabajo])

  const orden = await tx.ordenDeTrabajo.findUnique({
    where: { idOrdenDeTrabajo },
    include: {
      venta: {
        select: {
          estadoPago: true,
          asignacionesPago: {
            select: { idAsignacionPago: true },
          },
          origenesDTE: {
            where: {
              documentoTributario: {
                estado: EstadoDocumentoTributario.EMITIDO,
              },
            },
            select: { idOrigenDocumentoTributario: true },
          },
        },
      },
    },
  })

  if (!orden) {
    throw new WorkOrderProductError(
      "ORDEN_NO_EXISTE",
      "La orden de trabajo no existe",
      404,
    )
  }

  if (
    orden.estado !== ESTADO_OT.POR_REALIZAR &&
    orden.estado !== ESTADO_OT.EN_CURSO
  ) {
    throw new WorkOrderProductError(
      "ORDEN_NO_MODIFICABLE",
      'La orden debe estar "Por realizar" o "En curso" para eliminar productos',
      409,
    )
  }

  if (
    orden.venta.estadoPago !== EstadoPagoVenta.PENDIENTE ||
    orden.venta.asignacionesPago.length > 0
  ) {
    throw new WorkOrderProductError(
      "ORDEN_CON_PAGOS",
      "No se pueden eliminar productos de una orden con pagos registrados",
      409,
    )
  }

  if (orden.venta.origenesDTE.length > 0) {
    throw new WorkOrderProductError(
      "ORDEN_CON_DOCUMENTO_TRIBUTARIO",
      "No se pueden eliminar productos de una orden con documento tributario emitido",
      409,
    )
  }

  const linea = await tx.lineaDeOrdenDeTrabajo.findFirst({
    where: {
      idLineaDeOrdenDeTrabajo,
      idOrdenDeTrabajo,
      cantidad: { gt: 0 },
    },
    include: { producto: true },
  })

  if (!linea) {
    throw new WorkOrderProductError(
      "LINEA_NO_EXISTE",
      "La linea no pertenece a la orden de trabajo",
      404,
    )
  }

  if (!linea.idProducto || linea.idServicio) {
    throw new WorkOrderProductError(
      "LINEA_NO_ES_PRODUCTO",
      "La linea seleccionada no corresponde a un producto",
      409,
    )
  }

  // Una diferencia negativa registra una ENTRADA y restituye la cantidad total.
  const ajusteInventario = await ajustarStockPorCantidadLineaOrden(tx, {
    idProducto: linea.idProducto,
    idLineaDeOrdenDeTrabajo: linea.idLineaDeOrdenDeTrabajo,
    diferencia: -linea.cantidad,
    costoUnitario: linea.costoUnitario,
  })

  // La cantidad cero archiva la linea sin romper la referencia historica de
  // sus movimientos. Las consultas de la ODT ocultan estas lineas archivadas.
  const lineaArchivada = await tx.lineaDeOrdenDeTrabajo.update({
    where: { idLineaDeOrdenDeTrabajo },
    data: { cantidad: 0 },
  })

  const montoTotal = await recalcularTotalesOrdenTrabajo(
    tx,
    idOrdenDeTrabajo,
  )

  await registrarAuditoriaOrdenTrabajo(tx, {
    idUsuario,
    idOrdenDeTrabajo,
    tipoOperacion: "eliminacion_producto",
    valorAnterior: {
      linea,
      montoTotal: orden.montoTotal,
      stockAnterior: ajusteInventario?.stockAnterior,
    },
    valorNuevo: {
      linea: lineaArchivada,
      cantidadActiva: 0,
      montoTotal,
      stockNuevo: ajusteInventario?.stockNuevo,
    },
    detalleCambio:
      `${linea.producto?.nombre ?? `Producto #${linea.idProducto}`}: ` +
      `${linea.cantidad} unidades eliminadas y devueltas al inventario`,
  })

  return {
    lineaEliminada: {
      idLineaDeOrdenDeTrabajo,
      idProducto: linea.idProducto,
      cantidad: linea.cantidad,
    },
    stockNuevo: ajusteInventario?.stockNuevo,
    montoTotal,
  }
}
