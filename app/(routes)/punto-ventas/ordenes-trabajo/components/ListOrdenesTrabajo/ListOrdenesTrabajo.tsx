"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

import { KpiCards } from "./kpi-cards"
import { UpcomingDeadlines } from "./upcoming-deadlines"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { OrderDetailDialog } from "./OrderDetailDialog"
import { normalizarImagenesBicicleta } from "@/lib/bicycle-images"
import { OrderPayDialog } from "./OrderPayDialog"
import { ReceiptTicketDialog } from "./ReceiptTicketDialog"
import { RescheduleDialog } from "./RescheduleDialog"
import { CancelOrderDialog } from "./CancelOrderDialog"
import { AssignSuppliesDialog } from "./AssignSuppliesDialog"
import { OrderAuditDialog } from "./OrderAuditDialog"
import { ModifyServiceDialog } from "./ModifyServiceDialog"
import { WorkOrder } from "../../types"
import { ESTADO_PAGO } from "@/lib/payment-status"
import { ESTADO_OT, getNombreEstadoOt } from "@/lib/work-order-status"
import { adaptarOrdenPuntoVenta } from "@/lib/work-order-adapter"
import { METODO_PAGO_DEFECTO } from "@/lib/payment-methods"
import { useSearchDetailNavigation } from "@/hooks/use-search-detail-navigation"
import { toDateInputValue } from "@/lib/formatters"
import { printReceipt } from "@/lib/print-receipt"
import type { DocumentoTributario } from "@/app/(routes)/punto-ventas/ventas/types"

type PeriodFilter = {
  fechaInicio: string
  fechaFin: string
}

type PeriodErrors = Partial<Record<keyof PeriodFilter, string>>

