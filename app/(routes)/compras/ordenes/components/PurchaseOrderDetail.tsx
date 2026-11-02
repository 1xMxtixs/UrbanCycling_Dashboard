"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, LoaderCircle, Send, Wallet } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { METODO_PAGO_DEFECTO, METODOS_PAGO, getNombreMetodoPago } from "@/lib/payment-methods"
import { StatusBadge } from "@/components/common/StatusBadge"
import { DataField } from "@/components/common/DataField"
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog"
import { formatCLP, formatDateCL } from "@/lib/formatters"
import { getNombreEstadoPago, getPaymentStatusBadgeVariant } from "@/lib/payment-status"
import { StatePill } from "./OrdenesCompra"
import type { OrderDetail, PurchaseOrder } from "../types"
import { ESTADO_COMPRA, ESTADO_PAGO_COMPRA } from "../purchase-status"

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
  const [confirmReceiveOpen, setConfirmReceiveOpen] = useState(false)
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

  const [prevId, setPrevId] = useState<number | undefined>(undefined)
  if (prevId !== id) {
    setPrevId(id)
    setOrder(null)
    setNotice("")
    setLoading(Boolean(id))
    setError("")
  }

  useEffect(() => {
    if (!id) return
    let isMounted = true
    const controller = new AbortController()

    async function fetchDetail() {
      try {
        const response = await fetch(`/api/ordenes-compra/${id}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        const result = await response.json().catch(() => null)
        if (!response.ok) throw new Error(result?.message || "No fue posible cargar el detalle.")
        if (isMounted) {
          setOrder(result.purchaseOrder)
          onUpdated(result.purchaseOrder)
        }
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return
        if (isMounted) setError(cause instanceof Error ? cause.message : "No fue posible cargar el detalle.")
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void fetchDetail()
    return () => {
      isMounted = false
      controller.abort()
    }
  }, [id, onUpdated])

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
      const successMsg = action === "COMPLETAR"
        ? "Orden completada y productos ingresados al inventario."
        : "Orden marcada como enviada al proveedor."
      setNotice(result.message || successMsg)
      toast.success(result.message || successMsg)
      await loadDetail(order.idOrdenDeCompra)
    } catch (cause) {
      const errorMsg = cause instanceof Error ? cause.message : "No fue posible actualizar el estado de la orden."
      setError(errorMsg)
      toast.error(errorMsg)
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
      toast.success(result.message || "Pago registrado correctamente.")
      await loadDetail(order.idOrdenDeCompra)
    } catch (cause) {
      const errorMsg = cause instanceof Error ? cause.message : "No fue posible registrar el pago."
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={Boolean(orderSummary)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-3xl min-w-0 overflow-x-hidden overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Orden de compra {orderSummary ? `OC-${orderSummary.idOrdenDeCompra}` : ""}</DialogTitle>
          <DialogDescription>Detalle, estado, pagos parciales y recepción de inventario.</DialogDescription>
        </DialogHeader>
        {loading && !order ? (
          <div className="space-y-4 py-4 animate-pulse motion-reduce:animate-none" aria-busy="true">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : order ? (
          <div className="min-w-0 space-y-5">
            <div className="grid min-w-0 gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 sm:grid-cols-2">
              <DataField label="Proveedor" value={order.proveedor.razonSocial} />
              <DataField label="Emisión" value={formatDateCL(order.fechaRegistro)} />
              <DataField label="Entrega estimada" value={formatDateCL(order.fechaEntregaEstimada)} />
              <div className="flex flex-wrap content-start gap-2">
                <StatePill value={order.estado} />
                <StatusBadge
                  status={getPaymentStatusBadgeVariant(order.estadoPago)}
                  label={getNombreEstadoPago(order.estadoPago)}
                  showDot={false}
                />
                <StatePill value={order.estadoRecepcion} />
              </div>
            </div>

            <section className="min-w-0 overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border/70 px-4 py-3">
                <h3 className="font-semibold">Productos</h3>
              </div>
              <div className="divide-y divide-border/60">
                {order.lineas.map((line) => (
                  <div
                    key={line.idLineaDeOrdenDeCompra}
                    className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_100px_130px_130px] sm:items-center"
                  >
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <p className="truncate text-sm font-medium">{line.producto.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        Costo unitario {formatCLP(Number(line.precioCostoUnitario))}
                      </p>
                    </div>
                    <p className="min-w-0 text-xs sm:text-sm">Pedido: {line.cantidadOrdenada}</p>
                    <p className="min-w-0 text-xs sm:text-sm">Recibido: {line.cantidadRecibida}</p>
                    <p className="col-span-2 min-w-0 text-right text-sm font-semibold sm:col-span-1">
                      {formatCLP(line.cantidadOrdenada * Number(line.precioCostoUnitario))}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-border/70 bg-muted/30 px-4 py-3 text-sm">
                <span>Total de la orden</span>
                <strong>{formatCLP(total)}</strong>
              </div>
            </section>

            <section className="min-w-0 rounded-xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Pagos</h3>
                <span className="text-sm text-muted-foreground">Saldo {formatCLP(balance)}</span>
              </div>
              {order.asignacionesPago.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay pagos registrados.</p>
              ) : (
                <div className="mb-4 divide-y divide-border/60">
                  {order.asignacionesPago.map((assignment) => (
                    <div key={assignment.idAsignacionPago} className="flex min-w-0 flex-wrap justify-between gap-2 py-2 text-sm">
                      <span className="min-w-0 break-words">
                        {getNombreMetodoPago(assignment.pago.metodoPago)} · {formatDateCL(assignment.pago.fechaRegistro)}
                      </span>
                      <span className="font-medium">
                        {formatCLP(Number(assignment.montoAsociado))}{" "}
                        <span className="text-xs text-muted-foreground">{assignment.pago.estado}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {canUpdate && order.estado === ESTADO_COMPRA.ENVIADA && balance > 0 && (
                <form
                  onSubmit={registerPayment}
                  className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                >
                  <div className="space-y-2">
                    <Label htmlFor="partial-payment">Monto del abono (CLP)</Label>
                    <Input
                      id="partial-payment"
                      type="number"
                      min="1"
                      max={balance}
                      step="1"
                      required
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder={`Hasta ${balance}`}
                      disabled={busy}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchase-payment-method">Método de pago</Label>
                    <Select value={method} onValueChange={setMethod} disabled={busy}>
                      <SelectTrigger id="purchase-payment-method" aria-label="Seleccionar método de pago">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {METODOS_PAGO.map((item) => (
                          <SelectItem key={item.codigo} value={item.codigo}>
                            {item.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={busy || !amount}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Registrar abono
                  </Button>
                  <p className="text-xs text-muted-foreground sm:col-span-3">
                    El sistema valida que el método siga activo y que el abono no supere el saldo.
                  </p>
                </form>
              )}
            </section>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {notice && (
              <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                {notice}
              </div>
            )}

            {canUpdate && (
              <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
                {order.estado === ESTADO_COMPRA.BORRADOR && (
                  <Button onClick={() => void runTransition("ENVIAR")} disabled={busy}>
                    {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Send className="mr-2 h-4 w-4" />}
                    Marcar como enviada
                  </Button>
                )}
                {order.estado === ESTADO_COMPRA.ENVIADA && order.estadoPago === ESTADO_PAGO_COMPRA.PAGADA && (
                  <Button
                    type="button"
                    onClick={() => setConfirmReceiveOpen(true)}
                    disabled={busy}
                  >
                    {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Completar y recibir en inventario
                  </Button>
                )}
                {order.estado === ESTADO_COMPRA.ENVIADA && order.estadoPago !== ESTADO_PAGO_COMPRA.PAGADA && (
                  <p className="text-sm text-muted-foreground">Completa todos los pagos antes de cerrar y recibir la orden.</p>
                )}
              </div>
            )}
            {order.estado === ESTADO_COMPRA.ENVIADA && order.estadoPago === ESTADO_PAGO_COMPRA.PAGADA && (
              <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                Al completar, la API registra en inventario las unidades que aún no consten como recibidas. No hay una operación disponible para registrar recepciones parciales desde esta pantalla.
              </p>
            )}
          </div>
        ) : (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error || "No fue posible cargar la orden."}
          </div>
        )}

        {order && (
          <StatusToggleDialog
            open={confirmReceiveOpen}
            onOpenChange={setConfirmReceiveOpen}
            title={`¿Completar orden OC-${order.idOrdenDeCompra}?`}
            description="Se registrarán en el inventario las unidades recepcionadas y se dará por cerrada la orden de compra. Esta acción es irreversible."
            confirmLabel="Confirmar y recibir"
            actionVariant="default"
            isSubmitting={busy}
            onConfirm={async () => {
              await runTransition("COMPLETAR")
              setConfirmReceiveOpen(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
