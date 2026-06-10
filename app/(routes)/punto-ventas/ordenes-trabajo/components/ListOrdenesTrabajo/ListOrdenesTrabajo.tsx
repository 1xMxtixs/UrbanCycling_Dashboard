"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/sonner"
import { 
  Loader2, 
  User, 
  Calendar, 
  FileText, 
  Clock, 
  Wrench,
  ChevronDown,
  ShoppingBag
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

export function ListOrdenesTrabajo() {
  const router = useRouter()
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [openDetailsModal, setOpenDetailsModal] = useState(false)

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

  const handleViewDetails = (order: WorkOrder) => {
    setSelectedOrder(order)
    setOpenDetailsModal(true)
  }

  const renderStatusBadge = (order: WorkOrder) => {
    const isCompleted = ["Listo para entregar", "Entregado"].includes(order.estadoOrden)
    const dEstimada = new Date(order.fechaEntregaEstimada)
    const isDelayed = dEstimada < new Date() && !isCompleted
    
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
                        <span className="font-semibold text-slate-805 dark:text-slate-250">
                          {new Date(selectedOrder.fechaRecepcion).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Fecha Entrega Estimada</span>
                        <span className="font-semibold text-slate-805 dark:text-slate-250">
                          {new Date(selectedOrder.fechaEntregaEstimada).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block">Fecha Entrega Real</span>
                        <span className="font-semibold text-slate-805 dark:text-slate-250">
                          {selectedOrder.fechaEntregaReal
                            ? new Date(selectedOrder.fechaEntregaReal).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
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
                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
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
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
