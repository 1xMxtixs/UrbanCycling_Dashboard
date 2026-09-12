"use client"

import React, { useEffect, useState } from "react"
import {
  Wrench,
  Loader2,
  Package,
  DollarSign,
  Calculator,
  Info,
  Pencil,
  Check,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataField } from "@/components/common/DataField"
import { StatusBadge } from "@/components/common/StatusBadge"
import { WorkOrder, WorkOrderServiceLine } from "../../types"

// ─── Tipos internos ────────────────────────────────────────────────────────────

interface EditableLineState {
  /** precio editado en el input (string para manejar entrada libre) */
  draftPrice: string
  isEditing: boolean
  isSaving: boolean
}

interface AssignSuppliesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder | null
  onSuccess?: () => void
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function toNum(v: number | string | null | undefined): number {
  return Number(v ?? 0)
}

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString("es-CL")}`
}

// ─── Componente ────────────────────────────────────────────────────────────────

export function AssignSuppliesDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: AssignSuppliesDialogProps) {
  // Estado de edición de descuento global
  const [descuentoDraft, setDescuentoDraft] = useState<string>("")
  const [isEditingDescuento, setIsEditingDescuento] = useState(false)
  const [isSavingDescuento, setIsSavingDescuento] = useState(false)

  // Estado de edición por línea de insumo/producto
  const [lineStates, setLineStates] = useState<Record<number, EditableLineState>>({})

  // Sincronizar estado cuando se abre el diálogo o cambia la orden.
  // Se usa una key derivada en vez de múltiples setStates para evitar renders en cascada.
  const dialogKey = open && order
    ? `${order.idOrdenDeTrabajo}-${order.descuento ?? 0}-${(order.lineasDeOrdenDeTrabajo ?? []).map((l) => `${l.idLineaDeOrdenDeTrabajo}:${l.precioUnitario}`).join(",")}`
    : null

  useEffect(() => {
    if (!dialogKey || !order) return

    const initialLineStates: Record<number, EditableLineState> = {}
    for (const linea of order.lineasDeOrdenDeTrabajo ?? []) {
      initialLineStates[linea.idLineaDeOrdenDeTrabajo] = {
        draftPrice: String(toNum(linea.precioUnitario)),
        isEditing: false,
        isSaving: false,
      }
    }

    // Batch all state resets into a single microtask to avoid cascading renders
    const draft = String(toNum(order.descuento))
    Promise.resolve().then(() => {
      setDescuentoDraft(draft)
      setIsEditingDescuento(false)
      setLineStates(initialLineStates)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogKey])

  if (!order) return null

  // ─── Cálculos derivados ─────────────────────────────────────────────────────

  const lineas = order.lineasDeOrdenDeTrabajo ?? []
  const serviceLines = lineas.filter(
    (l) => l.idServicio !== null && l.idServicio !== undefined
  )
  const productLines = lineas.filter(
    (l) => l.idProducto !== null && l.idProducto !== undefined
  )

  const laborCost = serviceLines.reduce(
    (sum, l) => sum + toNum(l.precioUnitario) * Number(l.cantidad || 1),
    0
  )
  const productsCost = productLines.reduce(
    (sum, l) => sum + toNum(l.precioUnitario) * Number(l.cantidad || 1),
    0
  )

  const subtotal = laborCost + productsCost
  const descuento = toNum(order.descuento)
  const totalFinal = Math.max(0, subtotal - descuento)
  const montoNeto = Math.round(totalFinal / 1.19)
  const montoIva = totalFinal - montoNeto
  const totalPagado = toNum(order.totalPagado)
  const saldoPendiente = Math.max(0, totalFinal - totalPagado)

  const canEdit = !["Entregado", "Anulada"].includes(order.estadoOrden)

  // ─── Guardar descuento global ───────────────────────────────────────────────

  async function handleSaveDescuento() {
    const newDescuento = Number(descuentoDraft)
    if (!Number.isFinite(newDescuento) || newDescuento < 0) {
      toast.error("El descuento debe ser un número válido mayor o igual a 0.")
      return
    }

    setIsSavingDescuento(true)
    try {
      const res = await fetch(
        `/api/punto-venta/orden-${order!.idOrdenDeTrabajo}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ descuentoGlobal: newDescuento }),
        }
      )
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || `Error al guardar descuento (${res.status})`)
      }
      toast.success("Descuento global actualizado.")
      setIsEditingDescuento(false)
      window.dispatchEvent(new Event("work-orders:refresh"))
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el descuento.")
    } finally {
      setIsSavingDescuento(false)
    }
  }

  // ─── Guardar precio de una línea ────────────────────────────────────────────

  async function handleSaveLinePrice(linea: WorkOrderServiceLine) {
    const lineId = linea.idLineaDeOrdenDeTrabajo
    const draft = lineStates[lineId]?.draftPrice ?? ""
    const newPrice = Number(draft)

    if (!Number.isFinite(newPrice) || newPrice < 0) {
      toast.error("El precio debe ser un número válido mayor o igual a 0.")
      return
    }

    setLineStates((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], isSaving: true },
    }))

    try {
      const res = await fetch(
        `/api/punto-venta/orden-${order!.idOrdenDeTrabajo}/lineas/${lineId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ precioUnitario: newPrice }),
        }
      )
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          errData.message || `Error al actualizar línea (${res.status})`
        )
      }
      toast.success("Precio de línea actualizado.")
      setLineStates((prev) => ({
        ...prev,
        [lineId]: { ...prev[lineId], isEditing: false, isSaving: false },
      }))
      window.dispatchEvent(new Event("work-orders:refresh"))
      onSuccess?.()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo actualizar el precio."
      )
      setLineStates((prev) => ({
        ...prev,
        [lineId]: { ...prev[lineId], isSaving: false },
      }))
    }
  }

  function startEditLine(lineId: number) {
    setLineStates((prev) => ({
      ...prev,
      [lineId]: { ...prev[lineId], isEditing: true },
    }))
  }

  function cancelEditLine(lineId: number, originalPrice: number | string) {
    setLineStates((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        draftPrice: String(toNum(originalPrice)),
        isEditing: false,
      },
    }))
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  function renderLineRow(linea: WorkOrderServiceLine) {
    const lineId = linea.idLineaDeOrdenDeTrabajo
    const state = lineStates[lineId] ?? {
      draftPrice: String(toNum(linea.precioUnitario)),
      isEditing: false,
      isSaving: false,
    }
    const nombre =
      linea.servicio?.nombre ?? linea.producto?.nombre ?? `Línea #${lineId}`
    const subtotalLinea =
      toNum(linea.precioUnitario) * Number(linea.cantidad || 1)
    const isService =
      linea.idServicio !== null && linea.idServicio !== undefined

    return (
      <div
        key={lineId}
        className="rounded-lg border border-border bg-muted/25 p-3 flex flex-wrap items-center gap-3 text-xs"
      >
        {/* Etiqueta tipo */}
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isService
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}
        >
          {isService ? "Servicio" : "Insumo"}
        </span>

        {/* Nombre */}
        <span className="flex-1 font-semibold text-foreground min-w-[120px]">
          {nombre}
        </span>

        {/* Cantidad */}
        <span className="text-muted-foreground">
          ×{linea.cantidad}
        </span>

        {/* Precio unitario (editable) */}
        <div className="flex items-center gap-1">
          <Label className="text-[10px] text-muted-foreground shrink-0">
            Precio unit.:
          </Label>
          {state.isEditing && canEdit ? (
            <>
              <Input
                type="number"
                min={0}
                step={100}
                value={state.draftPrice}
                onChange={(e) =>
                  setLineStates((prev) => ({
                    ...prev,
                    [lineId]: { ...prev[lineId], draftPrice: e.target.value },
                  }))
                }
                className="h-7 w-28 text-xs bg-background"
                disabled={state.isSaving}
                autoFocus
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-emerald-600 hover:bg-emerald-500/10"
                disabled={state.isSaving}
                onClick={() => handleSaveLinePrice(linea)}
              >
                {state.isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span className="sr-only">Confirmar precio</span>
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:bg-muted"
                disabled={state.isSaving}
                onClick={() => cancelEditLine(lineId, linea.precioUnitario)}
              >
                <X className="h-3.5 w-3.5" />
                <span className="sr-only">Cancelar</span>
              </Button>
            </>
          ) : (
            <>
              <span className="font-mono font-semibold text-foreground">
                {formatCLP(toNum(linea.precioUnitario))}
              </span>
              {canEdit && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={() => startEditLine(lineId)}
                >
                  <Pencil className="h-3 w-3" />
                  <span className="sr-only">Editar precio</span>
                </Button>
              )}
            </>
          )}
        </div>

        {/* Subtotal línea */}
        <div className="h-8 flex items-center px-2.5 rounded-md border border-border bg-muted/40 font-mono text-xs font-bold text-foreground min-w-[80px] justify-end">
          {formatCLP(subtotalLinea)}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                Valorización de Insumos & Servicios
                <span className="text-muted-foreground font-normal text-sm">
                  (Orden #{order.idOrdenDeTrabajo})
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Edita el precio unitario de cada línea y el descuento global de la orden.
                Para agregar nuevas líneas, usa el módulo de servicios.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
          {/* SECCIÓN 1: Servicios */}
          {serviceLines.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Wrench className="h-4.5 w-4.5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Mano de Obra / Servicios
                </h4>
              </div>
              <div className="space-y-2">
                {serviceLines.map(renderLineRow)}
              </div>
            </div>
          )}

          {/* SECCIÓN 2: Insumos / Productos */}
          {productLines.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Package className="h-4.5 w-4.5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Insumos & Repuestos de Taller
                </h4>
              </div>
              <div className="space-y-2">
                {productLines.map(renderLineRow)}
              </div>
            </div>
          )}

          {/* Estado vacío */}
          {lineas.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <Package className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm font-medium text-foreground">
                No hay líneas registradas en esta orden
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Agrega servicios desde el módulo de órdenes de trabajo.
              </p>
            </div>
          )}

          {/* SECCIÓN 3: Descuento Global */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <DollarSign className="h-4.5 w-4.5 text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                Descuento Global
              </h4>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5 flex-1 min-w-[180px]">
                <Label htmlFor="descuentoGlobal" className="text-xs font-semibold text-foreground">
                  Descuento ($)
                </Label>
                {isEditingDescuento ? (
                  <div className="flex items-center gap-2">
                    <Input
                      id="descuentoGlobal"
                      type="number"
                      min={0}
                      step={100}
                      value={descuentoDraft}
                      onChange={(e) => setDescuentoDraft(e.target.value)}
                      className="h-9 text-sm font-medium"
                      disabled={isSavingDescuento}
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-emerald-600 hover:bg-emerald-500/10"
                      disabled={isSavingDescuento}
                      onClick={handleSaveDescuento}
                    >
                      {isSavingDescuento ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      <span className="sr-only">Guardar descuento</span>
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:bg-muted"
                      disabled={isSavingDescuento}
                      onClick={() => {
                        setDescuentoDraft(String(toNum(order.descuento)))
                        setIsEditingDescuento(false)
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cancelar</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="h-9 flex items-center px-3 rounded-md border border-border bg-muted/40 font-mono text-sm font-semibold text-foreground min-w-[120px]">
                      {formatCLP(descuento)}
                    </div>
                    {canEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 text-xs cursor-pointer"
                        onClick={() => {
                          setDescuentoDraft(String(descuento))
                          setIsEditingDescuento(true)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Descuento promocional aplicado al total de la orden.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: Panel de Valorización */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-primary/10 pb-2">
              <div className="flex items-center gap-2">
                <Calculator className="h-4.5 w-4.5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Resumen de Valorización Total
                </h4>
              </div>
              <StatusBadge
                status={saldoPendiente === 0 ? "success" : "warning"}
                label={
                  saldoPendiente === 0
                    ? "Completamente Pagada"
                    : `Saldo: ${formatCLP(saldoPendiente)}`
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <DataField
                label="Total Insumos / Repuestos"
                value={formatCLP(productsCost)}
              />
              <DataField
                label="Mano de Obra / Servicio"
                value={formatCLP(laborCost)}
              />
              <DataField
                label="Monto Neto (sin IVA)"
                value={formatCLP(montoNeto)}
              />
              <DataField
                label="IVA Estimado (19%)"
                value={formatCLP(montoIva)}
              />
            </div>

            <div className="rounded-lg bg-background border border-border p-3 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Total Final a Facturar
                </span>
                <span className="text-2xl font-black text-primary">
                  {formatCLP(totalFinal)}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Abonado / Pagado:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCLP(totalPagado)}
                  </span>
                </div>
                <div className="border-l border-border pl-4">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Saldo a Cobrar:
                  </span>
                  <span
                    className={`font-black ${
                      saldoPendiente > 0
                        ? "text-rose-500"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatCLP(saldoPendiente)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 text-primary shrink-0" />
              Los montos se calculan en tiempo real a partir de las líneas de la orden. Los cambios de precio y descuento se guardan inmediatamente al confirmar cada edición.
            </div>
          </div>
        </div>

        {/* Pie del diálogo */}
        <div className="flex items-center justify-end border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
