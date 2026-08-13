"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/sonner"
import { 
  Loader2, 
  User, 
  Calendar, 
  CalendarClock,
  FileText, 
  Clock, 
  Wrench,
  ChevronDown,
  ShoppingBag,
  Coins
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { KpiCards, type WorkOrder } from "./kpi-cards"
import { UpcomingDeadlines } from "./upcoming-deadlines"
import { DataTable } from "./data-table"
import { columns } from "./columns"

function getAvailableTransitions(currentStatus: string) {
  const map: Record<string, string[]> = {
    "Por realizar": ["En curso", "En espera"],
    "En curso": ["Listo para entregar", "En espera"],
    "En espera": ["En curso", "Listo para entregar"],
    "Listo para entregar": ["Entregado", "En curso"],
    "Entregado": [],
  }
  return map[currentStatus] || []
}

function formatDocDate(dateInput: any) {
  if (!dateInput) return "";
  let dateStr = "";
  if (typeof dateInput === "string") {
    dateStr = dateInput;
  } else if (dateInput instanceof Date) {
    const day = String(dateInput.getDate()).padStart(2, "0");
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const year = dateInput.getFullYear();
    return `${day}-${month}-${year}`;
  } else {
    dateStr = new Date(dateInput).toISOString();
  }
  const datePart = dateStr.split("T")[0];
  const parts = datePart.split("-");
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
}

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
      const res = await fetch(`/api/punto-venta/orden-${orderId}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: nextStatus }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Error al actualizar estado")
      }

      toast.success(`Estado actualizado a "${nextStatus}" correctamente.`)
      
      if (selectedOrder && selectedOrder.idOrdenDeTrabajo === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          estadoOrden: nextStatus,
          fechaEntregaReal: ["Listo para entregar", "Entregado"].includes(nextStatus)
            ? new Date().toISOString()
            : selectedOrder.fechaEntregaReal
        })
      }

      getOrders()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo cambiar el estado de la orden")
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
    const saldoPendiente = Math.max(0, Number(orderToPay.total) - Number(orderToPay.totalPagado || 0))
    try {
      const res = await fetch(`/api/punto-venta/orden-${orderToPay.idOrdenDeTrabajo}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estadoPago: "pagada",
          metodoPago: selectedMetodoPago,
          monto: saldoPendiente,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Error al registrar pago restante")
      }

      toast.success("Pago registrado correctamente. Orden saldada.")
      setPayModalOpen(false)
      setOpenDetailsModal(false)
      getOrders()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo registrar el pago restante")
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
      ? order.cliente.razonSocial
        ? order.cliente.razonSocial
        : `${order.cliente.primerNombre || ""} ${order.cliente.apellidoPaterno || ""}`.trim()
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
          
          <div>Fecha Emisión: ${formatDocDate(dte.fechaEmision)}</div>
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

  const renderStatusBadge = (order: WorkOrder) => {
    const isFullyCompleted = ["Listo para entregar", "Entregado"].includes(order.estadoOrden)
    const dEstimada = new Date(order.fechaEntregaEstimada)
    const localEndDay = new Date(
      dEstimada.getUTCFullYear(),
      dEstimada.getUTCMonth(),
      dEstimada.getUTCDate(),
      23,
      59,
      59,
      999
    )
    const isDelayed = localEndDay < new Date() && !isFullyCompleted
    
    if (isDelayed) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-705 dark:text-red-400 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          Retrasada
        </span>
      )
    }

    switch (order.estadoOrden) {
      case "Por realizar":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350 px-2.5 py-0.5 text-xs font-semibold">
            Por realizar
          </span>
        )
      case "En curso":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
            Activa
          </span>
        )
      case "En espera":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-255 dark:border-yellow-800 text-yellow-750 dark:text-yellow-450 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
            En Espera
          </span>
        )
      case "Listo para entregar":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
            Por Entregar
          </span>
        )
      case "Entregado":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
            Completada
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-semibold">
            {order.estadoOrden}
          </span>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-75 gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 p-8 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">Cargando órdenes de trabajo...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Panel de KPIs */}
      <KpiCards orders={orders} />

      {/* 2. Tabla Principal de Órdenes usando TanStack Table */}
      <DataTable 
        columns={columns} 
        data={orders}
        onViewDetails={handleViewDetails}
        onStatusChange={handleStatusChange}
        updatingId={updatingId}
        onPayClick={handlePayClick}
        onGenerateReceipt={handleGenerateReceipt}
        onRescheduleClick={handleRescheduleClick}
      />

      {/* 3. Sección Inferior: Próximos Vencimientos */}
      <UpcomingDeadlines orders={orders} />

      {/* ── Modal de Detalle (Slide-over/Dialog) ────────────────── */}
      <Dialog open={openDetailsModal} onOpenChange={setOpenDetailsModal}>
        <DialogContent className="sm:max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
          {selectedOrder && (() => {
            const laborCost = (selectedOrder.lineasDeOrdenDeTrabajo || [])
              .filter(l => l.idServicio !== null)
              .reduce((sum, l) => sum + Number(l.precioUnitario), 0);
            
            const productLines = (selectedOrder.lineasDeOrdenDeTrabajo || [])
              .filter(l => l.idProducto !== null);
              
            const productsCost = productLines
              .reduce((sum, l) => sum + (l.cantidad * Number(l.precioUnitario)), 0);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 text-xl font-black">
                    <span>Orden de Trabajo #{selectedOrder.idOrdenDeTrabajo}</span>
                    <div className="mr-6">{renderStatusBadge(selectedOrder)}</div>
                  </DialogTitle>
                  <DialogDescription>
                    Detalles completos de la orden cargada en el sistema
                  </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-5 text-sm">
                  {/* 1. Datos Cliente */}
                  <div className="space-y-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 p-4">
                    <h4 className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <User className="h-4 w-4 text-primary" />
                      Información del Cliente
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-xs text-muted-foreground block">Nombre / Razón Social</span>
                        <span className="font-semibold text-slate-805 dark:text-slate-200">
                          {selectedOrder.cliente?.razonSocial || 
                            `${selectedOrder.cliente?.primerNombre} ${selectedOrder.cliente?.segundoNombre || ""} ${selectedOrder.cliente?.apellidoPaterno || ""}`.trim()}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">RUT</span>
                        <span className="font-semibold text-slate-805 dark:text-slate-200">
                          {selectedOrder.cliente?.rut || "No indicado"}
                        </span>
                      </div>
                      {selectedOrder.cliente?.tipoCliente && (
                        <div>
                          <span className="text-xs text-muted-foreground block">Tipo Cliente</span>
                          <span className="font-semibold capitalize text-slate-805 dark:text-slate-200">
                            {selectedOrder.cliente.tipoCliente}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Detalles de Fechas */}
                  <div className="space-y-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 p-4">
                    <h4 className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <Calendar className="h-4 w-4 text-primary" />
                      Fechas y Registro
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <span className="text-xs text-muted-foreground block">Fecha Recepción</span>
                        <span className="font-semibold text-slate-850 dark:text-slate-250">
                          {new Date(selectedOrder.fechaRecepcion || selectedOrder.fechaCreacion || "").toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            timeZone: "UTC",
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Fecha Entrega Estimada</span>
                        <span className="font-semibold text-slate-850 dark:text-slate-250">
                          {new Date(selectedOrder.fechaEntregaEstimada).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            timeZone: "UTC",
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Fecha Entrega Real</span>
                        <span className="font-semibold text-slate-850 dark:text-slate-250">
                          {selectedOrder.fechaEntregaReal
                            ? new Date(selectedOrder.fechaEntregaReal).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                timeZone: "UTC",
                              })
                            : "Pendiente de finalizar"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Trabajo a Realizar */}
                  <div className="space-y-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 p-4">
                    <h4 className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                      Descripción del Trabajo
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850 leading-relaxed">
                      {selectedOrder.observacionesIngreso || "No se especificaron observaciones adicionales."}
                    </p>
                  </div>

                  {/* 3.5. Costos y Repuestos */}
                  <div className="space-y-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 p-4">
                    <h4 className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      Detalle de Costos y Repuestos
                    </h4>

                    {productLines.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground block font-bold">Repuestos / Productos Usados:</span>
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <th className="px-3 py-2">Producto</th>
                                <th className="px-3 py-2 text-center">Cant</th>
                                <th className="px-3 py-2 text-right">Precio Unit.</th>
                                <th className="px-3 py-2 text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {productLines.map((line) => {
                                const subtotal = line.cantidad * Number(line.precioUnitario)
                                return (
                                  <tr key={line.idLineaDeOrdenDeTrabajo}>
                                    <td className="px-3 py-2 font-medium">
                                      {line.producto?.nombre || `Producto #${line.idProducto}`}
                                    </td>
                                    <td className="px-3 py-2 text-center font-bold">
                                      {line.cantidad}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      ${Number(line.precioUnitario).toLocaleString("es-CL")}
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold text-slate-800 dark:text-slate-200">
                                      ${subtotal.toLocaleString("es-CL")}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div className="grid gap-3 grid-cols-3 pt-4 border-t border-slate-200/50 dark:border-slate-800 mt-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Total Repuestos
                        </Label>
                        <Input
                          type="text"
                          readOnly
                          disabled
                          value={`$${productsCost.toLocaleString("es-CL")}`}
                          className="h-8.5 text-xs bg-slate-100/50 dark:bg-slate-800/50 font-semibold cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Monto Servicio
                        </Label>
                        <Input
                          type="text"
                          readOnly
                          disabled
                          value={`$${laborCost.toLocaleString("es-CL")}`}
                          className="h-8.5 text-xs bg-slate-100/50 dark:bg-slate-800/50 font-semibold cursor-not-allowed"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-primary tracking-wider">
                          Monto Total
                        </Label>
                        <Input
                          type="text"
                          readOnly
                          disabled
                          value={`$${Number(selectedOrder.total).toLocaleString("es-CL")}`}
                          className="h-8.5 text-xs border-primary/30 bg-primary/5 dark:bg-primary/10 font-bold text-primary cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3.6. Historial de Pagos */}
                  <div className="space-y-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850 p-4">
                    <h4 className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <Coins className="h-4 w-4 text-primary" />
                      Estado de Pago e Historial
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-0.5">Estado de Pago</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          selectedOrder.estadoPago?.toLowerCase() === "pagada" || selectedOrder.estadoPago?.toLowerCase() === "pagado"
                            ? "bg-green-55 border border-green-200 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400"
                            : selectedOrder.estadoPago?.toLowerCase() === "abono"
                              ? "bg-blue-55 border border-blue-200 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400"
                              : "bg-yellow-50 border border-yellow-250 text-yellow-750 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-450"
                        }`}>
                          {selectedOrder.estadoPago?.toLowerCase() === "pagada" || selectedOrder.estadoPago?.toLowerCase() === "pagado" ? "Pagada" : selectedOrder.estadoPago}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-0.5">Saldo Restante</span>
                        <span className={`font-bold text-sm ${
                          (selectedOrder.estadoPago?.toLowerCase() === "pagada" || selectedOrder.estadoPago?.toLowerCase() === "pagado")
                            ? "text-green-600 dark:text-green-400"
                            : (Number(selectedOrder.total) - Number(selectedOrder.totalPagado || 0)) > 0
                              ? "text-red-500"
                              : "text-green-600 dark:text-green-400"
                        }`}>
                          $
                          {(selectedOrder.estadoPago?.toLowerCase() === "pagada" || selectedOrder.estadoPago?.toLowerCase() === "pagado"
                            ? 0
                            : Math.max(0, Number(selectedOrder.total) - Number(selectedOrder.totalPagado || 0))
                          ).toLocaleString("es-CL")}
                        </span>
                      </div>
                    </div>

                    {selectedOrder.pagos && selectedOrder.pagos.length > 0 ? (
                      <div className="mt-3 space-y-1.5 border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 font-mono">
                        <span className="text-[10px] text-muted-foreground font-sans uppercase font-bold block mb-1">Pagos Registrados:</span>
                        {selectedOrder.pagos.map((pago: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800">
                            <div className="space-y-0.5">
                              <span className="font-semibold block capitalize font-sans">Pago #{idx + 1} ({pago.metodoPago})</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(pago.fechaRegistro).toLocaleString("es-CL")}</span>
                            </div>
                            <span className="font-bold text-green-600 dark:text-green-400">
                              +${Number(pago.monto).toLocaleString("es-CL")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic mt-2">No se registran pagos para esta orden.</p>
                    )}
                  </div>

                  {/* 4. Bicicletas */}
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                      <Wrench className="h-4.5 w-4.5 text-primary" />
                      Bicicletas ({selectedOrder.bicicletas?.length || 0})
                    </h4>

                    <div className="space-y-3">
                      {selectedOrder.bicicletas?.map((bike) => (
                        <div
                          key={bike.idBicicleta}
                          className="flex flex-col sm:flex-row gap-4 border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/20 p-3.5 rounded-xl"
                        >
                          {bike.imagenUrl && (
                            <div className="relative h-28 w-full sm:w-28 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-850 bg-white">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={bike.imagenUrl}
                                alt={`${bike.marca} ${bike.modelo}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 space-y-1.5">
                            <h5 className="font-bold text-slate-900 dark:text-white text-base">
                              {bike.marca} {bike.modelo}
                            </h5>
                            <div className="grid gap-2 sm:grid-cols-2 text-xs text-slate-600 dark:text-slate-350">
                              <div>
                                <span className="text-muted-foreground font-semibold">Color:</span> {bike.color}
                              </div>
                              {bike.descripcion && (
                                <div className="sm:col-span-2 mt-1 p-2 rounded bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850">
                                  <span className="text-muted-foreground font-bold block mb-0.5">Observación:</span>
                                  {bike.descripcion}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Acciones en el pie del Modal */}
                <div className="flex justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div>
                    {selectedOrder.estadoPago?.toLowerCase() !== "pagada" && selectedOrder.estadoPago?.toLowerCase() !== "pagado" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePayClick(selectedOrder)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                      >
                        <Coins className="h-4 w-4 mr-1.5" />
                        Registrar Pago Restante
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleRescheduleClick(selectedOrder)}
                      className="gap-1.5"
                    >
                      <CalendarClock className="h-4 w-4" />
                      Reprogramar
                    </Button>
                    <Button variant="outline" onClick={() => setOpenDetailsModal(false)}>
                      Cerrar
                    </Button>
                    {getAvailableTransitions(selectedOrder.estadoOrden).length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="flex items-center gap-1">
                            Mover Estado
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {getAvailableTransitions(selectedOrder.estadoOrden).map((nextState) => (
                            <DropdownMenuItem
                              key={nextState}
                              onClick={() =>
                                handleStatusChange(selectedOrder.idOrdenDeTrabajo, nextState)
                              }
                              className="cursor-pointer font-semibold text-xs"
                            >
                              Mover a: <strong className="ml-1 text-primary">{nextState}</strong>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal de Reprogramacion de Entrega */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-amber-700 dark:text-amber-400">
              <CalendarClock className="h-5 w-5" />
              Reprogramar Entrega
            </DialogTitle>
            <DialogDescription>
              Actualiza la fecha estimada comprometida para la orden seleccionada.
            </DialogDescription>
          </DialogHeader>

          {orderToReschedule && (
            <div className="space-y-4 py-3">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 border p-3 text-xs space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Orden</span>
                  <span className="font-bold">#{orderToReschedule.idOrdenDeTrabajo}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Fecha de ingreso</span>
                  <span className="font-bold">
                    {new Date(orderToReschedule.fechaRecepcion || orderToReschedule.fechaCreacion || "").toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Fecha estimada actual</span>
                  <span className="font-bold">
                    {new Date(orderToReschedule.fechaEntregaEstimada).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nuevaFechaEntrega" className="text-xs font-bold text-slate-700">
                  Nueva Fecha Estimada de Entrega
                </Label>
                <Input
                  id="nuevaFechaEntrega"
                  type="date"
                  value={newDeliveryDate}
                  min={toDateInputValue(orderToReschedule.fechaRecepcion || orderToReschedule.fechaCreacion)}
                  onChange={(event) => setNewDeliveryDate(event.target.value)}
                  disabled={isRescheduling}
                  className="h-10"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRescheduleModalOpen(false)}
                  disabled={isRescheduling}
                >
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirmReschedule}
                  disabled={isRescheduling}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {isRescheduling ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    "Guardar Reprogramacion"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Pago Restante */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-green-600 dark:text-green-400">
              <Coins className="h-5 w-5" />
              Confirmar Registro de Pago Restante
            </DialogTitle>
            <DialogDescription>
              Seleccione el método de pago utilizado por el cliente para saldar la cuenta pendiente de la orden de trabajo.
            </DialogDescription>
          </DialogHeader>

          {orderToPay && (() => {
            const total = Number(orderToPay.total);
            const totalPagado = Number(orderToPay.totalPagado || 0);
            const saldoPendiente = Math.max(0, total - totalPagado);

            return (
              <div className="space-y-4 py-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 border p-3 text-xs space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">ID Orden:</span>
                    <span className="font-bold">#{orderToPay.idOrdenDeTrabajo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Monto Total Orden:</span>
                    <span className="font-bold">${total.toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Monto Ya Pagado (Abonos):</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">${totalPagado.toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed pt-2">
                    <span className="text-muted-foreground font-sans">Saldo Restante a Cobrar:</span>
                    <span className="font-bold text-red-500 text-sm">${saldoPendiente.toLocaleString("es-CL")}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodoPagoModal" className="text-xs font-bold text-slate-700">
                    Método de Pago
                  </Label>
                  <Select
                    value={selectedMetodoPago}
                    onValueChange={setSelectedMetodoPago}
                  >
                    <SelectTrigger className="w-full border bg-background text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="debito">Tarjeta de Débito</SelectItem>
                      <SelectItem value="credito">Tarjeta de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2.5 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPayModalOpen(false)}
                    disabled={isConfirmingPayment}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleConfirmPayment}
                    disabled={isConfirmingPayment}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    {isConfirmingPayment ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Procesando...
                      </span>
                    ) : (
                      "Confirmar Pago Restante"
                    )}
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal de Previsualización de Boleta / Comprobante */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
              Comprobante de Compra Generado
            </DialogTitle>
            <DialogDescription>
              La boleta interna ha sido registrada y generada correctamente en el sistema.
            </DialogDescription>
          </DialogHeader>

          {activeReceipt && (
            <div className="space-y-4 py-3">
              {/* Ticket Físico Preview */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-inner text-xs font-mono text-slate-800 dark:text-slate-200 max-w-xs mx-auto space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="font-sans font-black text-sm tracking-tight text-slate-900 dark:text-white">URBAN CYCLING</h4>
                  <p className="text-[10px] text-muted-foreground font-sans">Giro: Venta y Servicio de Bicicletas</p>
                  <p className="text-[10px] text-muted-foreground font-sans">RUT Emisor: {activeReceipt.rutEmisor}</p>
                </div>
                
                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />
                
                <div className="text-center">
                  <p className="font-sans font-bold text-xs uppercase tracking-wider">Comprobante de Compra</p>
                  <p className="font-sans font-black text-sm text-primary">Folio N° {activeReceipt.numeroFolio}</p>
                </div>

                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />

                <div className="space-y-1">
                  <p><span className="text-muted-foreground font-sans">Fecha Emisión:</span> {formatDocDate(activeReceipt.fechaEmision)}</p>
                  <p><span className="text-muted-foreground font-sans">Receptor:</span> {activeReceipt.rutReceptor}</p>
                </div>

                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />

                <div className="space-y-1.5 text-right">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Monto Neto:</span>
                    <span>${Number(activeReceipt.montoNeto).toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">IVA (19%):</span>
                    <span>${Number(activeReceipt.montoIva).toLocaleString("es-CL")}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-dashed border-slate-300 dark:border-slate-700 pt-1 text-sm text-primary">
                    <span className="font-sans">TOTAL:</span>
                    <span>${Number(activeReceipt.montoTotal).toLocaleString("es-CL")}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />

                <div className="text-center text-[10px] text-muted-foreground font-sans leading-tight">
                  Este documento es un comprobante interno de compra.<br />
                  ¡Gracias por su preferencia!
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReceiptModalOpen(false)}
                >
                  Cerrar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handlePrintReceipt(activeReceipt, selectedOrder)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  disabled={isGeneratingReceipt}
                >
                  {isGeneratingReceipt ? "Imprimiendo..." : "Imprimir Comprobante"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
