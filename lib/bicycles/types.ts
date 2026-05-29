// Contratos TypeScript del CRUD de bicicletas segun el modelo relacional.
export type Bicycle = {
  id_bicicleta: number
  id_venta: number
  marca: string
  modelo: string
  color: string
  descripcion_adicional: string
}

export type CreateBicycleInput = {
  id_venta: number
  marca: string
  modelo: string
  color: string
  descripcion_adicional?: string
}

export type UpdateBicycleInput = Partial<CreateBicycleInput>

export type BicycleFilters = {
  search?: string
  id_venta?: number
  marca?: string
  modelo?: string
  color?: string
}

export type PaginatedBicycles = {
  data: Bicycle[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type BicycleRepository = {
  findMany(
    filters: BicycleFilters,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedBicycles>
  findById(id_bicicleta: number): Promise<Bicycle | null>
  create(bicycle: CreateBicycleInput): Promise<Bicycle>
  update(
    id_bicicleta: number,
    bicycle: UpdateBicycleInput
  ): Promise<Bicycle | null>
  delete(id_bicicleta: number): Promise<boolean>
}
