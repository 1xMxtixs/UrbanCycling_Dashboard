import type { WorkOrder } from "@/app/(routes)/punto-ventas/ordenes-trabajo/types"

type PuntoVentaItem = {
  estadoPago?: string | null
  ordenTrabajo?: any
}

/** Convierte el item de /api/punto-venta en una WorkOrder con código de estado y estadoPago de la Venta. */
export function adaptarOrdenPuntoVenta(item: PuntoVentaItem): WorkOrder | null {
  const orden = item?.ordenTrabajo
  if (!orden) return null
  const tieneCodigo = Boolean(orden.codigoEstadoOrden)
  return {
    ...orden,
    estadoOrden: tieneCodigo ? orden.codigoEstadoOrden : orden.estadoOrden,
    estadoOrdenNombre: tieneCodigo ? orden.estadoOrden : (orden.estadoOrdenNombre ?? null),
    estadoPago: item.estadoPago ?? orden.venta?.estadoPago ?? orden.estadoPago,
  } as WorkOrder
}
