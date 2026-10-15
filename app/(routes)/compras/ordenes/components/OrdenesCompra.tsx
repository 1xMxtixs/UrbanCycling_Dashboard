"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { AlertCircle, CheckCircle2, ClipboardList, Plus, RefreshCw, Search, ShoppingCart } from "lucide-react"

import { PageHeader } from "@/components/common/PageHeader"
import { MetricCard } from "@/components/common/MetricCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PERMISSIONS } from "@/lib/permissions"
import { CreatePurchaseOrderForm } from "./CreatePurchaseOrderForm"
import { PurchaseOrderDetail } from "./PurchaseOrderDetail"

export type PurchaseOrder = {
  idOrdenDeCompra: number
  fechaRegistro: string
  fechaEntregaEstimada: string
  fechaEntregaReal?: string | null
  estado: string
  estadoPago: string
  estadoRecepcion: string
  montoTotal: number | string
  proveedor: { idProveedor: number; razonSocial: string }
  _count?: { lineas: number }
}

const currency = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
const date = (value: string) => new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value))

function StatePill({ value }: { value: string }) {
  const styles: Record<string, string> = {
    BORRADOR: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    ENVIADA: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    COMPLETADA: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    ANULADA: "bg-red-500/10 text-red-700 dark:text-red-300",
    PENDIENTE: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    PARCIAL: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    PAGADA: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    RECIBIDA: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[value] ?? "bg-muted text-muted-foreground"}`}>{value.charAt(0) + value.slice(1).toLowerCase()}</span>
}

export { StatePill, currency, date }

export function OrdenesCompra() {
  const { data: session } = useSession()
  const permissions = session?.user?.permisos ?? []
  const canCreate = permissions.includes(PERMISSIONS.PURCHASE_ORDERS_CREATE)
  const canUpdate = permissions.includes(PERMISSIONS.PURCHASE_ORDERS_UPDATE)
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
    const timer = window.setTimeout(() => void loadOrders(), 0)
    return () => window.clearTimeout(timer)
  }, [loadOrders])

  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    if (!needle) return orders
    return orders.filter((order) => `${order.idOrdenDeCompra} ${order.proveedor?.razonSocial ?? ""} ${order.estado} ${order.estadoPago}`.toLocaleLowerCase().includes(needle))
  }, [orders, search])

  const handleCreated = (order: PurchaseOrder) => {
    setOrders((current) => [order, ...current])
    setCreateOpen(false)
    setSelected(order)
  }

  const handleUpdated = (updated: PurchaseOrder) => {
    setOrders((current) => current.map((order) => order.idOrdenDeCompra === updated.idOrdenDeCompra ? { ...order, ...updated } : order))
    setSelected((current) => current?.idOrdenDeCompra === updated.idOrdenDeCompra ? { ...current, ...updated } : current)
    void loadOrders()
  }

  const drafts = orders.filter((order) => order.estado === "BORRADOR").length
  const outstanding = orders.filter((order) => order.estado === "ENVIADA" && order.estadoPago !== "PAGADA").length
  const complete = orders.filter((order) => order.estado === "COMPLETADA").length

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Órdenes de compra" description="Crea órdenes para tus proveedores y sigue su envío, pagos y recepción en inventario.">
        {canCreate && <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Nueva orden</Button>}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Órdenes registradas" value={orders.length} description="En todos los estados" icon={ClipboardList} />
        <MetricCard title="Borradores" value={drafts} description="Pendientes de enviar al proveedor" icon={ShoppingCart} accentColor="amber" />
        <MetricCard title="Pago pendiente" value={outstanding} description="Órdenes enviadas con saldo" icon={AlertCircle} accentColor="cyan" />
        <MetricCard title="Completadas" value={complete} description="Recepción ingresada al inventario" icon={CheckCircle2} accentColor="emerald" />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-semibold">Seguimiento de órdenes</h2><p className="mt-1 text-sm text-muted-foreground">Consulta el estado administrativo, de pago y recepción.</p></div>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar orden o proveedor" aria-label="Buscar órdenes" className="pl-9" /></div>
            <Button variant="outline" size="icon" onClick={() => void loadOrders()} aria-label="Actualizar órdenes"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>

        {error && <div role="alert" className="m-5 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" /><span className="flex-1">{error}</span><Button size="sm" variant="outline" onClick={() => void loadOrders()}>Reintentar</Button></div>}
        {loading ? <div className="space-y-3 p-5" aria-busy="true">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-14" />)}</div> : !error && filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center"><ClipboardList className="mb-3 h-9 w-9 text-muted-foreground/60" /><p className="font-semibold">{search ? "No hay coincidencias" : "Aún no hay órdenes de compra"}</p><p className="mt-1 text-sm text-muted-foreground">{search ? "Prueba con otro ID o proveedor." : "Crea una orden para iniciar el seguimiento de una compra."}</p>{!search && canCreate && <Button className="mt-4" onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />Crear primera orden</Button>}</div>
        ) : !error && (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3">Orden</th><th className="px-5 py-3">Proveedor</th><th className="px-5 py-3">Emisión</th><th className="px-5 py-3">Entrega estimada</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Pago</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-border/60">{filteredOrders.map((order) => <tr key={order.idOrdenDeCompra} className="transition-colors hover:bg-muted/30"><td className="px-5 py-4 font-semibold">OC-{order.idOrdenDeCompra}</td><td className="px-5 py-4">{order.proveedor?.razonSocial ?? "Proveedor"}<span className="mt-0.5 block text-xs text-muted-foreground">{order._count?.lineas ?? 0} productos</span></td><td className="px-5 py-4 text-muted-foreground">{date(order.fechaRegistro)}</td><td className="px-5 py-4 text-muted-foreground">{date(order.fechaEntregaEstimada)}</td><td className="px-5 py-4 font-semibold">{currency.format(Number(order.montoTotal))}</td><td className="px-5 py-4"><StatePill value={order.estado} /></td><td className="px-5 py-4"><StatePill value={order.estadoPago} /></td><td className="px-5 py-4 text-right"><Button size="sm" variant="outline" onClick={() => setSelected(order)}>Ver detalle</Button></td></tr>)}</tbody></table></div>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Nueva orden de compra</DialogTitle><DialogDescription>Selecciona un proveedor activo, agrega productos y define las fechas de la orden.</DialogDescription></DialogHeader><CreatePurchaseOrderForm onCreated={handleCreated} onCancel={() => setCreateOpen(false)} /></DialogContent></Dialog>
      <PurchaseOrderDetail orderSummary={selected} canUpdate={canUpdate} onOpenChange={(open) => { if (!open) setSelected(null) }} onUpdated={handleUpdated} />
    </div>
  )
}
