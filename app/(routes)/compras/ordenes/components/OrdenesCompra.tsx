"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ColumnDef, ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table"
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { AlertCircle, CheckCircle2, ClipboardList, Copy, Download, Eye, Plus, Search, ShoppingCart } from "lucide-react"
import { toast } from "sonner"

import { useUserPermissions } from "@/components/providers"
import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { DataTableContainer } from "@/components/common/DataTableContainer"
import { EmptyState } from "@/components/common/EmptyState"
import { StatusBadge } from "@/components/common/StatusBadge"
import { SortableHeader } from "@/components/common/SortableHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RowActionsMenu } from "@/components/common/RowActionsMenu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FormDialog } from "@/components/forms/FormDialog"
import { PERMISSIONS } from "@/lib/permissions"
import { includesNormalizedText } from "@/lib/search-normalization"
import { formatCLP } from "@/lib/formatters"
import { buildPurchaseOrderText } from "@/lib/purchase-order-text"
import { CreatePurchaseOrderForm } from "./CreatePurchaseOrderForm"
import { PurchaseOrderDetail } from "./PurchaseOrderDetail"
import type { PurchaseOrder } from "../types"
import {
  ESTADO_COMPRA,
  ESTADO_PAGO_COMPRA,
  ESTADOS_COMPRA,
  ESTADOS_PAGO_COMPRA,
  getEstadoCompraBadge,
  getPagoCompraBadge,
} from "../purchase-status"

export type { PurchaseOrder }

function formatPurchaseDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** Píldora compartida por el listado y el detalle de la orden. */
export function StatePill({ value }: { value: string }) {
  const badge = getEstadoCompraBadge(value)
  return <StatusBadge status={badge.status} label={badge.label} showDot={false} />
}

