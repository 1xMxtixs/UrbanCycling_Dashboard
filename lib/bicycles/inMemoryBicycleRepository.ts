// Repositorio temporal en memoria que reemplaza la futura conexion a base de datos.
import type {
  Bicycle,
  BicycleFilters,
  BicycleRepository,
  PaginatedBicycles,
  UpdateBicycleInput,
} from "@/lib/bicycles/types"

type BicycleStore = {
  sequence: number
  bicycles: Bicycle[]
}

declare global {
  var urbanCyclingBicycleStore: BicycleStore | undefined
}

function getStore(): BicycleStore {
  globalThis.urbanCyclingBicycleStore ??= {
    sequence: 1,
    bicycles: [],
  }

  return globalThis.urbanCyclingBicycleStore
}

function matchesFilters(bicycle: Bicycle, filters: BicycleFilters): boolean {
  const normalizedSearch = filters.search?.toLowerCase()

  if (normalizedSearch) {
    const searchable = [
      bicycle.marca,
      bicycle.modelo,
      bicycle.color,
      bicycle.descripcion_adicional,
      String(bicycle.id_bicicleta),
      String(bicycle.id_venta),
    ]
      .join(" ")
      .toLowerCase()

    if (!searchable.includes(normalizedSearch)) return false
  }

  if (filters.id_venta !== undefined && bicycle.id_venta !== filters.id_venta) {
    return false
  }
  if (filters.marca && bicycle.marca !== filters.marca) return false
  if (filters.modelo && bicycle.modelo !== filters.modelo) return false
  if (filters.color && bicycle.color !== filters.color) return false

  return true
}

export function createInMemoryBicycleRepository(): BicycleRepository {
  const store = getStore()

  return {
    async findMany(filters, pagination): Promise<PaginatedBicycles> {
      const filteredBicycles = store.bicycles.filter((bicycle) =>
        matchesFilters(bicycle, filters)
      )
      const total = filteredBicycles.length
      const totalPages = Math.max(Math.ceil(total / pagination.limit), 1)
      const start = (pagination.page - 1) * pagination.limit
      const end = start + pagination.limit

      return {
        data: filteredBicycles.slice(start, end),
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
        },
      }
    },

    async findById(id_bicicleta) {
      return (
        store.bicycles.find(
          (bicycle) => bicycle.id_bicicleta === id_bicicleta
        ) ?? null
      )
    },

    async create(input) {
      const bicycle: Bicycle = {
        id_bicicleta: store.sequence,
        id_venta: input.id_venta,
        marca: input.marca,
        modelo: input.modelo,
        color: input.color,
        descripcion_adicional: input.descripcion_adicional ?? "",
      }

      store.sequence += 1
      store.bicycles.push(bicycle)

      return bicycle
    },

    async update(id_bicicleta, input: UpdateBicycleInput) {
      const bicycleIndex = store.bicycles.findIndex(
        (bicycle) => bicycle.id_bicicleta === id_bicicleta
      )

      if (bicycleIndex === -1) return null

      const currentBicycle = store.bicycles[bicycleIndex]
      const updatedBicycle: Bicycle = {
        ...currentBicycle,
        ...input,
      }

      store.bicycles[bicycleIndex] = updatedBicycle

      return updatedBicycle
    },

    async delete(id_bicicleta) {
      const bicycleIndex = store.bicycles.findIndex(
        (bicycle) => bicycle.id_bicicleta === id_bicicleta
      )

      if (bicycleIndex === -1) return false

      store.bicycles.splice(bicycleIndex, 1)
      return true
    },
  }
}
