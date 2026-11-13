import { EstadoRegistro, type Prisma } from "@/generated/prisma"
import { bloquearOrdenesTrabajo } from "@/app/api/_lib/work-order-lock"
import {
  descontarStockProductos,
  recalcularTotalesOrdenTrabajo,
} from "@/lib/stored-procedures"
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit"
import { ESTADOS_OT_CERRADOS } from "@/lib/work-order-status"

export class WorkOrderServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400
  ) {
    super(message)
    this.name = "WorkOrderServiceError"
  }
}

/**
 * Agrega un servicio a una ODT. Sus insumos son opcionales; cuando existen,
 * stock, movimientos, totales y auditoria cambian en la misma transaccion.
 */
export async function agregarServicioOrden(
  tx: Prisma.TransactionClient,
  input: {
    idOrdenDeTrabajo: number
    idServicio: number
    cantidad: number
    idUsuario: number
  }
) {
  const { idOrdenDeTrabajo, idServicio, cantidad, idUsuario } = input

  if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
    throw new WorkOrderServiceError(
      "CANTIDAD_INVALIDA",
      "La cantidad debe ser un entero positivo"
    )
  }

  // Serializa incorporaciones concurrentes incluso si la ODT no tiene lineas.
  await bloquearOrdenesTrabajo(tx, [idOrdenDeTrabajo])

  const orden = await tx.ordenDeTrabajo.findUnique({
    where: { idOrdenDeTrabajo },
  })

  if (!orden) {
    throw new WorkOrderServiceError(
      "ORDEN_NO_EXISTE",
      "La orden de trabajo no existe",
      404
    )
  }

  if (ESTADOS_OT_CERRADOS.some((estado) => estado === orden.estado)) {
    throw new WorkOrderServiceError(
      "ORDEN_CERRADA",
      "No se pueden agregar servicios a una orden entregada o anulada",
      409
    )
  }

  const servicio = await tx.servicio.findUnique({
    where: { idServicio },
    include: {
      productosServicio: {
        include: { producto: true },
      },
    },
  })

  if (!servicio) {
    throw new WorkOrderServiceError(
      "SERVICIO_NO_EXISTE",
      "El servicio no existe",
      404
    )
  }

  if (servicio.estado !== EstadoRegistro.ACTIVO) {
    throw new WorkOrderServiceError(
      "SERVICIO_INACTIVO",
      "El servicio debe estar activo",
      409
    )
  }

  if (Number(servicio.precioVenta) * cantidad > 999999999999) {
    throw new WorkOrderServiceError(
      "MONTO_FUERA_DE_RANGO",
      "El importe del servicio supera el rango permitido"
    )
  }

  const linea = await tx.lineaDeOrdenDeTrabajo.create({
    data: {
      idOrdenDeTrabajo,
      idServicio: servicio.idServicio,
      idProducto: null,
      cantidad,
      precioUnitario: servicio.precioVenta,
      descuentoUnitario: 0,
      costoUnitario: 0,
    },
  })

  // Agrupa asociaciones repetidas para descontar y registrar una sola salida
  // por producto. Un servicio sin asociaciones produce una lista vacia valida.
  const cantidadesPorProducto = new Map<number, number>()
  for (const asociacion of servicio.productosServicio) {
    cantidadesPorProducto.set(
      asociacion.idProducto,
      (cantidadesPorProducto.get(asociacion.idProducto) ?? 0) +
        asociacion.cantidad * cantidad
    )
  }

  const insumos = [...cantidadesPorProducto].map(
    ([idProducto, cantidadInsumo]) => ({
      idProducto,
      cantidad: cantidadInsumo,
      idLineaDeOrdenDeTrabajo: linea.idLineaDeOrdenDeTrabajo,
    })
  )

  // El helper no modifica stock cuando la lista esta vacia y, cuando contiene
  // insumos, bloquea productos y registra sus movimientos de inventario.
  await descontarStockProductos(tx, insumos)
  await recalcularTotalesOrdenTrabajo(tx, idOrdenDeTrabajo)

  const [ordenActualizada, productosActualizados] = await Promise.all([
    tx.ordenDeTrabajo.findUniqueOrThrow({ where: { idOrdenDeTrabajo } }),
    insumos.length
      ? tx.producto.findMany({
          where: { idProducto: { in: insumos.map((item) => item.idProducto) } },
        })
      : Promise.resolve([]),
  ])
  const productosPorId = new Map(
    productosActualizados.map((producto) => [producto.idProducto, producto])
  )
  const productosUtilizados = insumos.map((item) => {
    const producto = productosPorId.get(item.idProducto)
    const stockNuevo = producto?.stockActual ?? 0

    return {
      id_producto: item.idProducto,
      idProducto: item.idProducto,
      nombre: producto?.nombre ?? `Producto #${item.idProducto}`,
      cantidad_utilizada: item.cantidad,
      stock_anterior: stockNuevo + item.cantidad,
      stock_nuevo: stockNuevo,
    }
  })

  await registrarAuditoriaOrdenTrabajo(tx, {
    idUsuario,
    idOrdenDeTrabajo,
    tipoOperacion: "incorporacion_servicio",
    valorAnterior: {
      montoTotal: orden.montoTotal,
    },
    valorNuevo: {
      linea,
      productosUtilizados,
      montoTotal: ordenActualizada.montoTotal,
    },
    detalleCambio: `Se agrego ${cantidad} x ${servicio.nombre}`,
  })

  return {
    linea,
    servicio: {
      idServicio: servicio.idServicio,
      codigo: servicio.codigo,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precioVenta: servicio.precioVenta,
      estado: servicio.estado,
    },
    orden: ordenActualizada,
    totalServicios: Number(ordenActualizada.montoTotal),
    productosUtilizados,
  }
}