export function OrdenesCompra() {
  const { hasPermission } = useUserPermissions()
  const canCreate = hasPermission(PERMISSIONS.PURCHASE_ORDERS_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.PURCHASE_ORDERS_UPDATE)
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([
    { id: "fechaRegistro", desc: true },
  ])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<PurchaseOrder | null>(null)

  const copyOrderToClipboard = async (order: PurchaseOrder) => {
    try {
      const response = await fetch(`/api/ordenes-compra/${order.idOrdenDeCompra}`, { cache: "no-store" })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.purchaseOrder) {
        throw new Error(result?.message || "No fue posible cargar la orden de compra.")
      }
      if (!navigator.clipboard?.writeText) throw new Error("Portapapeles no disponible")
      await navigator.clipboard.writeText(buildPurchaseOrderText(result.purchaseOrder))
      toast.success("Orden copiada al portapapeles.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo copiar la orden.")
    }
  }

  const downloadOrderPdf = async (order: PurchaseOrder) => {
    let downloadUrl: string | undefined
    let link: HTMLAnchorElement | undefined
    try {
      const response = await fetch(`/api/ordenes-compra/${order.idOrdenDeCompra}/pdf`, {
        headers: { Accept: "application/pdf" },
        credentials: "same-origin",
        cache: "no-store",
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.message || "No fue posible descargar el PDF.")
      }
      if (!response.headers.get("Content-Type")?.toLowerCase().includes("application/pdf")) {
        throw new Error("El servidor no devolvió un PDF válido.")
      }
      const blob = await response.blob()
      if (!blob.size) throw new Error("El PDF está vacío.")
      downloadUrl = URL.createObjectURL(blob)
      link = document.createElement("a")
      link.href = downloadUrl
      link.download = `orden-compra-${order.idOrdenDeCompra}.pdf`
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      toast.success("Descarga del PDF iniciada.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible descargar el PDF.")
    } finally {
      link?.remove()
      if (downloadUrl) window.setTimeout(() => URL.revokeObjectURL(downloadUrl!), 1000)
    }
  }

  const loadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/ordenes-compra?page=1&pageSize=100", {
        cache: "no-store",
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.message || "No fue posible cargar las órdenes de compra.")
      }
      setOrders(Array.isArray(result?.orders) ? result.orders : [])
      setError("")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No fue posible cargar las órdenes de compra."
      )
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function init() {
      try {
        const response = await fetch("/api/ordenes-compra?page=1&pageSize=100", {
          cache: "no-store",
          signal: controller.signal,
        })
        const result = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(result?.message || "No fue posible cargar las órdenes de compra.")
        }
        if (isMounted) {
          setOrders(Array.isArray(result?.orders) ? result.orders : [])
          setError("")
        }
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return
        if (isMounted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "No fue posible cargar las órdenes de compra."
          )
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void init()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  const columns = useMemo<ColumnDef<PurchaseOrder>[]>(
    () => [
      {
        id: "orden",
        accessorFn: (order) => order.idOrdenDeCompra,
      },
      {
        id: "proveedor",
        accessorFn: (order) => order.proveedor?.razonSocial ?? "",
      },
      {
        id: "fechaRegistro",
        accessorFn: (order) => order.fechaRegistro,
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.original.fechaRegistro).getTime()
          const dateB = new Date(rowB.original.fechaRegistro).getTime()
          const dateDifference =
            (Number.isNaN(dateA) ? 0 : dateA) - (Number.isNaN(dateB) ? 0 : dateB)

          // The default descending sort also puts the higher order ID first on ties.
          return dateDifference || rowA.original.idOrdenDeCompra - rowB.original.idOrdenDeCompra
        },
      },
      {
        id: "total",
        accessorFn: (order) => Number(order.montoTotal),
        sortingFn: (rowA, rowB, columnId) =>
          Number(rowA.getValue(columnId)) - Number(rowB.getValue(columnId)),
      },
      { accessorKey: "estado" },
      { accessorKey: "estadoPago" },
    ],
    []
  )

  const table = useReactTable({
    data: orders,
    columns,
    state: { globalFilter: search, columnFilters, sorting, pagination },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const order = row.original
      const productNames = order.lineas?.map((line) => line.producto?.nombre ?? "") ?? []
      const searchableValues = [
        `OC-${order.idOrdenDeCompra}`,
        String(order.idOrdenDeCompra),
        order.proveedor?.razonSocial ?? "",
        ...productNames,
      ]

      return searchableValues.some((value) =>
        includesNormalizedText(value, String(filterValue ?? "").trim())
      )
    },
  })

  const updateFilter = (id: string, value: string) => {
    setColumnFilters((current) => {
      const next = current.filter((filter) => filter.id !== id)
      if (value !== "all") next.push({ id, value })
      return next
    })
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
  }

  const handleCreated = (order: PurchaseOrder) => {
    setOrders((current) => [order, ...current])
    setCreateOpen(false)
    setSelected(order)
  }

  const handleUpdated = useCallback((updated: PurchaseOrder) => {
    setOrders((current) =>
      current.map((order) =>
        order.idOrdenDeCompra === updated.idOrdenDeCompra ? { ...order, ...updated } : order
      )
    )
    setSelected((current) =>
      current?.idOrdenDeCompra === updated.idOrdenDeCompra ? { ...current, ...updated } : current
    )
    void loadOrders()
  }, [loadOrders])

  const drafts = orders.filter((order) => order.estado === ESTADO_COMPRA.BORRADOR).length
  const outstanding = orders.filter(
    (order) => order.estado === ESTADO_COMPRA.ENVIADA && order.estadoPago !== ESTADO_PAGO_COMPRA.PAGADA
  ).length
  const complete = orders.filter((order) => order.estado === ESTADO_COMPRA.COMPLETADA).length
  const filteredOrderCount = table.getFilteredRowModel().rows.length
  const statusFilter = (table.getColumn("estado")?.getFilterValue() as string | undefined) ?? "all"
  const paymentFilter = (table.getColumn("estadoPago")?.getFilterValue() as string | undefined) ?? "all"
  const filtersActive = Boolean(search.trim()) || statusFilter !== "all" || paymentFilter !== "all"
  const pageCount = table.getPageCount() || 1

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={`purchase-kpi-${index}`} className="h-24 rounded-xl motion-reduce:animate-none" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl motion-reduce:animate-none" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 motion-reduce:animate-none">
      <PageHeader
        title="Órdenes de Compra"
        description="Crea órdenes para tus proveedores y sigue su envío, pagos y recepción en inventario."
      >
        {canCreate && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva orden
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Órdenes registradas"
          value={orders.length}
          description="En todos los estados"
          icon={ClipboardList}
        />
        <MetricCard
          title="Borradores"
          value={drafts}
          description="Pendientes de enviar al proveedor"
          icon={ShoppingCart}
        />
        <MetricCard
          title="Pago pendiente"
          value={outstanding}
          description="Órdenes enviadas con saldo"
          icon={AlertCircle}
        />
        <MetricCard
          title="Completadas"
          value={complete}
          description="Recepción ingresada al inventario"
          icon={CheckCircle2}
        />
      </div>

      <DataTableContainer
        title="Seguimiento de órdenes"
        description={`${filteredOrderCount} ${filteredOrderCount === 1 ? "orden encontrada" : "órdenes encontradas"}`}
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label="Buscar órdenes por código, proveedor o producto"
                placeholder="Buscar por orden, proveedor o producto…"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="h-10 w-full rounded-xl border-border/80 bg-background pl-10 text-sm shadow-2xs focus-visible:ring-primary/30"
              />
            </div>

            <div className="w-full shrink-0 sm:w-56">
            <Select value={statusFilter} onValueChange={(value) => updateFilter("estado", value)}>
              <SelectTrigger className="h-10 data-[size=default]:h-10 w-full rounded-xl border-border/80 bg-background text-sm shadow-2xs sm:w-56" aria-label="Filtrar por estado de orden">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Todos los estados</SelectItem>
                {ESTADOS_COMPRA.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>

            <div className="w-full shrink-0 sm:w-56">
            <Select value={paymentFilter} onValueChange={(value) => updateFilter("estadoPago", value)}>
              <SelectTrigger className="h-10 data-[size=default]:h-10 w-full rounded-xl border-border/80 bg-background text-sm shadow-2xs sm:w-56" aria-label="Filtrar por estado de pago">
                <SelectValue placeholder="Todos los pagos" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Todos los pagos</SelectItem>
                {ESTADOS_PAGO_COMPRA.map((status) => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>
        }
        footer={
          filteredOrderCount > 0 ? (
            <>
              <div>Página {pagination.pageIndex + 1} de {pageCount}</div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 px-2"
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 px-2"
                >
                  Siguiente
                </Button>
              </div>
            </>
          ) : undefined
        }
      >
        {error && (
          <div role="alert" className="m-5 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button size="sm" variant="outline" onClick={() => void loadOrders()}>
              Reintentar
            </Button>
          </div>
        )}

        {!error && filteredOrderCount === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ClipboardList}
              title={filtersActive ? "No se encontraron órdenes" : "Aún no hay órdenes de compra"}
              description={
                filtersActive
                  ? "No hay órdenes que coincidan con los filtros."
                  : "Crea tu primera orden de compra para comenzar."
              }
              action={
                !filtersActive && canCreate ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Crear primera orden
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : !error ? (
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>
                  <SortableHeader column={table.getColumn("fechaRegistro")!}>Emisión</SortableHeader>
                </TableHead>
                <TableHead>Entrega estimada</TableHead>
                <TableHead>
                  <SortableHeader column={table.getColumn("total")!}>Total</SortableHeader>
                </TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map(({ original: order }) => {
                const lineCount = order._count?.lineas ?? 0
                const orderStatus = getEstadoCompraBadge(order.estado)
                const paymentStatus = getPagoCompraBadge(order.estado, order.estadoPago)
                const emittedDate = formatPurchaseDate(order.fechaRegistro)
                const deliveryDate = formatPurchaseDate(order.fechaEntregaEstimada)

                return (
                  <TableRow
                    key={order.idOrdenDeCompra}
                    className="cursor-pointer"
                    tabIndex={0}
                    aria-label={`Ver detalle de orden OC-${order.idOrdenDeCompra}`}
                    onClick={() => setSelected(order)}
                    onKeyDown={(event) => {
                      if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                        event.preventDefault()
                        setSelected(order)
                      }
                    }}
                  >
                    <TableCell>
                      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
                        OC-{order.idOrdenDeCompra}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-foreground">
                        {order.proveedor?.razonSocial ?? "Proveedor"}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {lineCount} {lineCount === 1 ? "producto" : "productos"}
                      </span>
                    </TableCell>
                    <TableCell className={emittedDate === "—" ? "text-muted-foreground/60" : "text-muted-foreground"}>
                      {emittedDate}
                    </TableCell>
                    <TableCell className={deliveryDate === "—" ? "text-muted-foreground/60" : "text-muted-foreground"}>
                      {deliveryDate}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {formatCLP(Number(order.montoTotal))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={orderStatus.status} label={orderStatus.label} showDot={false} />
                    </TableCell>
                    <TableCell>
                      {paymentStatus.label === "—" ? (
                        <span className="text-muted-foreground/60">—</span>
                      ) : (
                        <StatusBadge status={paymentStatus.status} label={paymentStatus.label} showDot={false} />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex justify-end"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <RowActionsMenu
                          ariaLabel={`Acciones de orden OC-${order.idOrdenDeCompra}`}
                          groups={[
                            {
                              actions: [
                                {
                                  label: "Ver detalle",
                                  icon: Eye,
                                  onSelect: () => setSelected(order),
                                },
                                {
                                  label: "Descargar PDF",
                                  icon: Download,
                                  onSelect: () => void downloadOrderPdf(order),
                                },
                                {
                                  label: "Copiar al portapapeles",
                                  icon: Copy,
                                  onSelect: () => void copyOrderToClipboard(order),
                                },
                              ],
                            },
                          ]}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        ) : null}
      </DataTableContainer>

      <FormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nueva orden de compra"
        description="Selecciona un proveedor activo, agrega productos y define las fechas de la orden."
        size="3xl"
      >
        <CreatePurchaseOrderForm
          onCreated={handleCreated}
          onCancel={() => setCreateOpen(false)}
        />
      </FormDialog>

      <PurchaseOrderDetail
        orderSummary={selected}
        canUpdate={canUpdate}
        onOpenChange={(open) => { if (!open) setSelected(null) }}
        onUpdated={handleUpdated}
      />
    </div>
  )
}
