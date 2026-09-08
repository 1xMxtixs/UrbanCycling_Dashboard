export type ItemType = "producto" | "servicio"

export interface SearchResultItem {
  id: number
  tipo: ItemType
  nombre: string
  codigo?: string | null
  descripcion?: string | null
  precioVenta: number
  stockActual?: number | null
  stockMinimo?: number | null
  estado: string
  urlImagen?: string | null
}
