"use client"

import {
  User,
  Calendar,
  FileText,
  ShoppingBag,
  Coins,
  Wrench,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Printer,
  Download,
  Mail,
  History,
  Maximize2,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  UserCheck,
  PlusCircle,
  XCircle,
  Info,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { PERMISSIONS } from "@/lib/permissions"
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
import { StatusBadge } from "@/components/common/StatusBadge"
import { WorkOrderStatusBadge } from "@/components/common/WorkOrderStatusBadge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataField } from "@/components/common/DataField"
import { formatClientName, formatCLP } from "@/lib/formatters"
import { ESTADO_PAGO, getNombreEstadoPago } from "@/lib/payment-status"
import { getNombreMetodoPago } from "@/lib/payment-methods"
import { ESTADO_OT, ESTADOS_OT_CERRADOS, getNombreEstadoOtVisible } from "@/lib/work-order-status"
import { isRegistroActivo } from "@/lib/registro-status"
import { WorkOrder, WorkOrderPayment, WorkOrderServiceLine } from "../../types"
import { AddOrderProduct } from "./AddOrderProduct"
import {
  buildWorkOrderContent,
  buildWorkOrderHtml,
  workOrderFileName,
} from "@/components/common/WorkOrderDocument"

interface EditableLineState {
  draftPrice: string
  draftDiscount: string
  isEditing: boolean
  isSaving: boolean
}

interface UserApiResponse {
  idUsuario: number
  primerNombre?: string
  apellidoPaterno?: string
  correoElectronico?: string
  estado?: string
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

interface OrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder | null
  isEditing: boolean
  onEditingChange: (isEditing: boolean) => void
  onEditSuccess?: () => void
  onPayClick?: (order: WorkOrder) => void
  onGenerateReceipt?: (order: WorkOrder) => void
  onAuditClick?: (order: WorkOrder) => void
}

interface LightboxState {
  images: string[]
  index: number
  title: string
}

function formatDateForInput(dateVal: string | Date | undefined): string {
  if (!dateVal) return ""
  const d = new Date(dateVal)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().split("T")[0]
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  isEditing,
  onEditingChange,
  onEditSuccess,
  onPayClick,
  onGenerateReceipt,
  onAuditClick,
}: OrderDetailDialogProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === "Administrador"

  const [openBikes, setOpenBikes] = useState<{ [key: number]: boolean }>({})
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

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
  const [isSavingObservations, setIsSavingObservations] = useState(false)

  // Agregar nuevo servicio a la orden
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([])
  const [selectedNewServiceId, setSelectedNewServiceId] = useState<string>("")
  const [newServiceQuantity, setNewServiceQuantity] = useState<number>(1)
  const [isAddingService, setIsAddingService] = useState(false)

  // Edición por línea (precio y descuento unitario)
  const [lineStates, setLineStates] = useState<Record<number, EditableLineState>>({})

  // Anular Orden de Trabajo
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)

  // Cargar recursos de edición (mecánicos y catálogo de servicios)
  useEffect(() => {
    if (!open) return

    async function loadResources() {
      try {
        const [usersRes, servicesRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/servicios?estado=activo"),
        ])

        if (usersRes.ok) {
          const usersData: unknown = await usersRes.json()
          if (Array.isArray(usersData)) {
            const mechs = (usersData as UserApiResponse[])
              .filter((u) => isRegistroActivo(u.estado))
              .map((u) => ({
                idUsuario: u.idUsuario,
                nombre: `${u.primerNombre ?? ""} ${u.apellidoPaterno ?? ""}`.trim() || u.correoElectronico || `Usuario #${u.idUsuario}`,
                correo: u.correoElectronico || "",
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

  // Sincronizar estados locales con la orden activa
  const syncKey = open && order
    ? `${order.idOrdenDeTrabajo}-${order.descuento ?? 0}-${order.idMecanicoAsignado ?? ""}-${order.fechaEntregaEstimada ?? ""}-${(order.lineasDeOrdenDeTrabajo ?? []).map((l) => `${l.idLineaDeOrdenDeTrabajo}:${l.precioUnitario}:${l.descuentoUnitario ?? 0}`).join(",")}`
    : null

  useEffect(() => {
    if (!syncKey || !order) return

    const initialLineStates: Record<number, EditableLineState> = {}
    for (const linea of order.lineasDeOrdenDeTrabajo ?? []) {
      initialLineStates[linea.idLineaDeOrdenDeTrabajo] = {
        draftPrice: String(Number(linea.precioUnitario ?? 0)),
        draftDiscount: String(Number(linea.descuentoUnitario ?? 0)),
        isEditing: false,
        isSaving: false,
      }
    }

    const draftDesc = String(Number(order.descuento ?? 0))
    const mechId = order.idMecanicoAsignado ? String(order.idMecanicoAsignado) : "none"
    const dateFormatted = formatDateForInput(order.fechaEntregaEstimada)
    const obs = order.observacionesIngreso ?? ""

    Promise.resolve().then(() => {
      setDescuentoDraft(draftDesc)
      setIsEditingDescuento(false)
      setSelectedMechanicId(mechId)
      setDeliveryDateDraft(dateFormatted)
      setObservationsDraft(obs)
      setLineStates(initialLineStates)
      setSelectedNewServiceId("")
      setNewServiceQuantity(1)
    })
  }, [syncKey, order])

  if (!order) return null

  const showImage = (step: number) =>
    setLightbox((prev) =>
      prev
        ? {
            ...prev,
            index:
              (prev.index + step + prev.images.length) % prev.images.length,
          }
        : prev
    )

  const efectivo = (line: WorkOrderServiceLine) =>
    Math.max(0, Number(line.precioUnitario || 0) - Number(line.descuentoUnitario || 0))

  const serviceLines = (order.lineasDeOrdenDeTrabajo || []).filter(
    (l) => l.idServicio !== null && l.idServicio !== undefined
  )

  const productLines = (order.lineasDeOrdenDeTrabajo || []).filter(
    (l) => l.idProducto !== null && l.idProducto !== undefined
  )

  const laborCost = serviceLines.reduce(
    (sum, l) => sum + efectivo(l) * Number(l.cantidad || 1),
    0
  )

  const productsCost = productLines.reduce(
    (sum, l) => sum + efectivo(l) * Number(l.cantidad || 1),
    0
  )

  const total = Number(order.total)
  const montoNeto = Math.round(total / 1.19)

  const canEdit = !ESTADOS_OT_CERRADOS.includes(order.estadoOrden as never)
  const totalPagado = Number(order.totalPagado || 0)
  const productDisabledReason = order.estadoOrden !== ESTADO_OT.POR_REALIZAR && order.estadoOrden !== ESTADO_OT.EN_CURSO
    ? 'La orden debe estar "Por realizar" o "En curso" para agregar productos.'
    : totalPagado > 0 || (order.estadoPago && order.estadoPago !== ESTADO_PAGO.PENDIENTE)
      ? "No se pueden agregar productos a una orden con pagos registrados."
      : undefined
  const isPaid =
    order.estadoPago === ESTADO_PAGO.PAGADA ||
    Math.max(0, total - totalPagado) === 0

  const assignedMechanic = mechanics.find(
    (m) => m.idUsuario === order.idMecanicoAsignado
  )

  // ─── Operaciones Backend ───────────────────────────────────────────────────

  // 1. Guardar Descuento Global
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
      onEditSuccess?.()
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
      onEditSuccess?.()
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
      onEditSuccess?.()
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
      window.dispatchEvent(new Event("work-orders:refresh"))
      onEditSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudieron actualizar observaciones.")
    } finally {
      setIsSavingObservations(false)
    }
  }

  // 5. Agregar Nuevo Servicio a la orden
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

      toast.success("Servicio agregado correctamente a la orden.")
      setSelectedNewServiceId("")
      setNewServiceQuantity(1)
      window.dispatchEvent(new Event("work-orders:refresh"))
      onEditSuccess?.()
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
      onEditSuccess?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar la línea.")
      setLineStates((prev) => ({
        ...prev,
        [lineId]: { ...prev[lineId], isSaving: false },
      }))
    }
  }

  // 7. Anular Orden
  async function handleConfirmCancelOrder() {
    setIsCancellingOrder(true)
    try {
      const res = await fetch(`/api/punto-venta/orden-${order!.idOrdenDeTrabajo}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: ESTADO_OT.ANULADA }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(
          err.code === "ANULACION_NO_PERMITIDA"
            ? "No es posible anular esta orden"
            : err.message || "No se pudo anular la orden"
        )
        return
      }

      toast.success("Orden de trabajo anulada correctamente.")
      setShowCancelConfirm(false)
      onEditingChange(false)
      onOpenChange(false)
      window.dispatchEvent(new Event("work-orders:refresh"))
      onEditSuccess?.()
    } catch {
      toast.error("No se pudo anular la orden.")
    } finally {
      setIsCancellingOrder(false)
    }
  }

  // Renderizar fila de edición/visualización de línea (servicio o producto)
  const renderLineRow = (linea: WorkOrderServiceLine, label: string) => {
    const lineId = linea.idLineaDeOrdenDeTrabajo
    const state = lineStates[lineId] || {
      draftPrice: String(Number(linea.precioUnitario ?? 0)),
      draftDiscount: String(Number(linea.descuentoUnitario ?? 0)),
      isEditing: false,
      isSaving: false,
    }

    const subtotal = efectivo(linea) * Number(linea.cantidad || 1)
    const unitPrice = Number(linea.precioUnitario || 0)
    const lineDiscount = Number(linea.descuentoUnitario || 0)

    return (
      <div
        key={lineId}
        className="rounded-lg border border-border bg-background p-3 space-y-2 transition-colors duration-150"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-foreground text-xs block">
              {label}
            </span>
            <span className="text-muted-foreground font-mono text-[11px]">
              Cantidad: ×{linea.cantidad}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block">Subtotal</span>
              <span className="font-mono font-bold text-foreground text-xs">
                {formatCLP(subtotal)}
              </span>
            </div>

            {isEditing && canEdit && !state.isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 cursor-pointer"
                onClick={() =>
                  setLineStates((prev) => ({
                    ...prev,
                    [lineId]: { ...state, isEditing: true },
                  }))
                }
              >
                <Pencil className="h-3 w-3" />
                Editar Valor
              </Button>
            )}
          </div>
        </div>

        {/* Campos de edición inline para la línea */}
        {isEditing && state.isEditing && canEdit ? (
          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-border/60 bg-muted/40 p-2.5 rounded-md">
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
                className="h-7 gap-1 text-xs cursor-pointer font-semibold"
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
                onClick={() =>
                  setLineStates((prev) => ({
                    ...prev,
                    [lineId]: {
                      draftPrice: String(Number(linea.precioUnitario ?? 0)),
                      draftDiscount: String(Number(linea.descuentoUnitario ?? 0)),
                      isEditing: false,
                      isSaving: false,
                    },
                  }))
                }
              >
                <X className="h-3 w-3" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono">
            <span>Precio Unit.: {formatCLP(unitPrice)}</span>
            {lineDiscount > 0 && (
              <span className="text-primary font-semibold">
                Desc.: −{formatCLP(lineDiscount)}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onEditingChange(false)
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="flex max-h-[min(90dvh,48rem)] w-[calc(100%-2rem)] flex-col overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="shrink-0 px-6 pt-6 pr-12">
          <DialogTitle className="flex flex-col gap-2 border-b border-border pb-2 text-xl font-black sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span>Orden de Trabajo #{order.idOrdenDeTrabajo}</span>
              {isEditing && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                  <Pencil className="h-3 w-3" />
                  Modo Edición
                </span>
              )}
            </div>
            <div className="self-start sm:mr-6 sm:self-auto">
              <WorkOrderStatusBadge
                estado={order.estadoOrden}
                nombre={order.estadoOrdenNombre}
                fechaEntregaEstimada={order.fechaEntregaEstimada}
              />
            </div>
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edita directamente el responsable, fecha de entrega, diagnóstico, servicios e insumos de la orden."
              : "Detalles completos de la orden cargada en el sistema"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 pb-6 pt-4 text-sm">
          {/* 1. Datos Cliente */}
          <div className="space-y-2 rounded-xl border border-border p-4">
            <h4 className="flex items-center gap-1.5 font-bold text-foreground border-b border-border pb-1.5">
              <User className="h-4 w-4 text-primary" />
              Información del Cliente
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <DataField
                label="Nombre / Razón Social"
                value={formatClientName(order.cliente)}
              />
              <DataField label="RUT" value={order.cliente?.rut || "No indicado"} />
              {order.cliente?.tipoCliente && (
                <DataField
                  label="Tipo Cliente"
                  value={<span className="capitalize">{order.cliente.tipoCliente}</span>}
                />
              )}
            </div>
          </div>

          {/* 2. Detalles de Fechas y Responsable */}
          <div className="space-y-3 rounded-xl border border-border p-4">
            <h4 className="flex items-center gap-1.5 font-bold text-foreground border-b border-border pb-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Fechas y Responsable
            </h4>

            {isEditing && canEdit ? (
              <div className="grid gap-4 sm:grid-cols-2 pt-1">
                {/* Mecánico Asignado editable */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                    Mecánico Asignado
                  </Label>
                  <Select
                    value={selectedMechanicId}
                    onValueChange={handleSaveMechanic}
                    disabled={isSavingMechanic}
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
                  <span className="text-[10px] text-muted-foreground block">
                    {isSavingMechanic ? "Guardando mecánico..." : "El cambio se guarda automáticamente al seleccionarlo."}
                  </span>
                </div>

                {/* Fecha Estimada de Entrega editable */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Fecha Estimada de Entrega</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={deliveryDateDraft}
                      onChange={(e) => setDeliveryDateDraft(e.target.value)}
                      className="h-9 text-xs"
                      disabled={isSavingDeliveryDate}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 text-xs cursor-pointer font-semibold"
                      onClick={handleSaveDeliveryDate}
                      disabled={isSavingDeliveryDate}
                    >
                      {isSavingDeliveryDate ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Reprogramar"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 sm:col-span-2 pt-2 border-t border-border/60">
                  <DataField
                    label="Fecha Recepción"
                    value={new Date(
                      order.fechaRecepcion || order.fechaCreacion || ""
                    ).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  />
                  <DataField
                    label="Fecha Entrega Real"
                    value={
                      order.fechaEntregaReal
                        ? new Date(order.fechaEntregaReal).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            timeZone: "UTC",
                          })
                        : "Pendiente de finalizar"
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <DataField
                  label="Fecha Recepción"
                  value={new Date(
                    order.fechaRecepcion || order.fechaCreacion || ""
                  ).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                />
                <DataField
                  label="Fecha Entrega Estimada"
                  value={new Date(order.fechaEntregaEstimada).toLocaleDateString(
                    "es-ES",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    }
                  )}
                />
                <DataField
                  label="Mecánico Asignado"
                  value={assignedMechanic?.nombre || "Sin mecánico asignado"}
                />
                <DataField
                  label="Fecha Entrega Real"
                  value={
                    order.fechaEntregaReal
                      ? new Date(order.fechaEntregaReal).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          timeZone: "UTC",
                        })
                      : "Pendiente de finalizar"
                  }
                />
                <DataField
                  label="Tiempo de Servicio"
                  value={
                    order.diasServicio != null
                      ? `${order.diasServicio} ${order.diasServicio === 1 ? "día" : "días"}`
                      : "Pendiente de entrega"
                  }
                />
              </div>
            )}
          </div>

          {/* 3. Trabajo a Realizar / Diagnóstico */}
          <div className="space-y-2 rounded-xl border border-border p-4">
            <h4 className="flex items-center gap-1.5 font-bold text-foreground border-b border-border pb-1.5">
              <FileText className="h-4 w-4 text-primary" />
              Descripción del Trabajo / Diagnóstico Técnico
            </h4>

            {isEditing && canEdit ? (
              <div className="space-y-2.5 pt-1">
                <Textarea
                  value={observationsDraft}
                  onChange={(e) => setObservationsDraft(e.target.value)}
                  placeholder="Detalla las observaciones de ingreso, fallas reportadas o diagnóstico técnico..."
                  className="min-h-24 text-xs resize-y bg-background"
                  disabled={isSavingObservations}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 gap-1.5 text-xs cursor-pointer font-semibold"
                    onClick={handleSaveObservations}
                    disabled={isSavingObservations}
                  >
                    {isSavingObservations ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Guardar Diagnóstico
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-foreground italic bg-background p-3 rounded-lg border border-border leading-relaxed">
                {order.observacionesIngreso || "No se especificaron observaciones adicionales."}
              </p>
            )}
          </div>

          {/* 4. Bicicletas */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 font-bold text-foreground">
              <Wrench className="h-4.5 w-4.5 text-primary" />
              Bicicletas ({order.bicicletas?.length || 0})
            </h4>

            <div className="space-y-3">
              {order.bicicletas?.map((bike) => (
                <div
                  key={bike.idBicicleta}
                  className="rounded-xl border border-border p-4 transition-colors duration-200 motion-reduce:transition-none"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-foreground">
                        {bike.marca} {bike.modelo}
                      </h5>
                      <p className="text-xs text-muted-foreground">
                        Color: <span className="font-medium text-foreground">{bike.color}</span>
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setOpenBikes((prev) => ({
                          ...prev,
                          [bike.idBicicleta]: !prev[bike.idBicicleta],
                        }))
                      }
                      className="h-8 text-xs cursor-pointer gap-1"
                    >
                      {openBikes[bike.idBicicleta] ? "Ocultar detalles" : "Ver detalles"}
                      {openBikes[bike.idBicicleta] ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  {openBikes[bike.idBicicleta] && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                      {bike.descripcion && (
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1">
                            Descripción / Estado inicial
                          </span>
                          <p className="text-xs italic bg-background p-2.5 rounded-lg border border-border">
                            {bike.descripcion}
                          </p>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            <ImageIcon className="h-3.5 w-3.5" />
                            Fotografías de Ingreso
                          </span>
                          {bike.imagenes?.length ? (
                            <span className="text-[10px] font-bold text-muted-foreground">
                              {bike.imagenes.length}{" "}
                              {bike.imagenes.length === 1 ? "fotografía" : "fotografías"}
                            </span>
                          ) : null}
                        </div>

                        {bike.imagenes?.length ? (
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() =>
                                setLightbox({
                                  images: bike.imagenes ?? [],
                                  index: 0,
                                  title: `${bike.marca} ${bike.modelo}`,
                                })
                              }
                              className="group relative block w-full max-w-lg aspect-video rounded-lg overflow-hidden border border-border bg-background cursor-pointer"
                            >
                              <img
                                src={bike.imagenes[0]}
                                alt={`${bike.marca} ${bike.modelo} - fotografía 1`}
                                className="object-cover w-full h-full"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-150 group-hover:bg-black/40 motion-reduce:transition-none">
                                <div className="rounded-full bg-black/60 p-3 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 motion-reduce:transition-none">
                                  <Maximize2 className="h-5 w-5" />
                                </div>
                              </div>
                            </button>

                            {bike.imagenes.length > 1 && (
                              <div className="flex gap-2 overflow-x-auto pb-1">
                                {bike.imagenes.map((image, imageIndex) => (
                                  <button
                                    key={`${image}-${imageIndex}`}
                                    type="button"
                                    onClick={() =>
                                      setLightbox({
                                        images: bike.imagenes ?? [],
                                        index: imageIndex,
                                        title: `${bike.marca} ${bike.modelo}`,
                                      })
                                    }
                                    className="group relative h-16 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border bg-background transition-colors duration-150 hover:border-primary motion-reduce:transition-none"
                                  >
                                    <img
                                      src={image}
                                      alt={`${bike.marca} ${bike.modelo} - fotografía ${imageIndex + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                      {imageIndex + 1}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background py-8 text-center">
                            <ImageIcon className="h-7 w-7 text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground">
                              No hay fotografías registradas
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Costos, Servicios e Insumos */}
          <div className="space-y-4 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <h4 className="flex items-center gap-1.5 font-bold text-foreground">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Detalle de Costos, Servicios e Insumos
              </h4>
            </div>

            {/* Agregar nuevo servicio en modo edición */}
            {isEditing && canEdit && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <PlusCircle className="h-4 w-4" />
                  Agregar Servicio Técnico a la Orden
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-8 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Servicio Técnico</Label>
                    <Select
                      value={selectedNewServiceId}
                      onValueChange={setSelectedNewServiceId}
                      disabled={isAddingService}
                    >
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue placeholder="Seleccionar servicio del catálogo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogServices.map((srv) => (
                          <SelectItem key={srv.idServicio} value={String(srv.idServicio)}>
                            {srv.nombre} — {formatCLP(srv.precioVenta)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Cantidad</Label>
                    <Input
                      type="number"
                      min={1}
                      value={newServiceQuantity}
                      onChange={(e) => setNewServiceQuantity(Math.max(1, Number(e.target.value)))}
                      className="h-9 text-xs bg-background"
                      disabled={isAddingService}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 w-full text-xs font-semibold cursor-pointer gap-1"
                      onClick={handleAddServiceToOrder}
                      disabled={isAddingService || !selectedNewServiceId}
                    >
                      {isAddingService ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PlusCircle className="h-3.5 w-3.5" />
                      )}
                      Agregar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Servicios Técnicos */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground block font-bold">
                Mano de Obra y Servicios Técnicos:
              </span>
              {serviceLines.length > 0 ? (
                <div className="space-y-2">
                  {serviceLines.map((line) =>
                    renderLineRow(
                      line,
                      line.servicio?.nombre || `Servicio Técnico #${line.idServicio}`
                    )
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic bg-background p-2.5 rounded-lg border border-border">
                  No se registran servicios técnicos cargados en esta orden.
                </p>
              )}
            </div>

            {/* Insumos y Repuestos */}
            {isEditing && canEdit && (
              <AddOrderProduct
                key={`${order.idOrdenDeTrabajo}-${productLines.map((line) => `${line.idLineaDeOrdenDeTrabajo}:${line.cantidad}`).join(",")}`}
                orderId={order.idOrdenDeTrabajo}
                lines={productLines}
                disabledReason={productDisabledReason}
                onAdded={() => {
                  window.dispatchEvent(new Event("work-orders:refresh"))
                  onEditSuccess?.()
                }}
              />
            )}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <span className="text-xs text-muted-foreground block font-bold">
                Insumos y Repuestos Utilizados:
              </span>
              {productLines.length > 0 ? (
                <div className="space-y-2">
                  {productLines.map((line) =>
                    renderLineRow(
                      line,
                      line.producto?.nombre || `Producto / Insumo #${line.idProducto}`
                    )
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic bg-background p-2.5 rounded-lg border border-border">
                  No se han cargado insumos o repuestos adicionales a esta orden.
                </p>
              )}
            </div>

            <Separator className="my-3" />

            {/* Resumen Económico */}
            <div className="space-y-3">
              {isEditing && canEdit && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-2.5 rounded-lg border border-border">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground block">
                      Descuento Global de la Orden
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Aplica un descuento general al subtotal de la orden.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      step={500}
                      value={descuentoDraft}
                      onChange={(e) => setDescuentoDraft(e.target.value)}
                      className="h-8 w-28 text-xs bg-background"
                      disabled={isSavingDescuento}
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 text-xs font-semibold cursor-pointer"
                      onClick={handleSaveDescuento}
                      disabled={isSavingDescuento}
                    >
                      {isSavingDescuento ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Aplicar"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div
                className={`grid grid-cols-2 gap-3 pt-1 ${
                  Number(order.descuento) > 0
                    ? "sm:grid-cols-3 lg:grid-cols-5"
                    : "sm:grid-cols-4"
                }`}
              >
                <DataField label="Total Repuestos" value={formatCLP(productsCost)} />
                <DataField label="Monto Servicio" value={formatCLP(laborCost)} />
                <DataField label="Monto Neto" value={formatCLP(montoNeto)} />
                {Number(order.descuento) > 0 && (
                  <DataField
                    label="Descuento global"
                    value={`−${formatCLP(Number(order.descuento))}`}
                  />
                )}
                <DataField
                  label="Monto Total"
                  value={
                    <span className="font-black text-primary">
                      {formatCLP(Number(order.total))}
                    </span>
                  }
                />
              </div>
            </div>
          </div>

          {/* 6. Historial de Pagos */}
          <div className="space-y-2 rounded-xl border border-border p-4">
            <h4 className="flex items-center gap-1.5 font-bold text-foreground border-b border-border pb-1.5">
              <Coins className="h-4 w-4 text-primary" />
              Estado de Pago e Historial
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-xs font-semibold tracking-tight mb-0.5">
                  Estado de Pago
                </span>
                <StatusBadge
                  status={
                    isPaid
                      ? "success"
                      : order.estadoPago === ESTADO_PAGO.PARCIAL
                        ? "info"
                        : "warning"
                  }
                  label={isPaid ? "Pagada" : getNombreEstadoPago(order.estadoPago)}
                  showDot={false}
                />
              </div>
              <div>
                <span className="text-muted-foreground block text-xs font-semibold tracking-tight mb-0.5">
                  Saldo Restante
                </span>
                <span
                  className={`text-sm font-bold ${
                    isPaid ? "text-primary" : "text-destructive"
                  }`}
                >
                  {formatCLP(isPaid ? 0 : Math.max(0, total - totalPagado))}
                </span>
              </div>
            </div>

            {order.pagos && order.pagos.length > 0 ? (
              <div className="mt-3 space-y-1.5 border-t border-dashed border-border pt-2 font-mono">
                <span className="text-xs font-semibold tracking-tight text-muted-foreground font-sans block mb-1">
                  Pagos Registrados:
                </span>
                {order.pagos.map((pago: WorkOrderPayment, idx: number) => (
                  <div
                    key={pago.idPago ? `pago-${pago.idPago}` : `pago-${idx}-${pago.fechaRegistro}`}
                    className="flex justify-between items-center text-xs bg-background p-2 rounded border border-border"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold block capitalize font-sans text-foreground">
                        Pago #{idx + 1} ({getNombreMetodoPago(pago.metodoPago)})
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(pago.fechaRegistro).toLocaleString("es-CL")}
                      </span>
                    </div>
                    <span className="font-bold text-primary">
                      +{formatCLP(Number(pago.monto))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic mt-2">
                No se registran pagos para esta orden.
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Pie de Acciones */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 shrink-0">
          <div>
            {!isPaid && !isEditing && onPayClick && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPayClick(order)}
                className="font-bold gap-1.5 cursor-pointer shadow-xs"
              >
                <Coins className="h-4 w-4" />
                Registrar Pago Restante
              </Button>
            )}

            {isEditing && canEdit && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelConfirm(true)}
                className="gap-1.5 cursor-pointer font-semibold"
              >
                <XCircle className="h-4 w-4" />
                Anular Orden
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPaid && !isEditing && onGenerateReceipt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateReceipt(order)}
                className="gap-1.5 cursor-pointer font-semibold text-primary"
              >
                <FileText className="h-4 w-4" />
                Generar Boleta
              </Button>
            )}

            {canEdit && (
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => onEditingChange(!isEditing)}
                className="gap-1.5 cursor-pointer font-semibold"
              >
                {isEditing ? (
                  <>
                    <Check className="h-4 w-4" />
                    Finalizar edición
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4" />
                    Editar orden
                  </>
                )}
              </Button>
            )}

            {isAdmin && onAuditClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAuditClick(order)}
                className="gap-1.5 cursor-pointer font-semibold"
              >
                <History className="h-4 w-4" />
                Ver auditoría
              </Button>
            )}

            {/* Exportar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer font-semibold">
                  <Download className="h-4 w-4" />
                  Exportar
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() => printWorkOrder(order)}
                >
                  <Printer className="h-4 w-4" />
                  Imprimir
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() => downloadWorkOrderPdf(order)}
                >
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() => {
                    const clientEmail = ""
                    const subject = encodeURIComponent(`Orden de Trabajo #${order.idOrdenDeTrabajo} - UrbanCycling`)
                    const body = encodeURIComponent(
                      [
                        `Estimado/a cliente,`,
                        ``,
                        `Le informamos el estado de su Orden de Trabajo #${order.idOrdenDeTrabajo}:`,
                        ``,
                        `  Estado: ${getNombreEstadoOtVisible(order.estadoOrden, order.fechaEntregaEstimada, order.estadoOrdenNombre)}`,
                        `  Entrega Estimada: ${new Date(order.fechaEntregaEstimada).toLocaleDateString("es-CL")}`,
                        `  Total: $${Number(order.total).toLocaleString("es-CL")}`,
                        ``,
                        `Ante cualquier consulta, no dude en contactarnos.`,
                        ``,
                        `Saludos,`,
                        `UrbanCycling`,
                      ].join("\n")
                    )
                    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Correo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Diálogo de Confirmación de Anulación */}
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-black text-destructive">
                <XCircle className="h-5 w-5" />
                Anular Orden de Trabajo
              </DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que deseas anular esta orden? Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Orden</span>
                  <span className="font-bold text-foreground">#{order.idOrdenDeTrabajo}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Estado actual</span>
                  <span className="font-bold text-foreground">
                    {getNombreEstadoOtVisible(
                      order.estadoOrden,
                      order.fechaEntregaEstimada,
                      order.estadoOrdenNombre
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={isCancellingOrder}
                  className="cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmCancelOrder}
                  disabled={isCancellingOrder}
                  className="font-bold cursor-pointer"
                >
                  {isCancellingOrder ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Anulando...
                    </span>
                  ) : (
                    "Confirmar Anulación"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Lightbox para Fotografías */}
        <Dialog
          open={lightbox !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) setLightbox(null)
          }}
        >
          <DialogContent className="flex max-h-[95vh] flex-col items-center gap-3 border-none bg-black/90 p-4 text-white sm:max-w-5xl [&_[data-slot=dialog-close]]:text-white">
            {lightbox && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-sm font-semibold text-white">
                    {lightbox.title} · {lightbox.index + 1} / {lightbox.images.length}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Fotografías de ingreso de la bicicleta
                  </DialogDescription>
                </DialogHeader>
                <div className="relative flex w-full items-center justify-center">
                  {lightbox.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => showImage(-1)}
                      className="absolute left-2 z-10 cursor-pointer rounded-full bg-white/10 p-3 text-white transition-colors duration-150 hover:bg-white/20 motion-reduce:transition-none"
                      aria-label="Fotografía anterior"
                    >
                      <ChevronLeft className="h-7 w-7" />
                    </button>
                  )}
                  <img
                    src={lightbox.images[lightbox.index]}
                    alt={`${lightbox.title} - fotografía ${lightbox.index + 1}`}
                    className="max-h-[80vh] max-w-full rounded-lg object-contain"
                  />
                  {lightbox.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => showImage(1)}
                      className="absolute right-2 z-10 cursor-pointer rounded-full bg-white/10 p-3 text-white transition-colors duration-150 hover:bg-white/20 motion-reduce:transition-none"
                      aria-label="Fotografía siguiente"
                    >
                      <ChevronRight className="h-7 w-7" />
                    </button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

function printWorkOrder(order: WorkOrder) {
  const iframeId = "__ot_print_frame__"
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null

  if (iframe) {
    iframe.remove()
  }

  const previouslyFocused = document.activeElement as HTMLElement | null

  iframe = document.createElement("iframe")
  iframe.id = iframeId
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  iframe.style.visibility = "hidden"
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) return

  const cleanup = () => {
    document.getElementById(iframeId)?.remove()
    document.body.style.pointerEvents = ""
    document.body.style.overflow = ""
    try {
      previouslyFocused?.focus()
    } catch {
      // Ignorar si el elemento ya no está
    }
  }

  let printed = false
  const triggerPrint = () => {
    if (printed) return
    printed = true
    try {
      const iframeWindow = iframe?.contentWindow
      if (!iframeWindow) return

      iframeWindow.addEventListener("afterprint", cleanup, { once: true })

      const onVisibility = () => {
        if (document.visibilityState === "visible") {
          document.removeEventListener("visibilitychange", onVisibility)
          cleanup()
        }
      }
      document.addEventListener("visibilitychange", onVisibility)

      setTimeout(() => {
        try {
          iframeWindow.focus()
          iframeWindow.print()
        } catch {
          cleanup()
        }
      }, 100)
    } catch (e) {
      console.error("[PRINT_ERROR]", e)
      cleanup()
    }
  }

  iframe.onload = triggerPrint

  doc.open()
  doc.write(buildWorkOrderHtml(order))
  doc.close()

  setTimeout(triggerPrint, 350)
  setTimeout(cleanup, 60000)
}

async function downloadWorkOrderPdf(order: WorkOrder) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ])

  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "-9999px"
  container.style.top = "0"
  container.style.width = "794px"
  container.style.background = "#ffffff"
  container.style.fontFamily = "Arial, sans-serif"
  container.innerHTML = buildWorkOrderContent(order)
  document.body.appendChild(container)

  try {
    await new Promise((resolve) => setTimeout(resolve, 80))

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 794,
    })

    const imgData = canvas.toDataURL("image/jpeg", 0.98)
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" })

    const pageWidth = 215.9
    const pageHeight = 279.4
    const margin = 10
    const contentWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * contentWidth) / canvas.width

    let yOffset = 0
    let isFirstPage = true

    while (yOffset < imgHeight) {
      if (!isFirstPage) pdf.addPage()
      isFirstPage = false

      pdf.addImage(
        imgData,
        "JPEG",
        margin,
        margin - (yOffset * pageHeight) / imgHeight,
        contentWidth,
        imgHeight,
      )
      yOffset += pageHeight - margin * 2
    }

    pdf.save(workOrderFileName(order))
  } catch (err) {
    console.error("[PDF_DOWNLOAD_ERROR]", err)
  } finally {
    container.remove()
  }
}
