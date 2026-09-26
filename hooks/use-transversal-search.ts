"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type {
  SearchProduct,
  SearchService,
  SearchCliente,
  SearchWorkOrder,
  SearchResults,
  SearchStatus,
} from "@/types/search"

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

// Cache en módulo — persiste entre renders y navegaciones del mismo tab
let cachedProducts: SearchProduct[] | null = null
let cachedServices: SearchService[] | null = null
let cachedClientes: SearchCliente[] | null = null
let cachedOrdenes: SearchWorkOrder[] | null = null
let isFetching = false

interface RawCliente {
  idCliente: number
  tipoCliente: string
  rut: string
  primerNombre?: string | null
  segundoNombre?: string | null
  apellidoPaterno?: string | null
  apellidoMaterno?: string | null
  razonSocial?: string | null
  nombreContacto?: string | null
  estado: string
  correo?: string | null
  telefonos?: Array<{ telefono: string }>
}

interface RawWorkOrderItem {
  tipoOperacion?: string
  ordenTrabajo?: {
    idOrdenDeTrabajo: number
    estadoOrden?: string
    estado?: string
    montoTotal?: number | string
    total?: number | string
    cliente?: {
      primerNombre?: string | null
      segundoNombre?: string | null
      apellidoPaterno?: string | null
      apellidoMaterno?: string | null
      razonSocial?: string | null
      rut?: string
    } | null
    bicicletas?: Array<{
      marca?: string
      modelo?: string
      color?: string
    }>
  }
}

async function fetchCatalog(): Promise<{
  products: SearchProduct[]
  services: SearchService[]
  clientes: SearchCliente[]
  ordenes: SearchWorkOrder[]
}> {
  if (cachedProducts && cachedServices && cachedClientes && cachedOrdenes) {
    return {
      products: cachedProducts,
      services: cachedServices,
      clientes: cachedClientes,
      ordenes: cachedOrdenes,
    }
  }

  if (isFetching) {
    // Esperar que la petición en vuelo termine
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (!isFetching) {
          clearInterval(interval)
          resolve()
        }
      }, 50)
    })
    return {
      products: cachedProducts ?? [],
      services: cachedServices ?? [],
      clientes: cachedClientes ?? [],
      ordenes: cachedOrdenes ?? [],
    }
  }

  isFetching = true
  try {
    const [inventoryRes, serviciosRes, clientesRes, puntoVentaRes] = await Promise.all([
      fetch("/api/inventory", { cache: "no-store" }),
      fetch("/api/servicios", { cache: "no-store" }),
      fetch("/api/clientes", { cache: "no-store" }),
      fetch("/api/punto-venta", { cache: "no-store" }),
    ])

    cachedProducts = inventoryRes.ok ? ((await inventoryRes.json()) as SearchProduct[]) : []
    cachedServices = serviciosRes.ok ? ((await serviciosRes.json()) as SearchService[]) : []

    if (clientesRes.ok) {
      const rawClientes = (await clientesRes.json()) as RawCliente[]
      cachedClientes = Array.isArray(rawClientes)
        ? rawClientes.map((c) => {
            const nombre =
              c.tipoCliente === "juridica"
                ? c.razonSocial || "Empresa sin razón social"
                : [c.primerNombre, c.segundoNombre, c.apellidoPaterno, c.apellidoMaterno]
                    .filter(Boolean)
                    .join(" ") || "Cliente sin nombre"

            return {
              idCliente: c.idCliente,
              tipoCliente: c.tipoCliente,
              rut: c.rut,
              nombreCompleto: nombre,
              telefono: c.telefonos?.[0]?.telefono,
              correo: c.correo ?? undefined,
              estado: c.estado,
            }
          })
        : []
    } else {
      cachedClientes = []
    }

    if (puntoVentaRes.ok) {
      const rawPv = (await puntoVentaRes.json()) as RawWorkOrderItem[]
      cachedOrdenes = Array.isArray(rawPv)
        ? rawPv
            .filter((item) => item.tipoOperacion === "orden_trabajo" && item.ordenTrabajo)
            .map((item) => {
              const ot = item.ordenTrabajo!
              const cli = ot.cliente
              const clienteNombre = cli
                ? cli.razonSocial ||
                  [cli.primerNombre, cli.segundoNombre, cli.apellidoPaterno, cli.apellidoMaterno]
                    .filter(Boolean)
                    .join(" ") ||
                  "Cliente no registrado"
                : "Cliente no registrado"

              const b = ot.bicicletas?.[0]
              const bicicletaResumen = b
                ? `${b.marca ?? ""} ${b.modelo ?? ""}`.trim()
                : undefined

              return {
                idOrdenDeTrabajo: ot.idOrdenDeTrabajo,
                clienteNombre,
                rutCliente: cli?.rut,
                bicicletaResumen,
                estadoOrden: ot.estadoOrden || ot.estado || "recibido",
                total: ot.total ?? ot.montoTotal ?? 0,
              }
            })
        : []
    } else {
      cachedOrdenes = []
    }
  } catch {
    cachedProducts = cachedProducts ?? []
    cachedServices = cachedServices ?? []
    cachedClientes = cachedClientes ?? []
    cachedOrdenes = cachedOrdenes ?? []
  } finally {
    isFetching = false
  }

  return {
    products: cachedProducts ?? [],
    services: cachedServices ?? [],
    clientes: cachedClientes ?? [],
    ordenes: cachedOrdenes ?? [],
  }
}