export function ListOrdenesTrabajo() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderIdParam = searchParams.get("ordenId")
  const searchParam = searchParams.get("search") ?? ""
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [periodDraft, setPeriodDraft] = useState<PeriodFilter>({
    fechaInicio: "",
    fechaFin: "",
  })
  const [appliedPeriod, setAppliedPeriod] = useState<PeriodFilter | null>(null)
  const [periodErrors, setPeriodErrors] = useState<PeriodErrors>({})
  const [periodEmptyMessage, setPeriodEmptyMessage] = useState<string | null>(null)
  const [isFilteringByPeriod, setIsFilteringByPeriod] = useState(false)

  const {
    activeItem: selectedOrder,
    isOpen: openDetailsModal,
    openLocal: openOrderDetail,
    close: closeOrderDetail,
    setLocalItem: setSelectedOrder,
  } = useSearchDetailNavigation(orderIdParam, orders, (order) => order.idOrdenDeTrabajo)

  const [suppliesModalOpen, setSuppliesModalOpen] = useState(false)
  const [orderToAssignSupplies, setOrderToAssignSupplies] = useState<WorkOrder | null>(null)

  const [payModalOpen, setPayModalOpen] = useState(false)
  const [orderToPay, setOrderToPay] = useState<WorkOrder | null>(null)
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>(METODO_PAGO_DEFECTO)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)

  const [activeReceipt, setActiveReceipt] = useState<DocumentoTributario | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false)

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [orderToReschedule, setOrderToReschedule] = useState<WorkOrder | null>(null)
  const [newDeliveryDate, setNewDeliveryDate] = useState("")
  const [isRescheduling, setIsRescheduling] = useState(false)

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<WorkOrder | null>(null)
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)

  const [auditModalOpen, setAuditModalOpen] = useState(false)
  const [orderToAudit, setOrderToAudit] = useState<WorkOrder | null>(null)

  const [modifyServiceModalOpen, setModifyServiceModalOpen] = useState(false)
  const [orderToModifyService, setOrderToModifyService] = useState<WorkOrder | null>(null)

  const getOrders = useCallback(async (period: PeriodFilter | null): Promise<boolean> => {
    try {
      const searchParams = new URLSearchParams()

      if (period) {
        searchParams.set("fechaInicio", period.fechaInicio)
        searchParams.set("fechaFin", period.fechaFin)
      }

      const query = searchParams.size > 0 ? `?${searchParams.toString()}` : ""
      const response = await fetch(`/api/punto-venta${query}`, {
        cache: "no-store",
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        if (response.status === 404 && data?.code === "SIN_ORDENES_EN_PERIODO") {
          setOrders([])
          setPeriodEmptyMessage("No hay órdenes de trabajo dentro del período seleccionado.")
          return true
        }

        toast.error(data?.message || "No fue posible consultar las órdenes de trabajo.")
        return false
      }

      const ordenes = Array.isArray(data)
        ? data
          .filter((item) => item.tipoOperacion === "orden_trabajo")
          .map((item) => adaptarOrdenPuntoVenta(item))
          .filter((orden): orden is WorkOrder => Boolean(orden))
          .map((orden) => ({
            ...orden,
            bicicletas: (orden.bicicletas ?? []).map((bicicleta) => ({
              ...bicicleta,
              imagenes: normalizarImagenesBicicleta(bicicleta),
            })),
          }))
        : []

      setOrders(ordenes)
      setPeriodEmptyMessage(
        period && ordenes.length === 0
          ? "No hay órdenes de trabajo dentro del período seleccionado."
          : null,
      )
      return true
    } catch (err) {
      console.error("Error fetching work orders:", err)
      toast.error("No fue posible consultar las órdenes de trabajo.")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshOrders = useCallback(() => {
    void getOrders(appliedPeriod)
  }, [appliedPeriod, getOrders])

  useEffect(() => {
    // Difiere la carga inicial para evitar actualizaciones de estado síncronas durante el efecto.
    void Promise.resolve().then(() => getOrders(null))
  }, [getOrders])

  useEffect(() => {
    window.addEventListener("work-orders:refresh", refreshOrders)

    return () => {
      window.removeEventListener("work-orders:refresh", refreshOrders)
    }
  }, [refreshOrders])

  const updatePeriodField = (field: keyof PeriodFilter, value: string) => {
    setPeriodDraft((current) => ({ ...current, [field]: value }))
    setPeriodErrors((current) => ({ ...current, [field]: undefined }))
  }

  const applyPeriodFilter = async (): Promise<boolean> => {
    const errors: PeriodErrors = {}
    const { fechaInicio, fechaFin } = periodDraft

    if (!fechaInicio) errors.fechaInicio = "Selecciona la fecha de inicio."
    if (!fechaFin) errors.fechaFin = "Selecciona la fecha de fin."
    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      errors.fechaFin = "La fecha de fin debe ser posterior o igual a la fecha de inicio."
    }

    setPeriodErrors(errors)
    if (Object.keys(errors).length > 0) return false

    setIsFilteringByPeriod(true)
    try {
      const applied = await getOrders(periodDraft)
      if (applied) {
        setAppliedPeriod(periodDraft)
      }
      return applied
    } finally {
      setIsFilteringByPeriod(false)
    }
  }

  const clearPeriodFilter = async () => {
    setIsFilteringByPeriod(true)
    try {
      if (await getOrders(null)) {
        setPeriodDraft({ fechaInicio: "", fechaFin: "" })
        setPeriodErrors({})
        setPeriodEmptyMessage(null)
        setAppliedPeriod(null)
      }
    } finally {
      setIsFilteringByPeriod(false)
    }
  }

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/ordenes-trabajo/${orderId}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: nextStatus }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Error al actualizar estado")
      }

      toast.success(`Estado actualizado a "${getNombreEstadoOt(nextStatus)}" correctamente.`)

      if (selectedOrder && selectedOrder.idOrdenDeTrabajo === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          estadoOrden: nextStatus,
        })
      }

      refreshOrders()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo actualizar el estado.")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleAssignSuppliesClick = (order: WorkOrder) => {
    setOrderToAssignSupplies(order)
    setSuppliesModalOpen(true)
  }

  const handlePayClick = (order: WorkOrder) => {
    setOrderToPay(order)
    setSelectedMetodoPago(METODO_PAGO_DEFECTO)
    setPayModalOpen(true)
  }

  const handleRescheduleClick = (order: WorkOrder) => {
    setOrderToReschedule(order)
    setNewDeliveryDate(toDateInputValue(order.fechaEntregaEstimada))
    setRescheduleModalOpen(true)
  }

  const handleCancelClick = (order: WorkOrder) => {
    setOrderToCancel(order)
    setCancelModalOpen(true)
  }

  const handleAuditClick = (order: WorkOrder) => {
    setOrderToAudit(order)
    setAuditModalOpen(true)
  }

  const handleModifyServiceClick = (order: WorkOrder) => {
    setOrderToModifyService(order)
    setModifyServiceModalOpen(true)
  }

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return

    setIsCancellingOrder(true)

    try {
      const res = await fetch(`/api/punto-venta/orden-${orderToCancel.idOrdenDeTrabajo}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: ESTADO_OT.ANULADA }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(
          err.code === "ANULACION_NO_PERMITIDA"
            ? "No es posible anular esta orden"
            : err.message || "No se pudo anular la orden"
        )
        return
      }

      toast.success("Orden de trabajo anulada correctamente.")

      if (selectedOrder?.idOrdenDeTrabajo === orderToCancel.idOrdenDeTrabajo) {
        setSelectedOrder({
          ...selectedOrder,
          estadoOrden: ESTADO_OT.ANULADA,
        })
      }

      setCancelModalOpen(false)
      setOrderToCancel(null)
      refreshOrders()
      router.refresh()
    } catch {
      toast.error("No se pudo anular la orden")
    } finally {
      setIsCancellingOrder(false)
    }
  }

  const handleConfirmReschedule = async () => {
    if (!orderToReschedule) return

    if (!newDeliveryDate) {
      toast.error("Debe ingresar una fecha estimada de entrega")
      return
    }

    setIsRescheduling(true)

    try {
      const res = await fetch(`/api/punto-venta/orden-${orderToReschedule.idOrdenDeTrabajo}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fechaEntregaEstimada: newDeliveryDate,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.message || "No se pudo reprogramar la entrega")
        return
      }

      toast.success("Fecha estimada de entrega actualizada correctamente.")

      if (selectedOrder?.idOrdenDeTrabajo === orderToReschedule.idOrdenDeTrabajo) {
        setSelectedOrder({
          ...selectedOrder,
          fechaEntregaEstimada: newDeliveryDate,
        })
      }

      setRescheduleModalOpen(false)
      setOrderToReschedule(null)
      refreshOrders()
      router.refresh()
    } catch {
      toast.error("No se pudo reprogramar la entrega")
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!orderToPay) return
    setIsConfirmingPayment(true)
    try {
      const total = Number(orderToPay.total)
      const totalPagado = Number(orderToPay.totalPagado || 0)
      const saldoRestante = Math.max(0, total - totalPagado)

      const res = await fetch(`/api/punto-venta/orden-${orderToPay.idOrdenDeTrabajo}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estadoPago: ESTADO_PAGO.PAGADA,
          metodoPago: selectedMetodoPago,
          montoPago: saldoRestante,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Error al registrar el pago restante")
      }

      toast.success("Pago registrado correctamente. La orden ahora está Pagada.")
      setPayModalOpen(false)
      closeOrderDetail()
      refreshOrders()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo procesar el pago restante")
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  const handleViewDetails = (order: WorkOrder) => {
    openOrderDetail(order)
  }

  const handleGenerateReceipt = async (order: WorkOrder) => {
    setIsGeneratingReceipt(true)
    try {
      const res = await fetch("/api/documentos-tributarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origen: "orden-trabajo",
          idOrdenDeTrabajo: order.idOrdenDeTrabajo,
          tipoDte: 39,
        }),
      })

      if (res.status === 201 || res.status === 409) {
        const data = await res.json()
        setActiveReceipt(data.documentoTributario)
        setSelectedOrder(order)
        setReceiptModalOpen(true)
      } else {
        const errorData = await res.json()
        throw new Error(errorData.message || "Error al generar la boleta")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo generar la boleta.")
    } finally {
      setIsGeneratingReceipt(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={`skeleton-kpi-${index}`} className="h-24 rounded-xl motion-reduce:animate-none" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl motion-reduce:animate-none" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150 motion-reduce:animate-none">
      {/* 1. Panel de KPIs */}
      <KpiCards orders={orders} />
      {/* 2. Tabla Principal de Órdenes */}
      <DataTable
        columns={columns}
        data={orders}
        periodFilter={{
          draft: periodDraft,
          errors: periodErrors,
          applied: appliedPeriod,
          isApplying: isFilteringByPeriod,
          onChange: updatePeriodField,
          onApply: applyPeriodFilter,
          onClear: clearPeriodFilter,
        }}
        emptyState={
          periodEmptyMessage
            ? {
                title: "Sin órdenes en este período",
                description: periodEmptyMessage,
              }
            : undefined
        }
        initialSearch={searchParam}
        onViewDetails={handleViewDetails}
        onStatusChange={handleStatusChange}
        updatingId={updatingId}
        onPayClick={handlePayClick}
        onGenerateReceipt={handleGenerateReceipt}
        onRescheduleClick={handleRescheduleClick}
        onCancelClick={handleCancelClick}
        onAssignSuppliesClick={handleAssignSuppliesClick}
        onAuditClick={handleAuditClick}
        onModifyServiceClick={handleModifyServiceClick}
      />

      <UpcomingDeadlines orders={orders} onViewDetails={handleViewDetails} />

      {/* 3. Próximos Vencimientos */}
      {/* 4. Modal de Detalle */}
      <OrderDetailDialog
        open={openDetailsModal}
        onOpenChange={(open) => {
          if (!open) {
            closeOrderDetail()
          }
          if (!open && orderIdParam) {
            router.replace("/punto-ventas/ordenes-trabajo", { scroll: false })
          }
        }}
        order={selectedOrder}
        onPayClick={handlePayClick}
        onGenerateReceipt={handleGenerateReceipt}
        onAssignSuppliesClick={handleAssignSuppliesClick}
        onAuditClick={handleAuditClick}
        onModifyServiceClick={handleModifyServiceClick}
      />

      {/* 4.5. Modal de Asignación de Insumos y Valorización */}
      <AssignSuppliesDialog
        open={suppliesModalOpen}
        onOpenChange={setSuppliesModalOpen}
        order={orderToAssignSupplies}
        onSuccess={() => {
          refreshOrders()
          router.refresh()
        }}
      />

      {/* 5. Modal de Pago Restante */}
      <OrderPayDialog
        open={payModalOpen}
        onOpenChange={setPayModalOpen}
        order={orderToPay}
        selectedMetodoPago={selectedMetodoPago}
        onMetodoPagoChange={setSelectedMetodoPago}
        onConfirmPayment={handleConfirmPayment}
        isConfirmingPayment={isConfirmingPayment}
      />

      {/* 6. Modal de Comprobante / DTE */}
      <ReceiptTicketDialog
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        activeReceipt={activeReceipt}
        onPrint={() => {
          if (!activeReceipt) return
          const client = selectedOrder?.cliente
          printReceipt({
            dte: activeReceipt,
            clientLabel: client
              ? client.razonSocial || `${client.primerNombre || ""} ${client.apellidoPaterno || ""}`.trim()
              : "Cliente General",
            clientRut: client?.rut,
            lines: selectedOrder?.lineasDeOrdenDeTrabajo || [],
            detailLabel: "DETALLE DE COMPRA / SERVICIO:",
            lineFallback: "Servicio/Producto",
            thanksMessage: "¡Gracias por su preferencia en Urban Cycling!",
            onError: () => toast.error("No se pudo preparar la impresión."),
          })
        }}
        isGeneratingReceipt={isGeneratingReceipt}
      />

      {/* 7. Modal de Reprogramación de Entrega */}
      <RescheduleDialog
        open={rescheduleModalOpen}
        onOpenChange={setRescheduleModalOpen}
        order={orderToReschedule}
        newDeliveryDate={newDeliveryDate}
        onNewDeliveryDateChange={setNewDeliveryDate}
        onConfirmReschedule={handleConfirmReschedule}
        isRescheduling={isRescheduling}
      />

      {/* 8. Modal de Confirmación de Anulación */}
      <CancelOrderDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        order={orderToCancel}
        onConfirmCancel={handleConfirmCancelOrder}
        isCancelling={isCancellingOrder}
      />

      {/* 9. Modal de Historial de Auditoría */}
      <OrderAuditDialog
        open={auditModalOpen}
        onOpenChange={setAuditModalOpen}
        order={orderToAudit}
      />

      {/* 10. Modal de Modificación de Servicio */}
      <ModifyServiceDialog
        open={modifyServiceModalOpen}
        onOpenChange={setModifyServiceModalOpen}
        order={orderToModifyService}
        onSuccess={() => {
          refreshOrders()
          router.refresh()
        }}
      />
    </div>
  )
}
