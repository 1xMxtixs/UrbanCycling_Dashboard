"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type {
  SearchProduct,
  SearchService,
  SearchCliente,
  SearchWorkOrder,
  SearchSale,
  SearchResults,
  SearchStatus,
} from "@/types/search"
import { includesNormalizedText, normalizeSearchText } from "@/lib/search-normalization"

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

// Cache en módulo — persiste entre renders y navegaciones del mismo tab
let cachedProducts: SearchProduct[] | null = null
let cachedServices: SearchService[] | null = null
let cachedClientes: SearchCliente[] | null = null
let cachedOrdenes: SearchWorkOrder[] | null = null
let cachedVentas: SearchSale[] | null = null
let cacheTimestamp = 0
let isFetching = false
const CACHE_TTL_MS = 30_000

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
  cliente?: {
    primerNombre?: string | null
    segundoNombre?: string | null
    apellidoPaterno?: string | null
    apellidoMaterno?: string | null
    razonSocial?: string | null
    rut?: string
  } | null
  venta?: { idVenta: number }
  total?: number | string
  montoTotal?: number | string
  estadoPago?: string
  fechaRegistro?: string
  fechaCreacion?: string
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
  ventas: SearchSale[]
}> {
  if (cachedProducts && cachedServices && cachedClientes && cachedOrdenes && cachedVentas && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return {
      products: cachedProducts,
      services: cachedServices,
      clientes: cachedClientes,
      ordenes: cachedOrdenes,
      ventas: cachedVentas,
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
      ventas: cachedVentas ?? [],
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
            const razonSocial = c.razonSocial?.trim()
            const esPersonaJuridica = ["juridica", "juridico"].includes(
              c.tipoCliente.trim().toLocaleLowerCase("es-CL"),
            )
            const nombreNatural = [
              c.primerNombre,
              c.segundoNombre,
              c.apellidoPaterno,
              c.apellidoMaterno,
            ]
              .filter(Boolean)
              .join(" ")
            const nombre =
              razonSocial ||
              (esPersonaJuridica
                ? "Empresa sin razón social"
                : nombreNatural || "Cliente sin nombre")

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
      cachedVentas = Array.isArray(rawPv)
        ? rawPv
            .filter((item) => item.tipoOperacion === "venta" && item.venta)
            .map((item) => {
              const cli = item.cliente
              const clienteNombre = cli
                ? cli.razonSocial || [cli.primerNombre, cli.segundoNombre, cli.apellidoPaterno, cli.apellidoMaterno].filter(Boolean).join(" ") || "Cliente general"
                : "Cliente general"
              return {
                idVenta: Number(item.venta!.idVenta),
                clienteNombre,
                rutCliente: cli?.rut,
                total: item.total ?? item.montoTotal ?? 0,
                estadoPago: item.estadoPago ?? "pendiente",
                fechaRegistro: item.fechaRegistro ?? item.fechaCreacion,
              }
            })
        : []
    } else {
      cachedOrdenes = []
      cachedVentas = []
    }
  } catch {
    cachedProducts = cachedProducts ?? []
    cachedServices = cachedServices ?? []
    cachedClientes = cachedClientes ?? []
    cachedOrdenes = cachedOrdenes ?? []
    cachedVentas = cachedVentas ?? []
  } finally {
    isFetching = false
    cacheTimestamp = Date.now()
  }

  return {
    products: cachedProducts ?? [],
    services: cachedServices ?? [],
    clientes: cachedClientes ?? [],
    ordenes: cachedOrdenes ?? [],
    ventas: cachedVentas ?? [],
  }
}

function filterResults(
  query: string,
  products: SearchProduct[],
  services: SearchService[],
  clientes: SearchCliente[],
  ordenes: SearchWorkOrder[],
  ventas: SearchSale[],
): SearchResults {
  const q = normalizeSearchText(query)
  const qClean = q.replace(/^#/, "").trim()

  const filteredProducts = products
    .filter((p) => includesNormalizedText(p.nombre, q) || String(p.idProducto) === qClean)
    .slice(0, 4)

  const filteredServices = services
    .filter((s) => includesNormalizedText(s.nombre, q) || includesNormalizedText(s.codigo, q))
    .slice(0, 3)

  const filteredClientes = clientes
    .filter((c) => {
      const rutClean = normalizeSearchText(c.rut).replace(/[\.\-]/g, "")
      const searchRutClean = q.replace(/[\.\-]/g, "")
      return (
        includesNormalizedText(c.nombreCompleto, q) ||
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
      const clientMatch = includesNormalizedText(o.clienteNombre, q)
      const bikeMatch = includesNormalizedText(o.bicicletaResumen, q)
      return idMatch || clientMatch || bikeMatch
    })
    .slice(0, 4)

  const filteredVentas = ventas
    .filter((v) => {
      const idMatch = String(v.idVenta) === qClean || String(v.idVenta).includes(qClean)
      const rutMatch = normalizeSearchText(v.rutCliente).replace(/[\.\-]/g, "").includes(q.replace(/[\.\-]/g, ""))
      return idMatch || includesNormalizedText(v.clienteNombre, q) || (q.length >= 3 && rutMatch)
    })
    .slice(0, 4)

  return {
    productos: filteredProducts,
    servicios: filteredServices,
    clientes: filteredClientes,
    ordenes: filteredOrdenes,
    ventas: filteredVentas,
  }
}

export function useTransversalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>({
    productos: [],
    servicios: [],
    clientes: [],
    ordenes: [],
    ventas: [],
  })
  const [status, setStatus] = useState<SearchStatus>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (rawQuery: string) => {
    const trimmed = rawQuery.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults({ productos: [], servicios: [], clientes: [], ordenes: [], ventas: [] })
      setStatus("idle")
      return
    }

    setStatus("loading")

    try {
      const { products, services, clientes, ordenes, ventas } = await fetchCatalog()
      const filtered = filterResults(trimmed, products, services, clientes, ordenes, ventas)
      setResults(filtered)
      setStatus("success")
    } catch {
      setResults({ productos: [], servicios: [], clientes: [], ordenes: [], ventas: [] })
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
    setResults({ productos: [], servicios: [], clientes: [], ordenes: [], ventas: [] })
    setStatus("idle")
  }, [])

  /** Invalida la caché de módulo */
  const invalidateCache = useCallback(() => {
    cachedProducts = null
    cachedServices = null
    cachedClientes = null
    cachedOrdenes = null
    cachedVentas = null
    cacheTimestamp = 0
  }, [])

  useEffect(() => {
    const handleInvalidate = () => invalidateCache()
    const events = ["transversal-search:invalidate", "clientes:refresh", "inventory:refresh", "work-orders:refresh", "sales:refresh", "focus"]
    events.forEach((event) => window.addEventListener(event, handleInvalidate))
    return () => {
      events.forEach((event) => window.removeEventListener(event, handleInvalidate))
    }
  }, [invalidateCache])

  const hasResults =
    results.productos.length > 0 ||
    results.servicios.length > 0 ||
    results.clientes.length > 0 ||
    results.ordenes.length > 0
    || results.ventas.length > 0

  const isOpen =
    query.trim().length > 0 &&
    (status === "idle" || status === "loading" || status === "success" || status === "error")

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