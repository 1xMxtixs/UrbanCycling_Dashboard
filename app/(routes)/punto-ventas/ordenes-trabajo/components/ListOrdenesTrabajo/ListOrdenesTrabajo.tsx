"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

import { KpiCards } from "./kpi-cards"
import { UpcomingDeadlines } from "./upcoming-deadlines"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { OrderDetailDialog } from "./OrderDetailDialog"
import { OrderPayDialog } from "./OrderPayDialog"
import { ReceiptTicketDialog } from "./ReceiptTicketDialog"
import { RescheduleDialog } from "./RescheduleDialog"
import { CancelOrderDialog } from "./CancelOrderDialog"
import { WorkOrder } from "../../types"

function toDateInputValue(dateInput: string | Date | null | undefined) {
  if (!dateInput) return ""

  if (typeof dateInput === "string") {
    return dateInput.split("T")[0] ?? ""
  }

  return dateInput.toISOString().split("T")[0] ?? ""
}

export function ListOrdenesTrabajo() {
  const router = useRouter()
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [openDetailsModal, setOpenDetailsModal] = useState(false)

  const [payModalOpen, setPayModalOpen] = useState(false)
  const [orderToPay, setOrderToPay] = useState<WorkOrder | null>(null)
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>("efectivo")
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)

  const [activeReceipt, setActiveReceipt] = useState<any | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false)

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [orderToReschedule, setOrderToReschedule] = useState<WorkOrder | null>(null)
  const [newDeliveryDate, setNewDeliveryDate] = useState("")
  const [isRescheduling, setIsRescheduling] = useState(false)

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<WorkOrder | null>(null)
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)

  const getOrders = async () => {
    try {
      const response = await fetch("/api/punto-venta", {
        cache: "no-store",
      })

      if (!response.ok) {
        setOrders([])
        return
      }

      const data = await response.json()
      const ordenes = Array.isArray(data)
        ? data
          .filter((item) => item.tipoOperacion === "orden_trabajo")
          .map((item) => item.ordenTrabajo)
          .filter(Boolean)
        : []

      setOrders(ordenes)
    } catch (err) {
      console.error("Error fetching work orders:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getOrders()
    window.addEventListener("work-orders:refresh", getOrders)

    return () => {
      window.removeEventListener("work-orders:refresh", getOrders)
    }
  }, [])

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/ordenes-trabajo/${orderId}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estadoOrden: nextStatus }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Error al actualizar estado")
      }

      toast.success(`Estado actualizado a "${nextStatus}" correctamente.`)

      if (selectedOrder && selectedOrder.idOrdenDeTrabajo === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          estadoOrden: nextStatus,
        })
      }

      getOrders()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo actualizar el estado.")
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePayClick = (order: WorkOrder) => {
    setOrderToPay(order)
    setSelectedMetodoPago("efectivo")
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

  const handleConfirmCancelOrder = async () => {
    if (!orderToCancel) return

    setIsCancellingOrder(true)

    try {
      const res = await fetch(`/api/punto-venta/orden-${orderToCancel.idOrdenDeTrabajo}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: "Anulada" }),
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
          estadoOrden: "Anulada",
        })
      }

      setCancelModalOpen(false)
      setOrderToCancel(null)
      getOrders()
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
      getOrders()
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
          estadoPago: "pagada",
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
      setOpenDetailsModal(false)
      getOrders()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo procesar el pago restante")
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  const handleViewDetails = (order: WorkOrder) => {
    setSelectedOrder(order)
    setOpenDetailsModal(true)
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

  const handlePrintReceipt = (dte: any, order: WorkOrder | null) => {
    const printWindow = window.open("", "_blank", "width=400,height=600")
    if (!printWindow) {
      toast.error("Por favor, permite las ventanas emergentes para imprimir.")
      return
    }

    const clientLabel = order?.cliente
      ? order.cliente.razonSocial || `${order.cliente.primerNombre || ""} ${order.cliente.apellidoPaterno || ""}`.trim()
      : "Cliente General"
    const lineas = order?.lineasDeOrdenDeTrabajo || []

    const content = `
      <html>
        <head>
          <title>Comprobante de Compra N° ${dte.numeroFolio}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 20px;
              max-width: 300px;
              margin: 0 auto;
              font-size: 12px;
              color: #000;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .flex { display: flex; justify-content: space-between; }
            .header-title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .receipt-title { font-size: 14px; font-weight: bold; margin: 15px 0 5px 0; }
            .footer { font-size: 10px; margin-top: 25px; text-align: center; color: #555; }
          </style>
        </head>
        <body>
          <div class="text-center header-title">URBAN CYCLING</div>
          <div class="text-center">Giro: Venta y Servicio de Bicicletas</div>
          <div class="text-center">RUT Emisor: ${dte.rutEmisor}</div>
          <div class="divider"></div>
          
          <div class="text-center receipt-title">COMPROBANTE DE COMPRA</div>
          <div class="text-center bold">N° Folio: ${dte.numeroFolio}</div>
          <div class="divider"></div>
          
          <div>Fecha Emisión: ${new Date(dte.fechaEmision).toLocaleDateString("es-CL")}</div>
          <div>Cliente: ${clientLabel}</div>
          ${order?.cliente?.rut ? `<div>RUT Receptor: ${order.cliente.rut}</div>` : ""}
          <div class="divider"></div>
          
          <div class="bold" style="margin-bottom: 5px;">DETALLE DE COMPRA / SERVICIO:</div>
          ${lineas.map((line: any) => `
            <div class="flex">
              <span>${line.cantidad}x ${line.servicio?.nombre || line.producto?.nombre || "Servicio/Producto"}</span>
              <span>$${(line.cantidad * Number(line.precioUnitario)).toLocaleString("es-CL")}</span>
            </div>
          `).join("")}
          
          <div class="divider"></div>
          
          <div class="flex">
            <span>Neto:</span>
            <span>$${Number(dte.montoNeto).toLocaleString("es-CL")}</span>
          </div>
          <div class="flex">
            <span>IVA (19%):</span>
            <span>$${Number(dte.montoIva).toLocaleString("es-CL")}</span>
          </div>
          <div class="flex bold" style="font-size: 13px; margin-top: 5px;">
            <span>TOTAL:</span>
            <span>$${Number(dte.montoTotal).toLocaleString("es-CL")}</span>
          </div>
          
          <div class="divider"></div>
          <div class="footer">
            ESTE DOCUMENTO ES UN COMPROBANTE INTERNO DE COMPRA.<br>
            ¡Gracias por su preferencia en Urban Cycling!
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(content)
    printWindow.document.close()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Panel de KPIs */}
      <KpiCards orders={orders} />

      {/* 2. Tabla Principal de Órdenes */}
      <DataTable
        columns={columns}
        data={orders}
        onViewDetails={handleViewDetails}
        onStatusChange={handleStatusChange}
        updatingId={updatingId}
        onPayClick={handlePayClick}
        onGenerateReceipt={handleGenerateReceipt}
        onRescheduleClick={handleRescheduleClick}
        onCancelClick={handleCancelClick}
      />

      {/* 3. Próximos Vencimientos */}
      <UpcomingDeadlines orders={orders} />

      {/* 4. Modal de Detalle */}
      <OrderDetailDialog
        open={openDetailsModal}
        onOpenChange={setOpenDetailsModal}
        order={selectedOrder}
        onPayClick={handlePayClick}
        onRescheduleClick={handleRescheduleClick}
        onCancelClick={handleCancelClick}
        onStatusChange={handleStatusChange}
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
        onPrint={() => handlePrintReceipt(activeReceipt, selectedOrder)}
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
    </div>
  )
}
