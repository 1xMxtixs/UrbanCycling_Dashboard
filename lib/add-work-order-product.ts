import { EstadoDocumentoTributario, EstadoPagoVenta, EstadoRegistro, type Prisma } from "@/generated/prisma"
import { bloquearOrdenesTrabajo } from "@/app/api/_lib/work-order-lock"
import { descontarStockProductos, recalcularTotalesOrdenTrabajo } from "@/lib/stored-procedures"
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit"
import { ESTADO_OT } from "@/lib/work-order-status"
import { validarCantidadProducto, WorkOrderProductError } from "@/lib/work-order-products"

/** El llamador debe envolver toda la operación en una transacción. */
export async function agregarProductoOrden(
  tx: Prisma.TransactionClient,
  input: { idOrdenDeTrabajo: number; idProducto: number; cantidad: number; idUsuario: number },
) {
  const { idOrdenDeTrabajo, idProducto, cantidad, idUsuario } = input
  validarCantidadProducto(cantidad)
  // Serializa incluso la primera incorporación, cuando aún no existe la línea.
  await bloquearOrdenesTrabajo(tx, [idOrdenDeTrabajo])
  const orden = await tx.ordenDeTrabajo.findUnique({
    where: { idOrdenDeTrabajo },
    include: { venta: { select: {
      estadoPago: true,
      asignacionesPago: { select: { idAsignacionPago: true } },
      origenesDTE: {
        where: { documentoTributario: { estado: EstadoDocumentoTributario.EMITIDO } },
        select: { idOrigenDocumentoTributario: true },
      },
    } } },
  })
  if (!orden) throw new WorkOrderProductError("ORDEN_NO_EXISTE", "La orden de trabajo no existe", 404)
  if (orden.estado !== ESTADO_OT.POR_REALIZAR && orden.estado !== ESTADO_OT.EN_CURSO) {
    throw new WorkOrderProductError("ORDEN_NO_MODIFICABLE", 'La orden debe estar "Por realizar" o "En curso" para agregar productos', 409)
  }
  if (orden.venta.estadoPago !== EstadoPagoVenta.PENDIENTE || orden.venta.asignacionesPago.length > 0) {
    throw new WorkOrderProductError("ORDEN_CON_PAGOS", "No se pueden agregar productos a una orden con pagos registrados", 409)
  }
  if (orden.venta.origenesDTE.length > 0) {
    throw new WorkOrderProductError("ORDEN_CON_DOCUMENTO_TRIBUTARIO", "No se pueden agregar productos a una orden con documento tributario emitido", 409)
  }
  const producto = await tx.producto.findUnique({ where: { idProducto } })
  if (!producto) throw new WorkOrderProductError("PRODUCTO_NO_EXISTE", "El producto no existe", 404)
  if (producto.estado !== EstadoRegistro.ACTIVO) {
    throw new WorkOrderProductError("PRODUCTO_INACTIVO", "El producto debe estar activo", 409)
  }
  const lineas = await tx.lineaDeOrdenDeTrabajo.findMany({ where: { idOrdenDeTrabajo, idProducto } })
  if (lineas.length > 1) {
    throw new WorkOrderProductError("PRODUCTO_DUPLICADO_EXISTENTE", "Esta orden tiene registros antiguos duplicados de este producto. Deben conciliarse antes de agregar más unidades.", 409)
  }
  const anterior = lineas[0]
  const cantidadNueva = (anterior?.cantidad ?? 0) + cantidad
  validarCantidadProducto(cantidadNueva)
  const precioUnitario = anterior?.precioUnitario ?? producto.precioVenta
  if (Number(precioUnitario) * cantidadNueva > 999999999999) {
    throw new WorkOrderProductError("MONTO_FUERA_DE_RANGO", "El importe del producto supera el rango permitido")
  }
  const linea = anterior
    ? await tx.lineaDeOrdenDeTrabajo.update({
        where: { idLineaDeOrdenDeTrabajo: anterior.idLineaDeOrdenDeTrabajo },
        data: { cantidad: { increment: cantidad } },
      })
    : await tx.lineaDeOrdenDeTrabajo.create({ data: {
        idOrdenDeTrabajo, idProducto, idServicio: null, cantidad,
        precioUnitario, descuentoUnitario: 0, costoUnitario: producto.costoPromedio,
      } })

  // La SP bloquea el producto, comprueba existencias y registra la SALIDA.
  // Solo consume lo agregado; nunca se descuenta otra vez la cantidad anterior.
  await descontarStockProductos(tx, [{
    idProducto, cantidad, idLineaDeOrdenDeTrabajo: linea.idLineaDeOrdenDeTrabajo,
  }])
  await recalcularTotalesOrdenTrabajo(tx, idOrdenDeTrabajo)
  const actualizada = await tx.ordenDeTrabajo.findUniqueOrThrow({ where: { idOrdenDeTrabajo } })
  await registrarAuditoriaOrdenTrabajo(tx, {
    idUsuario, idOrdenDeTrabajo, tipoOperacion: "incorporacion_producto",
    valorAnterior: { linea: anterior ?? null, montoTotal: orden.montoTotal },
    valorNuevo: { linea, cantidadAgregada: cantidad, montoTotal: actualizada.montoTotal },
    detalleCambio: `${producto.nombre}: ${anterior?.cantidad ?? 0} → ${cantidadNueva} unidades`,
  })
  return { linea, montoTotal: actualizada.montoTotal, cantidadAgregada: cantidad, acumulado: Boolean(anterior) }
}
