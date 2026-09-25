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

export type SearchResults = {
  productos: SearchProduct[]
  servicios: SearchService[]
}

export type SearchStatus = "idle" | "loading" | "success" | "error"
