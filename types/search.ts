export type SearchProduct = {
  idProducto: number
  nombre: string
  tipoProducto: string
  stockActual: number
  stockMinimo: number
  precioVenta: number | string
  estado: string
  urlImagen?: string | null
  imagenesProducto?: Array<{ url: string }>
}

export type SearchService = {
  idServicio: number
  nombre: string
  codigo: string
  precioVenta: number
  estado: string
}

export type SearchCliente = {
  idCliente: number
  tipoCliente: string
  rut: string
  nombreCompleto: string
  telefono?: string
  correo?: string
  estado: string
}

export type SearchWorkOrder = {
  idOrdenDeTrabajo: number
  clienteNombre: string
  rutCliente?: string
  bicicletaResumen?: string
  estadoOrden: string
  total: number | string
}

export type SearchResults = {
  productos: SearchProduct[]
  servicios: SearchService[]
  clientes: SearchCliente[]
  ordenes: SearchWorkOrder[]
}

export type SearchStatus = "idle" | "loading" | "success" | "error"

