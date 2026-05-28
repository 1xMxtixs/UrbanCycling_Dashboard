// Repositorio temporal en memoria que reemplaza la futura conexion a base de datos.
import type {
  InventoryProduct,
  InventoryProductFilters,
  InventoryRepository,
  PaginatedInventoryProducts,
  UpdateInventoryProductInput,
} from "@/lib/inventory/types"

type InventoryStore = {
  sequence: number
  products: InventoryProduct[]
}

declare global {
  var urbanCyclingInventoryStore: InventoryStore | undefined
}

function getStore(): InventoryStore {
  globalThis.urbanCyclingInventoryStore ??= {
    sequence: 1,
    products: [],
  }

  return globalThis.urbanCyclingInventoryStore
}

function matchesFilters(
  product: InventoryProduct,
  filters: InventoryProductFilters
): boolean {
  const normalizedSearch = filters.search?.toLowerCase()

  if (normalizedSearch) {
    const searchable = [
      product.nombre,
      product.tipo,
      product.descripcion,
      String(product.id_producto),
    ]
      .join(" ")
      .toLowerCase()

    if (!searchable.includes(normalizedSearch)) return false
  }

  if (filters.tipo && product.tipo !== filters.tipo) return false
  if (filters.estado && product.estado !== filters.estado) return false
  if (
    filters.categoriaId !== undefined &&
    !product.categorias.includes(filters.categoriaId)
  ) {
    return false
  }
  if (filters.lowStock && product.stock_actual > product.stock_minimo)
    return false

  return true
}

export function createInMemoryInventoryRepository(): InventoryRepository {
  const store = getStore()

  return {
    async findMany(filters, pagination): Promise<PaginatedInventoryProducts> {
      const filteredProducts = store.products.filter((product) =>
        matchesFilters(product, filters)
      )
      const total = filteredProducts.length
      const totalPages = Math.max(Math.ceil(total / pagination.limit), 1)
      const start = (pagination.page - 1) * pagination.limit
      const end = start + pagination.limit

      return {
        data: filteredProducts.slice(start, end),
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
        },
      }
    },

    async findById(id_producto) {
      return (
        store.products.find((product) => product.id_producto === id_producto) ??
        null
      )
    },

    async findByName(nombre) {
      const normalizedName = nombre.trim().toLowerCase()

      return (
        store.products.find(
          (product) => product.nombre.toLowerCase() === normalizedName
        ) ?? null
      )
    },

    async create(input) {
      const product: InventoryProduct = {
        id_producto: store.sequence,
        tipo: input.tipo,
        nombre: input.nombre,
        descripcion: input.descripcion ?? "",
        estado: input.estado ?? "activo",
        precio_venta: input.precio_venta,
        stock_minimo: input.stock_minimo,
        stock_actual: input.stock_actual,
        categorias: input.categorias ?? [],
      }

      store.sequence += 1
      store.products.push(product)

      return product
    },

    async update(id_producto, input: UpdateInventoryProductInput) {
      const productIndex = store.products.findIndex(
        (product) => product.id_producto === id_producto
      )

      if (productIndex === -1) return null

      const currentProduct = store.products[productIndex]
      const updatedProduct: InventoryProduct = {
        ...currentProduct,
        ...input,
        categorias: input.categorias ?? currentProduct.categorias,
      }

      store.products[productIndex] = updatedProduct

      return updatedProduct
    },

    async delete(id_producto) {
      const productIndex = store.products.findIndex(
        (product) => product.id_producto === id_producto
      )

      if (productIndex === -1) return false

      store.products.splice(productIndex, 1)
      return true
    },
  }
}
