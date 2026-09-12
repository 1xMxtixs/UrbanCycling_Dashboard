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
  UserCheck,
  Calendar,
  FileText,
  PlusCircle,
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataField } from "@/components/common/DataField"
import { StatusBadge } from "@/components/common/StatusBadge"
import { WorkOrder, WorkOrderServiceLine } from "../../types"

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface EditableLineState {
  draftPrice: string
  draftDiscount: string
  isEditing: boolean
  isSaving: boolean
}

interface MechanicOption {
  idUsuario: number
  nombre: string
  correo: string
}

interface CatalogService {
  idServicio: number
  codigo: string
  nombre: string
  precioVenta: number
  estado: string
}

interface AssignSuppliesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder | null
  onSuccess?: () => void
}

function toNum(v: number | string | null | undefined): number {
  return Number(v ?? 0)
}

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString("es-CL")}`
}

function formatDateForInput(dateVal: string | Date | undefined): string {
  if (!dateVal) return ""
  const d = new Date(dateVal)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().split("T")[0]
}

// ─── Componente Principal ───────────────────────────────────────────────────

export function AssignSuppliesDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: AssignSuppliesDialogProps) {
  // Descuento global
  const [descuentoDraft, setDescuentoDraft] = useState<string>("")
  const [isEditingDescuento, setIsEditingDescuento] = useState(false)
  const [isSavingDescuento, setIsSavingDescuento] = useState(false)

  // Datos generales: Mecánico, Fecha y Observaciones
  const [mechanics, setMechanics] = useState<MechanicOption[]>([])
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>("none")
  const [isSavingMechanic, setIsSavingMechanic] = useState(false)

  const [deliveryDateDraft, setDeliveryDateDraft] = useState<string>("")
  const [isSavingDeliveryDate, setIsSavingDeliveryDate] = useState(false)

  const [observationsDraft, setObservationsDraft] = useState<string>("")
  const [isEditingObservations, setIsEditingObservations] = useState(false)
  const [isSavingObservations, setIsSavingObservations] = useState(false)

  // Agregar nuevo servicio a la orden
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([])
  const [selectedNewServiceId, setSelectedNewServiceId] = useState<string>("")
  const [newServiceQuantity, setNewServiceQuantity] = useState<number>(1)
  const [isAddingService, setIsAddingService] = useState(false)

  // Edición por línea (precio y descuento unitario)
  const [lineStates, setLineStates] = useState<Record<number, EditableLineState>>({})

  // Cargar catálogo de mecánicos y servicios cuando abre el diálogo
  useEffect(() => {
    if (!open) return

    async function loadResources() {
      try {
        const [usersRes, servicesRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/servicios?estado=activo"),
        ])

        if (usersRes.ok) {
          const usersData = await usersRes.json()
          if (Array.isArray(usersData)) {
            // Filtrar usuarios con rol de mecánico o administrador/vendedor
            const mechs = usersData
              .filter((u: any) => u.estado === "activo")
              .map((u: any) => ({
                idUsuario: u.idUsuario,
                nombre: `${u.primerNombre ?? ""} ${u.apellidoPaterno ?? ""}`.trim() || u.correoElectronico || `Usuario #${u.idUsuario}`,
                correo: u.correoElectronico,
              }))
            setMechanics(mechs)
          }
        }

        if (servicesRes.ok) {
          const srvData = await servicesRes.json()
          if (Array.isArray(srvData)) {
            setCatalogServices(srvData)
          }
        }
      } catch (err) {
        console.error("Error al cargar recursos para edición de orden:", err)
      }
    }

    loadResources()
  }, [open])

  // Sincronizar estado con la orden recibida
  const dialogKey = open && order
    ? `${order.idOrdenDeTrabajo}-${order.descuento ?? 0}-${order.idMecanicoAsignado ?? ""}-${order.fechaEntregaEstimada ?? ""}-${(order.lineasDeOrdenDeTrabajo ?? []).map((l) => `${l.idLineaDeOrdenDeTrabajo}:${l.precioUnitario}:${l.descuentoUnitario ?? 0}`).join(",")}`
    : null

  useEffect(() => {
    if (!dialogKey || !order) return

    const initialLineStates: Record<number, EditableLineState> = {}
    for (const linea of order.lineasDeOrdenDeTrabajo ?? []) {
      initialLineStates[linea.idLineaDeOrdenDeTrabajo] = {
        draftPrice: String(toNum(linea.precioUnitario)),
        draftDiscount: String(toNum(linea.descuentoUnitario)),
        isEditing: false,
        isSaving: false,
      }
    }

    const draftDesc = String(toNum(order.descuento))
    const mechId = order.idMecanicoAsignado ? String(order.idMecanicoAsignado) : "none"
    const dateFormatted = formatDateForInput(order.fechaEntregaEstimada)
    const obs = order.observacionesIngreso ?? ""

    Promise.resolve().then(() => {
      setDescuentoDraft(draftDesc)
      setIsEditingDescuento(false)
      setSelectedMechanicId(mechId)
      setDeliveryDateDraft(dateFormatted)
      setObservationsDraft(obs)
      setIsEditingObservations(false)
      setLineStates(initialLineStates)
      setSelectedNewServiceId("")
      setNewServiceQuantity(1)
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
    (sum, l) => sum + Math.max(0, toNum(l.precioUnitario) - toNum(l.descuentoUnitario)) * Number(l.cantidad || 1),
    0
  )
  const productsCost = productLines.reduce(
    (sum, l) => sum + Math.max(0, toNum(l.precioUnitario) - toNum(l.descuentoUnitario)) * Number(l.cantidad || 1),
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

  // ─── Operaciones Backend ───────────────────────────────────────────────────

  // 1. Descuento global
  async function handleSaveDescuento() {
    const newDescuento = Number(descuentoDraft)
    if (!Number.isFinite(newDescuento) || newDescuento < 0) {
      toast.error("El descuento debe ser un número válido mayor o igual a 0.")
      return
    }

    setIsSavingDescuento(true)
    try {
      const res = await fetch(`/api/punto-venta/orden-${order!.idOrdenDeTrabajo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descuentoGlobal: newDescuento }),
      })
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

  // 2. Asignar Mecánico
  async function handleSaveMechanic(newVal: string) {
    setSelectedMechanicId(newVal)
    setIsSavingMechanic(true)
    try {
      const res = await fetch(`/api/punto-venta/orden-${order!.idOrdenDeTrabajo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idMecanicoAsignado: newVal === "none" ? null : Number(newVal),
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Error al actualizar mecánico asignado")
      }
      toast.success("Mecánico asignado actualizado.")
      window.dispatchEvent(new Event("work-orders:refresh"))
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo reasignar mecánico.")
      setSelectedMechanicId(order!.idMecanicoAsignado ? String(order!.idMecanicoAsignado) : "none")
    } finally {
      setIsSavingMechanic(false)
    }
  }

  // 3. Fecha de Entrega Estimada
  async function handleSaveDeliveryDate() {
    if (!deliveryDateDraft) {
      toast.error("Debe seleccionar una fecha estimada de entrega.")
      return
    }

    setIsSavingDeliveryDate(true)
    try {
      const res = await fetch(`/api/punto-venta/orden-${order!.idOrdenDeTrabajo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaEntregaEstimada: deliveryDateDraft,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Error al reprogramar fecha de entrega")
      }
      toast.success("Fecha estimada de entrega actualizada.")
      window.dispatchEvent(new Event("work-orders:refresh"))
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar fecha de entrega.")
    } finally {
      setIsSavingDeliveryDate(false)
    }
  }

  // 4. Observaciones / Diagnóstico de ingreso
  async function handleSaveObservations() {
    setIsSavingObservations(true)
    try {
      const res = await fetch(`/api/punto-venta/orden-${order!.idOrdenDeTrabajo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          observacionesIngreso: observationsDraft,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Error al actualizar observaciones")
      }
      toast.success("Observaciones de la orden actualizadas.")
      setIsEditingObservations(false)
      window.dispatchEvent(new Event("work-orders:refresh"))
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron actualizar observaciones.")
    } finally {
      setIsSavingObservations(false)
    }
  }

  // 5. Agregar Nuevo Servicio a la orden (consume insumos con stock)
  async function handleAddServiceToOrder() {
    const srvId = Number(selectedNewServiceId)
    if (!srvId || srvId <= 0) {
      toast.error("Selecciona un servicio válido de la lista.")
      return
    }
    if (!newServiceQuantity || newServiceQuantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0.")
      return
    }

    setIsAddingService(true)
    try {
      const res = await fetch(`/api/ordenes-trabajo/${order!.idOrdenDeTrabajo}/servicios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idServicio: srvId,
          cantidad: newServiceQuantity,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.message || "No se pudo agregar el servicio a la orden")
      }

      toast.success("Servicio e insumos agregados correctamente a la orden.")
      setSelectedNewServiceId("")
      setNewServiceQuantity(1)
      window.dispatchEvent(new Event("work-orders:refresh"))
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al agregar servicio.")
    } finally {
      setIsAddingService(false)
    }
  }

  // 6. Guardar Precio y Descuento de una Línea
  async function handleSaveLine(linea: WorkOrderServiceLine) {
    const lineId = linea.idLineaDeOrdenDeTrabajo
    const state = lineStates[lineId]
    const newPrice = Number(state?.draftPrice ?? "")
    const newDiscount = Number(state?.draftDiscount ?? 0)

    if (!Number.isFinite(newPrice) || newPrice < 0) {
      toast.error("El precio debe ser un número válido mayor o igual a 0.")
      return
    }
    if (!Number.isFinite(newDiscount) || newDiscount < 0) {
      toast.error("El descuento unitario debe ser un número mayor o igual a 0.")
      return
    }
    if (newDiscount > newPrice) {
      toast.error("El descuento no puede superar el precio unitario.")
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
          body: JSON.stringify({
            precioUnitario: newPrice,
            descuentoUnitario: newDiscount,
          }),
        }
      )
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || `Error al actualizar línea (${res.status})`)
      }
      toast.success("Línea actualizada correctamente.")
      setLineStates((prev) => ({
        ...prev,
        [lineId]: { ...prev[lineId], isEditing: false, isSaving: false },
      }))
      window.dispatchEvent(new Event("work-orders:refresh"))
      onSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la línea.")
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

  function cancelEditLine(lineId: number, originalPrice: number | string, originalDiscount?: number | string) {
    setLineStates((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        draftPrice: String(toNum(originalPrice)),
        draftDiscount: String(toNum(originalDiscount)),
        isEditing: false,
      },
    }))
  }

  // ─── Renderizado de filas de líneas ─────────────────────────────────────────

  function renderLineRow(linea: WorkOrderServiceLine) {
    const lineId = linea.idLineaDeOrdenDeTrabajo
    const state = lineStates[lineId] ?? {
      draftPrice: String(toNum(linea.precioUnitario)),
      draftDiscount: String(toNum(linea.descuentoUnitario)),
      isEditing: false,
      isSaving: false,
    }
    const nombre = linea.servicio?.nombre ?? linea.producto?.nombre ?? `Línea #${lineId}`
    const isService = linea.idServicio !== null && linea.idServicio !== undefined
    const unitPriceEffective = Math.max(0, toNum(linea.precioUnitario) - toNum(linea.descuentoUnitario))
    const subtotalLinea = unitPriceEffective * Number(linea.cantidad || 1)

    return (
      <div
        key={lineId}
        className="rounded-lg border border-border bg-muted/25 p-3 space-y-2 text-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isService
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isService ? "Servicio" : "Insumo / Repuesto"}
            </span>
            <span className="font-semibold text-foreground">
              {nombre}
            </span>
            <span className="text-muted-foreground font-mono">
              (×{linea.cantidad})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">Subtotal</span>
              <span className="font-mono font-bold text-foreground">
                {formatCLP(subtotalLinea)}
              </span>
            </div>

            {canEdit && !state.isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 cursor-pointer"
                onClick={() => startEditLine(lineId)}
              >
                <Pencil className="h-3 w-3" />
                Editar Valor
              </Button>
            )}
          </div>
        </div>

        {/* Campos de edición inline para la línea */}
        {state.isEditing && canEdit ? (
          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-border/60 bg-background/80 p-2.5 rounded-md">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Precio Unitario ($)</Label>
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
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Descuento Unit. ($)</Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={state.draftDiscount}
                onChange={(e) =>
                  setLineStates((prev) => ({
                    ...prev,
                    [lineId]: { ...prev[lineId], draftDiscount: e.target.value },
                  }))
                }
                className="h-7 w-28 text-xs bg-background"
                disabled={state.isSaving}
              />
            </div>

            <div className="flex items-center gap-1.5 pb-0.5">
              <Button
                type="button"
                size="sm"
                className="h-7 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
                disabled={state.isSaving}
                onClick={() => handleSaveLine(linea)}
              >
                {state.isSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Guardar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs cursor-pointer"
                disabled={state.isSaving}
                onClick={() => cancelEditLine(lineId, linea.precioUnitario, linea.descuentoUnitario)}
              >
                <X className="h-3 w-3" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono">
            <span>Precio Unit.: {formatCLP(toNum(linea.precioUnitario))}</span>
            {toNum(linea.descuentoUnitario) > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">
                Desc.: -{formatCLP(toNum(linea.descuentoUnitario))}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                  Edición Integral de Orden de Trabajo
                  <span className="text-muted-foreground font-normal text-sm">
                    (#{order.idOrdenDeTrabajo})
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Modifica precios de insumos, agrega servicios técnicos con descuento de inventario y ajusta responsable, entrega o diagnóstico.
                </DialogDescription>
              </div>
            </div>
            <StatusBadge status="neutral" label={order.estadoOrden} />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
          {/* SECCIÓN 1: Datos Generales (Mecánico, Fecha Estimada, Diagnóstico) */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
              <UserCheck className="h-4 w-4 text-primary" />
              Gestión de Responsable, Entrega y Diagnóstico
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mecánico Asignado */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mecánico Asignado</Label>
                <Select
                  value={selectedMechanicId}
                  onValueChange={handleSaveMechanic}
                  disabled={!canEdit || isSavingMechanic}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Sin mecánico asignado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin mecánico asignado</SelectItem>
                    {mechanics.map((m) => (
                      <SelectItem key={m.idUsuario} value={String(m.idUsuario)}>
                        {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-muted-foreground">
                  El cambio de mecánico se guarda automáticamente al seleccionarlo.
                </span>
              </div>

              {/* Fecha Estimada de Entrega */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fecha Estimada de Entrega</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={deliveryDateDraft}
                    onChange={(e) => setDeliveryDateDraft(e.target.value)}
                    className="h-9 text-xs"
                    disabled={!canEdit || isSavingDeliveryDate}
                  />
                  {canEdit && (
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 text-xs cursor-pointer"
                      onClick={handleSaveDeliveryDate}
                      disabled={isSavingDeliveryDate}
                    >
                      {isSavingDeliveryDate ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Reprogramar"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnóstico / Observaciones de Ingreso */}
            <div className="space-y-1.5 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Observaciones de Ingreso / Diagnóstico Técnico
                </Label>
                {canEdit && !isEditingObservations && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs gap-1 text-primary cursor-pointer"
                    onClick={() => setIsEditingObservations(true)}
                  >
                    <Pencil className="h-3 w-3" />
                    Editar Diagnóstico
                  </Button>
                )}
              </div>

              {isEditingObservations ? (
                <div className="space-y-2">
                  <Textarea
                    value={observationsDraft}
                    onChange={(e) => setObservationsDraft(e.target.value)}
                    rows={3}
                    className="text-xs"
                    disabled={isSavingObservations}
                    placeholder="Escribe el diagnóstico o requerimiento técnico..."
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs cursor-pointer"
                      onClick={() => {
                        setObservationsDraft(order.observacionesIngreso ?? "")
                        setIsEditingObservations(false)
                      }}
                      disabled={isSavingObservations}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 text-xs bg-primary text-primary-foreground cursor-pointer"
                      onClick={handleSaveObservations}
                      disabled={isSavingObservations}
                    >
                      {isSavingObservations ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Guardar Diagnóstico"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs italic bg-muted/40 p-2.5 rounded-lg border border-border text-foreground">
                  {order.observacionesIngreso || "Sin observaciones adicionales registradas."}
                </p>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: Agregar Servicio Adicional */}
          {canEdit && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-2">
                <PlusCircle className="h-4 w-4 text-primary" />
                Agregar Servicio Técnico Adicional
              </h4>
              <p className="text-xs text-muted-foreground">
                Al agregar un servicio, el sistema descontará automáticamente los insumos vinculados desde el stock en inventario y recalculará la orden.
              </p>

              <div className="flex flex-wrap items-end gap-3 pt-1">
                <div className="flex-1 min-w-[220px] space-y-1">
                  <Label className="text-xs">Servicio del Catálogo</Label>
                  <Select
                    value={selectedNewServiceId}
                    onValueChange={setSelectedNewServiceId}
                    disabled={isAddingService}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Seleccionar servicio a incorporar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogServices.map((srv) => (
                        <SelectItem key={srv.idServicio} value={String(srv.idServicio)}>
                          {srv.nombre} ({formatCLP(srv.precioVenta)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24 space-y-1">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={newServiceQuantity}
                    onChange={(e) => setNewServiceQuantity(Math.max(1, Number(e.target.value)))}
                    className="h-9 text-xs"
                    disabled={isAddingService}
                  />
                </div>

                <Button
                  type="button"
                  className="h-9 text-xs gap-1.5 cursor-pointer"
                  onClick={handleAddServiceToOrder}
                  disabled={!selectedNewServiceId || isAddingService}
                >
                  {isAddingService ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <PlusCircle className="h-3.5 w-3.5" />
                  )}
                  Agregar Servicio
                </Button>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: Mano de Obra / Servicios Actuales */}
          {serviceLines.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Wrench className="h-4.5 w-4.5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Mano de Obra / Servicios en la Orden
                </h4>
              </div>
              <div className="space-y-2.5">
                {serviceLines.map(renderLineRow)}
              </div>
            </div>
          )}

          {/* SECCIÓN 4: Insumos & Repuestos de Taller */}
          {productLines.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Package className="h-4.5 w-4.5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Insumos & Repuestos Utilizados
                </h4>
              </div>
              <div className="space-y-2.5">
                {productLines.map(renderLineRow)}
              </div>
            </div>
          )}

          {/* SECCIÓN 5: Descuento Global */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <DollarSign className="h-4.5 w-4.5 text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                Descuento Global a la Orden
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
                        Editar Descuento
                      </Button>
                    )}
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground">
                  Descuento promocional deducible del total acumulado.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 6: Resumen de Valorización Total */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-primary/10 pb-2">
              <div className="flex items-center gap-2">
                <Calculator className="h-4.5 w-4.5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Resumen Económico en Tiempo Real
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
                label="Mano de Obra / Servicios"
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
                    Saldo Restante:
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
              Todos los cambios aplicados impactan automáticamente la base de datos y recalculan los saldos de la orden.
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
