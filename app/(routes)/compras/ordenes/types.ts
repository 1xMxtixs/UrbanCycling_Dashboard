export type PurchaseOrder = {
  idOrdenDeCompra: number
  fechaRegistro: string
  fechaEntregaEstimada: string
  fechaEntregaReal?: string | null
  estado: string
  estadoPago: string
  estadoRecepcion: string
  montoTotal: number | string
  proveedor: { idProveedor: number; razonSocial: string }
  _count?: { lineas: number }
}

export type PurchaseOrderLineDetail = {
  idLineaDeOrdenDeCompra: number
  idProducto: number
  cantidadOrdenada: number
  cantidadRecibida: number
  precioCostoUnitario: number | string
  producto: { idProducto: number; nombre: string }
}

export type PurchaseOrderPaymentAssignment = {
  idAsignacionPago: number
  montoAsociado: number | string
  pago: {
    fechaRegistro: string
    estado: string
    metodoPago: string
    monto: number | string
  }
}

export type OrderDetail = PurchaseOrder & {
  montoSubtotal: number | string
  lineas: PurchaseOrderLineDetail[]
  asignacionesPago: PurchaseOrderPaymentAssignment[]
}

export type Provider = {
  idProveedor: number
  razonSocial: string
  nombreFantasia?: string | null
  rut: string
}

export type Product = {
  idProducto: number
  nombre: string
  tipoProducto: string
  costoPromedio: number | string
  estado: string
}

export type CreatePurchaseOrderLine = {
  idProducto: number
  cantidadOrdenada: number
  precioCostoUnitario: number
}

