"use client"

import * as React from "react"
import {
  Search,
  Package,
  Wrench,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SearchResultItem } from "@/types/search"

export interface TransversalSearchProps {
  /**
   * Endpoint opcional para búsqueda unificada en backend si estuviese disponible.
   * Por defecto: "/api/busqueda-transversal" con fallback transparente a "/api/inventory" y "/api/servicios".
   */
  endpointUrl?: string
  /**
   * Filtro para restringir la búsqueda a sólo productos, sólo servicios o ambos (por defecto "all").
   */
  filterType?: "all" | "producto" | "servicio"
  /**
   * Callback invocado al seleccionar un producto o servicio de la lista de resultados.
   */
  onSelect: (item: SearchResultItem) => void
  /**
   * Placeholder del input.
   */
  placeholder?: string
  /**
   * Clase CSS adicional para el contenedor.
   */
  className?: string
  /**
   * Deshabilita la selección de productos con stock en 0 si está en true.
   * Por defecto false (permite seleccionarlo pero muestra advertencia destacada).
   */
  disableOutOfStock?: boolean
  /**
   * Texto de label accesible asociado al input.
   */
  label?: string
}

export function TransversalSearch({
  endpointUrl = "/api/busqueda-transversal",
  filterType = "all",
  onSelect,
  placeholder = "Buscar producto o servicio...",
  className,
  disableOutOfStock = false,
  label,
}: TransversalSearchProps) {
  const [query, setQuery] = React.useState("")
  const [debouncedQuery, setDebouncedQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResultItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeIndex, setActiveIndex] = React.useState<number>(-1)

  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  // Debounce de 300ms para no saturar peticiones
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Ejecución de la búsqueda
  React.useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      setIsOpen(false)
      setActiveIndex(-1)
      return
    }

    let isMounted = true
    setIsLoading(true)

    async function executeSearch() {
      try {
        // Intentar primero consumir el endpoint transversal
        const params = new URLSearchParams({
          q: debouncedQuery,
          tipo: filterType,
        })
        const res = await fetch(`${endpointUrl}?${params.toString()}`)

        if (res.ok) {
          const data: SearchResultItem[] = await res.json()
          if (isMounted) {
            setResults(Array.isArray(data) ? data : [])
            setIsOpen(true)
            setActiveIndex(-1)
          }
          return
        }

        // Fallback: consulta unificada a endpoints locales
        const searchNormalized = debouncedQuery.toLowerCase()
        const fetchedItems: SearchResultItem[] = []

        if (filterType === "all" || filterType === "producto") {
          try {
            const invRes = await fetch("/api/inventory")
            if (invRes.ok) {
              const invData = await invRes.json()
              const mappedProds: SearchResultItem[] = invData
                .filter(
                  (p: any) =>
                    p.estado === "activo" &&
                    (p.nombre?.toLowerCase().includes(searchNormalized) ||
                      p.descripcion?.toLowerCase().includes(searchNormalized))
                )
                .map((p: any) => ({
                  id: p.idProducto,
                  tipo: "producto" as const,
                  nombre: p.nombre,
                  descripcion: p.descripcion,
                  precioVenta: Number(p.precioVenta || 0),
                  stockActual: Number(p.stockActual ?? 0),
                  stockMinimo: Number(p.stockMinimo ?? 0),
                  estado: p.estado,
                  urlImagen: p.urlImagen || null,
                }))
              fetchedItems.push(...mappedProds)
            }
          } catch (e) {
            console.warn("Fallback inventory search error:", e)
          }
        }

        if (filterType === "all" || filterType === "servicio") {
          try {
            const servRes = await fetch("/api/servicios")
            if (servRes.ok) {
              const servData = await servRes.json()
              const mappedServs: SearchResultItem[] = servData
                .filter(
                  (s: any) =>
                    s.estado === "activo" &&
                    (s.nombre?.toLowerCase().includes(searchNormalized) ||
                      s.codigo?.toLowerCase().includes(searchNormalized) ||
                      s.descripcion?.toLowerCase().includes(searchNormalized))
                )
                .map((s: any) => ({
                  id: s.idServicio,
                  tipo: "servicio" as const,
                  nombre: s.nombre,
                  codigo: s.codigo,
                  descripcion: s.descripcion,
                  precioVenta: Number(s.precioVenta || 0),
                  stockActual: null,
                  estado: s.estado,
                }))
              fetchedItems.push(...mappedServs)
            }
          } catch (e) {
            // Si /api/servicios no está montado aún, no romper el flujo
          }
        }

        if (isMounted) {
          setResults(fetchedItems)
          setIsOpen(true)
          setActiveIndex(-1)
        }
      } catch (err) {
        console.error("Transversal search failed:", err)
        if (isMounted) {
          setResults([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    executeSearch()

    return () => {
      isMounted = false
    }
  }, [debouncedQuery, endpointUrl, filterType])

  // Cierre al hacer click fuera
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Auto-scroll del elemento activo en la lista desplegable
  React.useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[activeIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" })
      }
    }
  }, [activeIndex])

  // Manejo de teclado (flechas arriba/abajo, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "ArrowDown" && results.length > 0) {
        setIsOpen(true)
        setActiveIndex(0)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < results.length) {
          handleItemSelection(results[activeIndex])
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        setActiveIndex(-1)
        break
      case "Tab":
        setIsOpen(false)
        break
    }
  }

  const handleItemSelection = (item: SearchResultItem) => {
    const isOutOfStock =
      item.tipo === "producto" && (item.stockActual ?? 0) <= 0

    if (disableOutOfStock && isOutOfStock) {
      return
    }

    onSelect(item)
    setQuery("")
    setDebouncedQuery("")
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const handleClear = () => {
    setQuery("")
    setDebouncedQuery("")
    setResults([])
    setIsOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-lg", className)}
    >
      {label && (
        <label
          htmlFor="transversal-search-input"
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block"
        >
          {label}
        </label>
      )}

      {/* Barra de entrada accesible */}
      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center pointer-events-none text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <Input
          id="transversal-search-input"
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (!isOpen && e.target.value.trim().length > 0) {
              setIsOpen(true)
            }
          }}
          onFocus={() => {
            if (results.length > 0 && query.trim().length > 0) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label || placeholder}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="transversal-search-results"
          aria-activedescendant={
            activeIndex >= 0 ? `search-item-${activeIndex}` : undefined
          }
          role="combobox"
          className="pl-9 pr-8 h-10 text-xs sm:text-sm bg-background border-border rounded-xl focus-visible:ring-primary/25 transition-shadow"
        />

        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1.5 h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer rounded-full"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Resultados desplegables */}
      {isOpen && (
        <div
          id="transversal-search-results"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-popover text-popover-foreground border border-border rounded-xl shadow-xl overflow-hidden backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {results.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Buscando coincidencias...</span>
                </div>
              ) : (
                <p>No se encontraron productos ni servicios con "{debouncedQuery}".</p>
              )}
            </div>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-64 overflow-y-auto py-1 divide-y divide-border/40 focus:outline-none"
            >
              {results.map((item, idx) => {
                const isSelected = activeIndex === idx
                const isProduct = item.tipo === "producto"
                const stock = item.stockActual ?? 0
                const isOutOfStock = isProduct && stock <= 0
                const isLowStock = isProduct && stock > 0 && stock <= (item.stockMinimo ?? 2)

                return (
                  <li
                    key={`${item.tipo}-${item.id}`}
                    id={`search-item-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleItemSelection(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs cursor-pointer transition-colors select-none",
                      isSelected
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted/50",
                      disableOutOfStock && isOutOfStock
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                    )}
                  >
                    {/* Icono + Nombre + Tipo */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                          isProduct
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        )}
                      >
                        {isProduct ? (
                          <Package className="h-4 w-4 stroke-[1.8]" />
                        ) : (
                          <Wrench className="h-4 w-4 stroke-[1.8]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">
                            {item.nombre}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 rounded-md border",
                              isProduct
                                ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25"
                                : "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25"
                            )}
                          >
                            {isProduct ? "Producto" : "Servicio"}
                          </Badge>
                        </div>

                        {item.descripcion && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">
                            {item.descripcion}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stock y Precio */}
                    <div className="flex items-center gap-3 shrink-0 text-right">
                      {isProduct ? (
                        <div className="flex flex-col items-end">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded">
                              <AlertTriangle className="h-3 w-3" />
                              Sin stock (0)
                            </span>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-[11px] font-medium",
                                isLowStock
                                  ? "text-amber-600 dark:text-amber-400 font-bold"
                                  : "text-muted-foreground"
                              )}
                            >
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              Stock: {stock}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          Taller
                        </span>
                      )}

                      <span className="font-bold text-foreground text-xs sm:text-sm">
                        ${Number(item.precioVenta).toLocaleString("es-CL")}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="px-3 py-1.5 bg-muted/40 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between items-center">
            <span>Usa ↑↓ para navegar, Enter para seleccionar</span>
            <span>Esc para cerrar</span>
          </div>
        </div>
      )}
    </div>
  )
}
