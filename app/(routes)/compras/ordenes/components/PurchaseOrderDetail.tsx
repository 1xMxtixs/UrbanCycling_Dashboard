"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, LoaderCircle, Send, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { METODO_PAGO_DEFECTO, METODOS_PAGO, getNombreMetodoPago } from "@/lib/payment-methods"
import { PurchaseOrder, StatePill, currency, date } from "./OrdenesCompra"

type OrderDetail = PurchaseOrder & {
  montoSubtotal: number | string
  lineas: Array<{
    idLineaDeOrdenDeCompra: number
    idProducto: number
    cantidadOrdenada: number
    cantidadRecibida: number
    precioCostoUnitario: number | string
    producto: { idProducto: number; nombre: string }
  }>
  asignacionesPago: Array<{
    idAsignacionPago: number
    montoAsociado: number | string
    pago: { fechaRegistro: string; estado: string; metodoPago: string; monto: number | string }
  }>
}

export function PurchaseOrderDetail({
  orderSummary,
  canUpdate,
  onOpenChange,
  onUpdated,
}: {
  orderSummary: PurchaseOrder | null
  canUpdate: boolean
  onOpenChange: (open: boolean) => void
  onUpdated: (order: PurchaseOrder) => void
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<string>(METODO_PAGO_DEFECTO)
  const id = orderSummary?.idOrdenDeCompra

  const loadDetail = async (orderId: number) => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/ordenes-compra/${orderId}`, { cache: "no-store" })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || "No fue posible cargar el detalle.")
      setOrder(result.purchaseOrder)
      onUpdated(result.purchaseOrder)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible cargar el detalle.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    const timer = window.setTimeout(() => {
      setOrder(null)
      setNotice("")
      void loadDetail(id)
    }, 0)
    return () => window.clearTimeout(timer)
    // Refresh is keyed by the selected order; its ID identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const paid = useMemo(() => (order?.asignacionesPago ?? [])
    .filter((assignment) => assignment.pago.estado === "COMPLETADO")
    .reduce((total, item) => total + Number(item.montoAsociado), 0), [order])
  const total = Number(order?.montoTotal ?? 0)
  const balance = Math.max(0, total - paid)

  const runTransition = async (action: "ENVIAR" | "COMPLETAR") => {
    if (!order) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch(`/api/ordenes-compra/${order.idOrdenDeCompra}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: action }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || "No fue posible actualizar el estado de la orden.")
      setNotice(result.message || "Estado actualizado.")
      await loadDetail(order.idOrdenDeCompra)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible actualizar el estado de la orden.")
    } finally {
      setBusy(false)
    }
  }

  const registerPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!order) return
    const paymentAmount = Number(amount)
    if (!Number.isSafeInteger(paymentAmount) || paymentAmount <= 0 || paymentAmount > balance) {
      setError("Ingresa un monto entero positivo que no supere el saldo pendiente.")
      return
    }
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch(`/api/ordenes-compra/${order.idOrdenDeCompra}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: paymentAmount, metodoPago: method }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || "No fue posible registrar el pago.")
      setAmount("")
      setNotice(result.message || "Pago registrado correctamente.")
      await loadDetail(order.idOrdenDeCompra)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible registrar el pago.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={Boolean(orderSummary)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Orden de compra {orderSummary ? `OC-${orderSummary.idOrdenDeCompra}` : ""}</DialogTitle>
          <DialogDescription>Detalle, estado, pagos parciales y recepción de inventario.</DialogDescription>
        </DialogHeader>
        {loading && !order ? <div className="space-y-3 py-4"><div className="h-16 animate-pulse rounded-lg bg-muted" /><div className="h-40 animate-pulse rounded-lg bg-muted" /></div> : order ? (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-4">
              <div><p className="text-xs text-muted-foreground">Proveedor</p><p className="mt-1 font-semibold">{order.proveedor.razonSocial}</p></div>
              <div><p className="text-xs text-muted-foreground">Emisión</p><p className="mt-1 font-medium">{date(order.fechaRegistro)}</p></div>
              <div><p className="text-xs text-muted-foreground">Entrega estimada</p><p className="mt-1 font-medium">{date(order.fechaEntregaEstimada)}</p></div>
              <div className="flex flex-wrap content-start gap-2"><StatePill value={order.estado} /><StatePill value={order.estadoPago} /><StatePill value={order.estadoRecepcion} /></div>
            </div>

            <section className="overflow-hidden rounded-xl border border-border"><div className="border-b border-border/70 px-4 py-3"><h3 className="font-semibold">Productos</h3></div><div className="divide-y divide-border/60">{order.lineas.map((line) => <div key={line.idLineaDeOrdenDeCompra} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_100px_130px_130px]"><div className="min-w-0"><p className="truncate text-sm font-medium">{line.producto.nombre}</p><p className="text-xs text-muted-foreground">Costo unitario {currency.format(Number(line.precioCostoUnitario))}</p></div><p className="text-sm">Pedido: {line.cantidadOrdenada}</p><p className="text-sm">Recibido: {line.cantidadRecibida}</p><p className="text-right text-sm font-semibold">{currency.format(line.cantidadOrdenada * Number(line.precioCostoUnitario))}</p></div>)}</div><div className="flex justify-between border-t border-border/70 bg-muted/30 px-4 py-3 text-sm"><span>Total de la orden</span><strong>{currency.format(total)}</strong></div></section>

            <section className="rounded-xl border border-border p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Pagos</h3><span className="text-sm text-muted-foreground">Saldo {currency.format(balance)}</span></div>{order.asignacionesPago.length === 0 ? <p className="text-sm text-muted-foreground">Aún no hay pagos registrados.</p> : <div className="mb-4 divide-y divide-border/60">{order.asignacionesPago.map((assignment) => <div key={assignment.idAsignacionPago} className="flex flex-wrap justify-between gap-2 py-2 text-sm"><span>{getNombreMetodoPago(assignment.pago.metodoPago)} · {date(assignment.pago.fechaRegistro)}</span><span className="font-medium">{currency.format(Number(assignment.montoAsociado))} <span className="text-xs text-muted-foreground">{assignment.pago.estado}</span></span></div>)}</div>}
              {canUpdate && order.estado === "ENVIADA" && balance > 0 && <form onSubmit={registerPayment} className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><div className="space-y-2"><Label htmlFor="partial-payment">Monto del abono (CLP)</Label><Input id="partial-payment" type="number" min="1" max={balance} step="1" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={`Hasta ${balance}`} disabled={busy} /></div><div className="space-y-2"><Label>Método de pago</Label><Select value={method} onValueChange={setMethod} disabled={busy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{METODOS_PAGO.map((item) => <SelectItem key={item.codigo} value={item.codigo}>{item.nombre}</SelectItem>)}</SelectContent></Select></div><Button type="submit" disabled={busy || !amount}><Wallet className="mr-2 h-4 w-4" />Registrar abono</Button><p className="text-xs text-muted-foreground sm:col-span-3">El sistema valida que el método siga activo y que el abono no supere el saldo.</p></form>}
            </section>

            {error && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
            {notice && <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}

            {canUpdate && <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
              {order.estado === "BORRADOR" && <Button onClick={() => void runTransition("ENVIAR")} disabled={busy}>{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Marcar como enviada</Button>}
              {order.estado === "ENVIADA" && order.estadoPago === "PAGADA" && <Button onClick={() => void runTransition("COMPLETAR")} disabled={busy}>{busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Completar y recibir en inventario</Button>}
              {order.estado === "ENVIADA" && order.estadoPago !== "PAGADA" && <p className="text-sm text-muted-foreground">Completa todos los pagos antes de cerrar y recibir la orden.</p>}
            </div>}
            {order.estado === "ENVIADA" && order.estadoPago === "PAGADA" && <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">Al completar, la API registra en inventario las unidades que aún no consten como recibidas. No hay una operación disponible para registrar recepciones parciales desde esta pantalla.</p>}
          </div>
        ) : <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error || "No fue posible cargar la orden."}</div>}
      </DialogContent>
    </Dialog>
  )
}
