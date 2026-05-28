// Contratos TypeScript del CRUD de inventario segun el modelo relacional.
export type ProductStatus = "activo" | "inactivo"

export type InventoryProduct = {
  id_producto: number
  tipo: string
  nombre: string
  descripcion: string
  estado: ProductStatus
  precio_venta: number
  stock_minimo: number
  stock_actual: number
  categorias: number[]
}

export type CreateInventoryProductInput = {
  tipo: string
  nombre: string
  descripcion?: string
  estado?: ProductStatus
  precio_venta: number
  stock_minimo: number
  stock_actual: number
  categorias?: number[]
}

export type UpdateInventoryProductInput = Partial<CreateInventoryProductInput>

export type InventoryProductFilters = {
  search?: string
  tipo?: string
  estado?: ProductStatus
  categoriaId?: number
  lowStock?: boolean
}

export type PaginatedInventoryProducts = {
  data: InventoryProduct[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type InventoryRepository = {
  findMany(
    filters: InventoryProductFilters,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedInventoryProducts>
  findById(id_producto: number): Promise<InventoryProduct | null>
  findByName(nombre: string): Promise<InventoryProduct | null>
  create(product: CreateInventoryProductInput): Promise<InventoryProduct>
  update(
    id_producto: number,
    product: UpdateInventoryProductInput
  ): Promise<InventoryProduct | null>
  delete(id_producto: number): Promise<boolean>
}
