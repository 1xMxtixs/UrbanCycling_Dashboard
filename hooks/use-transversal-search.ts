"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { SearchProduct, SearchService, SearchResults, SearchStatus } from "@/types/search"

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

// Cache en módulo — persiste entre renders y navegaciones del mismo tab
let cachedProducts: SearchProduct[] | null = null
let cachedServices: SearchService[] | null = null
let isFetching = false

async function fetchCatalog(): Promise<{ products: SearchProduct[]; services: SearchService[] }> {
  if (cachedProducts && cachedServices) {
    return { products: cachedProducts, services: cachedServices }
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
    return { products: cachedProducts ?? [], services: cachedServices ?? [] }
  }

  isFetching = true
  try {
    const [inventoryRes, serviciosRes] = await Promise.all([
      fetch("/api/inventory", { cache: "no-store" }),
      fetch("/api/servicios", { cache: "no-store" }),
    ])

    cachedProducts = inventoryRes.ok ? ((await inventoryRes.json()) as SearchProduct[]) : []
    cachedServices = serviciosRes.ok ? ((await serviciosRes.json()) as SearchService[]) : []
  } finally {
    isFetching = false
  }

  return { products: cachedProducts ?? [], services: cachedServices ?? [] }
}

function filterResults(
  query: string,
  products: SearchProduct[],
  services: SearchService[],
): SearchResults {
  const q = query.trim().toLowerCase()

  const filteredProducts = products
    .filter((p) => p.nombre.toLowerCase().includes(q))
    .slice(0, 5)

  const filteredServices = services
    .filter((s) => s.nombre.toLowerCase().includes(q))
    .slice(0, 3)

  return { productos: filteredProducts, servicios: filteredServices }
}

export function useTransversalSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults>({ productos: [], servicios: [] })
  const [status, setStatus] = useState<SearchStatus>("idle")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (rawQuery: string) => {
    const trimmed = rawQuery.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults({ productos: [], servicios: [] })
      setStatus("idle")
      return
    }

    setStatus("loading")

    try {
      const { products, services } = await fetchCatalog()
      const filtered = filterResults(trimmed, products, services)
      setResults(filtered)
      setStatus("success")
    } catch {
      setResults({ productos: [], servicios: [] })
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
    setResults({ productos: [], servicios: [] })
    setStatus("idle")
  }, [])

  /** Invalida la caché de módulo (usar tras crear/editar productos en sesión) */
  const invalidateCache = useCallback(() => {
    cachedProducts = null
    cachedServices = null
  }, [])

  const hasResults =
    results.productos.length > 0 || results.servicios.length > 0

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
