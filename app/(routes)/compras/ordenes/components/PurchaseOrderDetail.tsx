"use client"

import { useEffect, useMemo, useState } from "react"
import { useUserPermissions } from "@/components/providers"
import { PERMISSIONS } from "@/lib/permissions"
import { PurchaseOrderReceptionDialog } from "./PurchaseOrderReceptionDialog"
import { AlertCircle, CheckCircle2, Copy, Download, LoaderCircle, Send, Wallet } from "lucide-react"
import { toast } from "sonner"
import { buildPurchaseOrderText } from "@/lib/purchase-order-text"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { METODO_PAGO_DEFECTO, METODOS_PAGO, getNombreMetodoPago } from "@/lib/payment-methods"
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog"
import { formatCLP, formatDateCL } from "@/lib/formatters"
import { StatePill } from "./OrdenesCompra"
import type { OrderDetail, PurchaseOrder } from "../types"
import { ESTADO_COMPRA, ESTADO_PAGO_COMPRA, ESTADO_RECEPCION_COMPRA } from "../purchase-status"

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
  const { hasPermission } = useUserPermissions()
  const canReceive = canUpdate && hasPermission(PERMISSIONS.INVENTORY_UPDATE)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copying, setCopying] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [receptionOpen, setReceptionOpen] = useState(false)
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
    setReceptionOpen(false)
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

  const copyToClipboard = async () => {
    if (!order || order.idOrdenDeCompra !== id || loading || busy || copying) return
    setCopying(true)
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Portapapeles no disponible")
      await navigator.clipboard.writeText(buildPurchaseOrderText(order))
      toast.success("Orden copiada al portapapeles. Ya puedes pegarla en WhatsApp.")
    } catch {
      toast.error("No se pudo copiar la orden. Revisa los permisos del portapapeles del navegador.")
    } finally {
      setCopying(false)
    }
  }

  const downloadPdf = async () => {
    if (!order || order.idOrdenDeCompra !== id || loading || busy || downloadingPdf) return
    const orderId = order.idOrdenDeCompra
    let downloadUrl: string | undefined
    let link: HTMLAnchorElement | undefined
    setDownloadingPdf(true)
    try {
      const response = await fetch(`/api/ordenes-compra/${orderId}/pdf`, {
        headers: { Accept: "application/pdf" },
        credentials: "same-origin",
        cache: "no-store",
      })
      if (!response.ok) {
        const result = await response.json().catch(() => null)
        throw new Error(result?.message || "No fue posible generar el PDF de la orden de compra.")
      }
      if (!response.headers.get("Content-Type")?.toLowerCase().includes("application/pdf")) {
        throw new Error("El servidor no devolvió un PDF válido. Comprueba tu sesión e inténtalo nuevamente.")
      }
      const blob = await response.blob()
      if (!blob.size) throw new Error("El PDF está vacío. Inténtalo nuevamente.")
      downloadUrl = URL.createObjectURL(blob)
      link = document.createElement("a")
      link.href = downloadUrl
      link.download = `orden-compra-${orderId}.pdf`
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      toast.success("Descarga del PDF iniciada.")
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "No fue posible descargar el PDF.")
    } finally {
      link?.remove()
      if (downloadUrl) {
        const url = downloadUrl
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
      setDownloadingPdf(false)
    }
  }

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
    <>
      <Dialog open={Boolean(orderSummary)} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[96vh] w-[calc(100vw-2rem)] max-w-[1600px] overflow-y-auto sm:max-w-[calc(100vw-3rem)] lg:max-w-[calc(100vw-6rem)]"
          style={{ width: "min(1600px, calc(100vw - 2rem))" }}
        >
          <DialogHeader>
            <DialogTitle>Orden de compra {orderSummary ? `OC-${orderSummary.idOrdenDeCompra}` : ""}</DialogTitle>
            <DialogDescription>Detalle, estado, pagos parciales y recepción de inventario.</DialogDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="h-auto min-h-8 w-full whitespace-normal py-2 sm:w-auto" disabled={!order || order.idOrdenDeCompra !== id || loading || busy || copying} onClick={() => void copyToClipboard()}>
                {copying ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Copy className="mr-2 h-4 w-4" />}
                Copiar al portapapeles
              </Button>
              <Button type="button" variant="outline" className="h-auto min-h-8 w-full whitespace-normal py-2 sm:w-auto" disabled={!order || order.idOrdenDeCompra !== id || loading || busy || downloadingPdf} onClick={() => void downloadPdf()}>
                {downloadingPdf ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {downloadingPdf ? "Generando PDF..." : "Descargar PDF"}
              </Button>
            </div>
          </DialogHeader>
          {loading && !order ? <div className="space-y-3 py-4"><div className="h-16 animate-pulse rounded-lg bg-muted" /><div className="h-40 animate-pulse rounded-lg bg-muted" /></div> : order ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-4">
                <div><p className="text-xs text-muted-foreground">Proveedor</p><p className="mt-1 font-semibold">{order.proveedor.razonSocial}</p></div>
                <div><p className="text-xs text-muted-foreground">Emisión</p><p className="mt-1 font-medium">{formatDateCL(order.fechaRegistro)}</p></div>
                <div><p className="text-xs text-muted-foreground">Entrega estimada</p><p className="mt-1 font-medium">{formatDateCL(order.fechaEntregaEstimada)}</p></div>
                <div className="flex flex-wrap content-start gap-2"><StatePill value={order.estado} /><StatePill value={order.estadoPago} /><StatePill value={order.estadoRecepcion} /></div>
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
                {canReceive && order.estado === ESTADO_COMPRA.ENVIADA && order.lineas.some((line) => line.cantidadRecibida < line.cantidadOrdenada) && (
                  <Button type="button" variant="outline" onClick={() => setReceptionOpen(true)} disabled={busy || loading}>
                    Registrar recepción
                  </Button>
                )}
                {order.estado === ESTADO_COMPRA.ENVIADA && order.estadoPago === ESTADO_PAGO_COMPRA.PAGADA && order.estadoRecepcion === ESTADO_RECEPCION_COMPRA.RECIBIDA && (
                  <Button
                    type="button"
                    onClick={() => setConfirmReceiveOpen(true)}
                    disabled={busy || loading}
                  >
                    {busy ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Cerrar orden
                  </Button>
                )}
                {order.estado === ESTADO_COMPRA.ENVIADA && order.estadoPago !== ESTADO_PAGO_COMPRA.PAGADA && (
                  <p className="text-sm text-muted-foreground">Completa todos los pagos antes de cerrar y recibir la orden.</p>
                )}
              </div>
            )}
            {order.estado === ESTADO_COMPRA.ENVIADA && (
              <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                Registra las unidades recibidas en cada entrega. Para cerrar la orden se requiere recibir todos los productos y completar los pagos.
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
              description="La orden solo puede cerrarse cuando todos sus productos estén recibidos y completamente pagados. Esta acción es irreversible."
              confirmLabel="Confirmar cierre"
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
      {receptionOpen && order && orderSummary && (
        <PurchaseOrderReceptionDialog
          key={order.idOrdenDeCompra}
          order={order}
          onClose={() => { setReceptionOpen(false); void loadDetail(order.idOrdenDeCompra) }}
          onReceived={(message) => { setReceptionOpen(false); setNotice(message); void loadDetail(order.idOrdenDeCompra) }}
        />
      )}
    </>
  )
}