function filterResults(
  query: string,
  products: SearchProduct[],
  services: SearchService[],
  clientes: SearchCliente[],
  ordenes: SearchWorkOrder[],
): SearchResults {
  const q = query.trim().toLowerCase()
  const qClean = q.replace(/^#/, "").trim()

  const filteredProducts = products
    .filter((p) => p.nombre.toLowerCase().includes(q) || String(p.idProducto) === qClean)
    .slice(0, 4)

  const filteredServices = services
    .filter((s) => s.nombre.toLowerCase().includes(q) || s.codigo.toLowerCase().includes(q))
    .slice(0, 3)

  const filteredClientes = clientes
    .filter((c) => {
      const rutClean = c.rut.toLowerCase().replace(/[\.\-]/g, "")
      const searchRutClean = q.replace(/[\.\-]/g, "")
      return (
        c.nombreCompleto.toLowerCase().includes(q) ||
        (searchRutClean.length >= 3 && rutClean.includes(searchRutClean)) ||
        (c.telefono && c.telefono.includes(q))
      )
    })
    .slice(0, 4)

  const filteredOrdenes = ordenes
    .filter((o) => {
      const idMatch =
        String(o.idOrdenDeTrabajo) === qClean ||
        String(o.idOrdenDeTrabajo).includes(qClean) ||
        `#${o.idOrdenDeTrabajo}`.includes(q)
      const clientMatch = o.clienteNombre.toLowerCase().includes(q)
      const bikeMatch = o.bicicletaResumen?.toLowerCase().includes(q)
      return idMatch || clientMatch || bikeMatch
    })
    .slice(0, 4)

  return {
    productos: filteredProducts,
    servicios: filteredServices,
    clientes: filteredClientes,
    ordenes: filteredOrdenes,
  }
}

export function useTransversalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>({
    productos: [],
    servicios: [],
    clientes: [],
    ordenes: [],
  })
  const [status, setStatus] = useState<SearchStatus>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (rawQuery: string) => {
    const trimmed = rawQuery.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults({ productos: [], servicios: [], clientes: [], ordenes: [] })
      setStatus("idle")
      return
    }

    setStatus("loading")

    try {
      const { products, services, clientes, ordenes } = await fetchCatalog()
      const filtered = filterResults(trimmed, products, services, clientes, ordenes)
      setResults(filtered)
      setStatus("success")
    } catch {
      setResults({ productos: [], servicios: [], clientes: [], ordenes: [] })
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      search(query)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  const clearSearch = useCallback(() => {
    setQuery("")
    setResults({ productos: [], servicios: [], clientes: [], ordenes: [] })
    setStatus("idle")
  }, [])

  /** Invalida la caché de módulo */
  const invalidateCache = useCallback(() => {
    cachedProducts = null
    cachedServices = null
    cachedClientes = null
    cachedOrdenes = null
  }, [])

  const hasResults =
    results.productos.length > 0 ||
    results.servicios.length > 0 ||
    results.clientes.length > 0 ||
    results.ordenes.length > 0

  const isOpen =
    query.trim().length >= MIN_QUERY_LENGTH &&
    (status === "loading" || status === "success" || status === "error")

  return {
    query,
    setQuery,
    results,
    status,
    hasResults,
    isOpen,
    clearSearch,
    invalidateCache,
  }
}

