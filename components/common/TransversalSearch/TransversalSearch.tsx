"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Package,
  Wrench,
  Search,
  ArrowRight,
  AlertCircle,
  User,
  Building2,
  ClipboardList,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type {
  SearchProduct,
  SearchService,
  SearchCliente,
  SearchWorkOrder,
  SearchStatus,
  SearchResults,
} from "@/types/search"

interface TransversalSearchDropdownProps {
  query: string
  results: SearchResults
  status: SearchStatus
  hasResults: boolean
  onClose: () => void
}

function formatCLP(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "$0"
  return `$${num.toLocaleString("es-CL")}`
}

function getStockLabel(product: SearchProduct): {
  label: string
  className: string
} {
  if (product.stockActual === 0) {
    return {
      label: "Sin stock",
      className:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    }
  }
  if (product.stockActual <= product.stockMinimo) {
    return {
      label: `Stock: ${product.stockActual}u`,
      className:
        "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    }
  }
  return {
    label: `Stock: ${product.stockActual}u`,
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  }
}

function getOrderStatusBadge(status: string): {
  label: string
  className: string
} {
  const s = status.toLowerCase()
  if (s === "entregado" || s === "completado" || s === "finalizado") {
    return {
      label: "Entregado",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    }
  }
  if (s === "cancelado" || s === "anulado") {
    return {
      label: "Cancelado",
      className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    }
  }
  if (s === "en_proceso" || s === "en taller") {
    return {
      label: "En Taller",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    }
  }
  return {
    label: status.replace(/_/g, " "),
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  }
}

function ProductItem({
  product,
  onClick,
}: {
  product: SearchProduct
  onClick: () => void
}) {
  const imgUrl = product.imagenesProducto?.[0]?.url ?? product.urlImagen
  const stock = getStockLabel(product)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
    >
      {/* Thumbnail */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 overflow-hidden">
        {imgUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl}
            alt={product.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="h-4 w-4 text-muted-foreground/60" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {product.nombre}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {product.tipoProducto} · {formatCLP(product.precioVenta)}
        </p>
      </div>

      {/* Stock badge */}
      <span
        className={cn(
          "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none",
          stock.className,
        )}
      >
        {stock.label}
      </span>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  )
}

function ServiceItem({
  service,
  onClick,
}: {
  service: SearchService
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
    >
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
        <Wrench className="h-4 w-4 text-primary" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {service.nombre}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {service.codigo} · {formatCLP(service.precioVenta)}
        </p>
      </div>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  )
}

function ClientItem({
  cliente,
  onClick,
}: {
  cliente: SearchCliente
  onClick: () => void
}) {
  const isJuridica = ["juridica", "juridico"].includes(
    cliente.tipoCliente.trim().toLocaleLowerCase("es-CL"),
  )

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
    >
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-500/20 bg-sky-500/10">
        {isJuridica ? (
          <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        ) : (
          <User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {cliente.nombreCompleto}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {cliente.rut} {cliente.telefono ? `· ${cliente.telefono}` : ""}
        </p>
      </div>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  )
}

function WorkOrderItem({
  orden,
  onClick,
}: {
  orden: SearchWorkOrder
  onClick: () => void
}) {
  const badge = getOrderStatusBadge(orden.estadoOrden)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
    >
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
        <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-xs text-foreground">
            OT #{orden.idOrdenDeTrabajo}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            · {orden.clienteNombre}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {orden.bicicletaResumen ? `${orden.bicicletaResumen} · ` : ""}
          {formatCLP(orden.total)}
        </p>
      </div>

      {/* Badge Estado */}
      <span
        className={cn(
          "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold leading-none capitalize",
          badge.className,
        )}
      >
        {badge.label}
      </span>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
      {children}
    </p>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-3/4 rounded" />
            <Skeleton className="h-2.5 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TransversalSearchDropdown({
  query,
  results,
  status,
  hasResults,
  onClose,
}: TransversalSearchDropdownProps) {
  const router = useRouter()

  const handleProductClick = useCallback(
    (product: SearchProduct) => {
      onClose()
      router.push(`/inventory?productId=${product.idProducto}`)
    },
    [router, onClose],
  )

  const handleServiceClick = useCallback(
    (service: SearchService) => {
      onClose()
      router.push(`/inventory?search=${encodeURIComponent(service.nombre)}`)
    },
    [router, onClose],
  )

  const handleClienteClick = useCallback(
    (cliente: SearchCliente) => {
      onClose()
      router.push(`/clientes?clienteId=${cliente.idCliente}`)
    },
    [router, onClose],
  )

  const handleWorkOrderClick = useCallback(
    (orden: SearchWorkOrder) => {
      onClose()
      router.push(`/punto-ventas?tab=ordenes&ordenId=${orden.idOrdenDeTrabajo}`)
    },
    [router, onClose],
  )

  const handleViewAllProducts = useCallback(() => {
    onClose()
    router.push(`/inventory?search=${encodeURIComponent(query.trim())}`)
  }, [router, onClose, query])

  const handleViewAllServices = useCallback(() => {
    onClose()
    router.push(`/inventory?search=${encodeURIComponent(query.trim())}`)
  }, [router, onClose, query])

  const handleViewAllClientes = useCallback(() => {
    onClose()
    router.push(`/clientes?search=${encodeURIComponent(query.trim())}`)
  }, [router, onClose, query])

  const handleViewAllWorkOrders = useCallback(() => {
    onClose()
    router.push(`/punto-ventas?tab=ordenes&search=${encodeURIComponent(query.trim())}`)
  }, [router, onClose, query])

  return (
    <div
      role="listbox"
      aria-label="Resultados de búsqueda"
      className={cn(
        "absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[480px] overflow-y-auto rounded-xl bg-card border border-border/80 shadow-2xl",
        "animate-in fade-in zoom-in-95 duration-300",
      )}
    >
      {/* Loading */}
      {status === "loading" && <LoadingSkeleton />}

      {/* Error */}
      {status === "error" && (
        <div className="flex items-center gap-2 px-4 py-5 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-destructive" />
          Error al cargar resultados. Inténtalo de nuevo.
        </div>
      )}

      {/* Sin resultados */}
      {status === "success" && !hasResults && (
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/60">
            <Search className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Sin resultados para &ldquo;{query}&rdquo;
          </p>
          <p className="text-xs text-muted-foreground">
            No se encontraron clientes, productos ni órdenes con ese término.
          </p>
        </div>
      )}

      {/* Resultados */}
      {status === "success" && hasResults && (
        <div className="py-1.5 divide-y divide-border/40">
          {/* Clientes */}
          {results.clientes?.length > 0 && (
            <div className="pb-1">
              <SectionLabel>Clientes</SectionLabel>
              <div className="space-y-0.5 px-1">
                {results.clientes.map((cliente) => (
                  <ClientItem
                    key={cliente.idCliente}
                    cliente={cliente}
                    onClick={() => handleClienteClick(cliente)}
                  />
                ))}
              </div>
              <ViewAllButton label="Ver todos los resultados en Clientes" onClick={handleViewAllClientes} />
            </div>
          )}

          {/* Órdenes de Trabajo */}
          {results.ordenes?.length > 0 && (
            <div className="pb-1 pt-1">
              <SectionLabel>Órdenes de Trabajo</SectionLabel>
              <div className="space-y-0.5 px-1">
                {results.ordenes.map((orden) => (
                  <WorkOrderItem
                    key={orden.idOrdenDeTrabajo}
                    orden={orden}
                    onClick={() => handleWorkOrderClick(orden)}
                  />
                ))}
              </div>
              <ViewAllButton label="Ver todos los resultados en Órdenes de Trabajo" onClick={handleViewAllWorkOrders} />
            </div>
          )}

          {/* Productos */}
          {results.productos.length > 0 && (
            <div className="pb-1 pt-1">
              <SectionLabel>Productos</SectionLabel>
              <div className="space-y-0.5 px-1">
                {results.productos.map((product) => (
                  <ProductItem
                    key={product.idProducto}
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
              <ViewAllButton label="Ver todos los resultados en Inventario" onClick={handleViewAllProducts} />
            </div>
          )}

          {/* Servicios */}
          {results.servicios.length > 0 && (
            <div className="pb-1 pt-1">
              <SectionLabel>Servicios</SectionLabel>
              <div className="space-y-0.5 px-1">
                {results.servicios.map((service) => (
                  <ServiceItem
                    key={service.idServicio}
                    service={service}
                    onClick={() => handleServiceClick(service)}
                  />
                ))}
              </div>
              <ViewAllButton label="Ver todos los resultados en Inventario" onClick={handleViewAllServices} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ViewAllButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="px-2 pt-1.5">
      <button
        type="button"
        onClick={onClick}
        className="group flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-medium text-primary transition-colors duration-200 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span>{label}</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>
    </div>
  )
}

