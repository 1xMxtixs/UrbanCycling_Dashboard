"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, ClipboardList, Plus, RefreshCw, ShoppingCart } from "lucide-react"

import { useUserPermissions } from "@/components/providers"

import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { DataTableContainer } from "@/components/common/DataTableContainer"
import { EmptyState } from "@/components/common/EmptyState"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { StatusType } from "@/components/common/StatusBadge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import { cn } from "@/lib/utils"
import { formatCLP, formatDateCL } from "@/lib/formatters"
import { getNombreEstadoPago, getPaymentStatusBadgeVariant } from "@/lib/payment-status"
import { CreatePurchaseOrderForm } from "./CreatePurchaseOrderForm"
import { PurchaseOrderDetail } from "./PurchaseOrderDetail"
import type { PurchaseOrder } from "../types"

export type { PurchaseOrder }


/** Mapea los estados de compra a los tipos semánticos de StatusBadge */
function resolveOrderStatusType(value: string): StatusType {
  switch (value.toUpperCase()) {
    case "COMPLETADA":
    case "PAGADA":
    case "RECIBIDA":
      return "success"
    case "ENVIADA":
    case "PARCIAL":
      return "info"
    case "PENDIENTE":
    case "BORRADOR":
      return "warning"
    case "ANULADA":
      return "danger"
    default:
      return "neutral"
  }
}

/** Componente de píldora de estado — se mantiene exportado para PurchaseOrderDetail */
export function StatePill({ value }: { value: string }) {
  return (
    <StatusBadge
      status={resolveOrderStatusType(value)}
      label={value.charAt(0) + value.slice(1).toLowerCase()}
      showDot={false}
    />
  )
}

export function OrdenesCompra() {
  const { hasPermission } = useUserPermissions()
  const canCreate = hasPermission(PERMISSIONS.PURCHASE_ORDERS_CREATE)
  const canUpdate = hasPermission(PERMISSIONS.PURCHASE_ORDERS_UPDATE)
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<PurchaseOrder | null>(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/ordenes-compra?page=1&pageSize=100", { cache: "no-store" })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || "No fue posible cargar las órdenes de compra.")
      setOrders(result?.orders ?? [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible cargar las órdenes de compra.")
    } finally {
      setLoading(false)
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
        if (!response.ok) throw new Error(result?.message || "No fue posible cargar las órdenes de compra.")
        if (isMounted) setOrders(result?.orders ?? [])
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return
        if (isMounted) setError(cause instanceof Error ? cause.message : "No fue posible cargar las órdenes de compra.")
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

  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    if (!needle) return orders
    return orders.filter((order) =>
      `${order.idOrdenDeCompra} ${order.proveedor?.razonSocial ?? ""} ${order.estado} ${order.estadoPago}`
        .toLocaleLowerCase()
        .includes(needle)
    )
  }, [orders, search])

  const handleCreated = (order: PurchaseOrder) => {
    setOrders((current) => [order, ...current])
    setCreateOpen(false)
    setSelected(order)
  }

  const handleUpdated = (updated: PurchaseOrder) => {
    setOrders((current) =>
      current.map((order) =>
        order.idOrdenDeCompra === updated.idOrdenDeCompra ? { ...order, ...updated } : order
      )
    )
    setSelected((current) =>
      current?.idOrdenDeCompra === updated.idOrdenDeCompra ? { ...current, ...updated } : current
    )
    void loadOrders()
  }

  const drafts = orders.filter((order) => order.estado === "BORRADOR").length
  const outstanding = orders.filter((order) => order.estado === "ENVIADA" && order.estadoPago !== "PAGADA").length
  const complete = orders.filter((order) => order.estado === "COMPLETADA").length

  return (
    <div className="space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      <PageHeader
        title="Órdenes de compra"
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
          accentColor="amber"
        />
        <MetricCard
          title="Pago pendiente"
          value={outstanding}
          description="Órdenes enviadas con saldo"
          icon={AlertCircle}
          accentColor="cyan"
        />
        <MetricCard
          title="Completadas"
          value={complete}
          description="Recepción ingresada al inventario"
          icon={CheckCircle2}
          accentColor="emerald"
        />
      </div>

      <DataTableContainer
        title="Seguimiento de órdenes"
        description="Consulta el estado administrativo, de pago y recepción."
        searchPlaceholder="Buscar orden o proveedor"
        searchValue={search}
        onSearchChange={setSearch}
        actions={
          <Button
            variant="outline"
            size="icon"
            onClick={() => void loadOrders()}
            disabled={loading}
            aria-label="Actualizar órdenes"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin motion-reduce:animate-none")} />
          </Button>
        }
      >
        {error && (
          <div
            role="alert"
            className="m-5 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <Button size="sm" variant="outline" onClick={() => void loadOrders()}>
              Reintentar
            </Button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3 p-5 animate-pulse motion-reduce:animate-none" aria-busy="true">
            {[1, 2, 3].map((item) => (
              <Skeleton key={`skeleton-order-${item}`} className="h-14" />
            ))}
          </div>
        ) : !error && filteredOrders.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ClipboardList}
              title={search ? "No hay coincidencias" : "Aún no hay órdenes de compra"}
              description={
                search
                  ? "Prueba con otro ID o proveedor."
                  : "Crea una orden para iniciar el seguimiento de una compra."
              }
              action={
                !search && canCreate ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Crear primera orden
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : !error ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Emisión</TableHead>
                <TableHead>Entrega estimada</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow
                  key={order.idOrdenDeCompra}
                >
                  <TableCell className="font-semibold">OC-{order.idOrdenDeCompra}</TableCell>
                  <TableCell>
                    {order.proveedor?.razonSocial ?? "Proveedor"}
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {order._count?.lineas ?? 0} productos
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateCL(order.fechaRegistro)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateCL(order.fechaEntregaEstimada)}</TableCell>
                  <TableCell className="font-semibold">{formatCLP(Number(order.montoTotal))}</TableCell>
                  <TableCell>
                    <StatePill value={order.estado} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={getPaymentStatusBadgeVariant(order.estadoPago)}
                      label={getNombreEstadoPago(order.estadoPago)}
                      showDot={false}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelected(order)}>
                      Ver detalle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
