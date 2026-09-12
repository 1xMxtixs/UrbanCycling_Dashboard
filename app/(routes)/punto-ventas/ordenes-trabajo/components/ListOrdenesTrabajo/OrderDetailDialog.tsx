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
  CalendarClock,
  XCircle,
  Pencil,
  Printer,
  Download,
  Mail,
  MoreHorizontal,
  History,
} from "lucide-react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataField } from "@/components/common/DataField"
import { formatClientName } from "@/lib/formatters"
import { WorkOrder } from "../../types"
import {
  buildWorkOrderContent,
  buildWorkOrderHtml,
  isWorkOrderPaid,
  workOrderFileName,
} from "@/components/common/WorkOrderDocument"

function getAvailableTransitions(currentStatus: string) {
  const map: Record<string, string[]> = {
    "Por realizar": ["En curso", "En espera"],
    "En curso": ["Listo para entregar", "En espera"],
    "En espera": ["En curso", "Listo para entregar"],
    "Listo para entregar": ["Entregado", "En curso"],
    "Entregado": [],
    "Anulada": [],
  }
  return map[currentStatus] || []
}

interface OrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder | null
  onPayClick?: (order: WorkOrder) => void
  onRescheduleClick?: (order: WorkOrder) => void
  onCancelClick?: (order: WorkOrder) => void
  onStatusChange?: (orderId: number, nextStatus: string) => void
  onAssignSuppliesClick?: (order: WorkOrder) => void
  onAuditClick?: (order: WorkOrder) => void
  onModifyServiceClick?: (order: WorkOrder) => void
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
  onPayClick,
  onRescheduleClick,
  onCancelClick,
  onStatusChange,
  onAssignSuppliesClick,
  onAuditClick,
  onModifyServiceClick,
}: OrderDetailDialogProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === "Administrador"
  const canUpdateOrders = session?.user?.permisos?.includes(
    PERMISSIONS.WORK_ORDERS_UPDATE
  )
  const [openBikes, setOpenBikes] = useState<{ [key: number]: boolean }>({})

  if (!order) return null

  const laborCost = (order.lineasDeOrdenDeTrabajo || [])
    .filter((l) => l.idServicio !== null && l.idServicio !== undefined)
    .reduce((sum, l) => sum + Number(l.precioUnitario || 0) * Number(l.cantidad || 1), 0)

  const productLines = (order.lineasDeOrdenDeTrabajo || []).filter(
    (l) => l.idProducto !== null && l.idProducto !== undefined
  )

  const productsCost = productLines.reduce(
    (sum, l) => sum + l.cantidad * Number(l.precioUnitario),
    0
  )

  const total = Number(order.total)
  const montoNeto = Math.round(total / 1.19)

  const transitions = getAvailableTransitions(order.estadoOrden)
  const canCancel = !["Entregado", "Anulada"].includes(order.estadoOrden)
  const canEdit = !["Entregado", "Anulada"].includes(order.estadoOrden)
  const totalPagado = Number(order.totalPagado || 0)
  const isPaid =
    order.estadoPago?.toLowerCase() === "pagada" ||
    order.estadoPago?.toLowerCase() === "pagado" ||
    Math.max(0, total - totalPagado) === 0

  const renderStatusBadge = (ord: WorkOrder) => {
    const isFullyCompleted = ["Listo para entregar", "Entregado", "Anulada"].includes(
      ord.estadoOrden
    )
    const dEstimada = new Date(ord.fechaEntregaEstimada)
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
      return <StatusBadge status="danger" label="Retrasada" />
    }

    switch (ord.estadoOrden) {
      case "Por realizar":
        return <StatusBadge status="neutral" label="Por realizar" />
      case "En curso":
        return <StatusBadge status="info" label="Activa" />
      case "En espera":
        return <StatusBadge status="warning" label="En Espera" />
      case "Listo para entregar":
        return <StatusBadge status="warning" label="Por Entregar" />
      case "Entregado":
        return <StatusBadge status="success" label="Completada" />
      case "Anulada":
        return <StatusBadge status="danger" label="Anulada" />
      default:
        return <StatusBadge status="neutral" label={ord.estadoOrden} />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between border-b border-border pb-2 text-xl font-black">
            <span>Orden de Trabajo #{order.idOrdenDeTrabajo}</span>
            <div className="mr-6">{renderStatusBadge(order)}</div>
          </DialogTitle>
          <DialogDescription>
            Detalles completos de la orden cargada en el sistema
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 py-4 pr-1 space-y-5 text-sm">
          {/* 1. Datos Cliente */}
          <div className="space-y-2 rounded-xl bg-muted/30 border border-border p-4">
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

          {/* 2. Detalles de Fechas */}
          <div className="space-y-2 rounded-xl bg-muted/30 border border-border p-4">
            <h4 className="flex items-center gap-1.5 font-bold text-foreground border-b border-border pb-1.5">
              <Calendar className="h-4 w-4 text-primary" />
              Fechas y Registro
            </h4>
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

          {/* 3. Trabajo a Realizar */}
          <div className="space-y-2 rounded-xl bg-muted/30 border border-border p-4">
            <h4 className="flex items-center gap-1.5 font-bold text-foreground border-b border-border pb-1.5">
              <FileText className="h-4 w-4 text-primary" />
              Descripción del Trabajo
            </h4>
            <p className="text-foreground italic bg-background p-3 rounded-lg border border-border leading-relaxed">
              {order.observacionesIngreso || "No se especificaron observaciones adicionales."}
            </p>
          </div>

          {/* 3.5. Costos y Repuestos */}
          <div className="space-y-3 rounded-xl bg-muted/30 border border-border p-4">
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <h4 className="flex items-center gap-1.5 font-bold text-foreground">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Detalle de Costos y Insumos
              </h4>
            </div>

            {productLines.length > 0 ? (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block font-bold">
                  Insumos y Repuestos Utilizados:
                </span>
                <div className="rounded-lg border border-border bg-background overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                        <th className="px-3 py-2">Producto / Insumo</th>
                        <th className="px-3 py-2 text-center">Cant</th>
                        <th className="px-3 py-2 text-right">Precio Unit.</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {productLines.map((line) => {
                        const subtotal = line.cantidad * Number(line.precioUnitario)
                        return (
                          <tr key={line.idLineaDeOrdenDeTrabajo}>
                            <td className="px-3 py-2 font-medium text-foreground">
                              {line.producto?.nombre || `Producto #${line.idProducto}`}
                            </td>
                            <td className="px-3 py-2 text-center font-bold text-foreground">
                              {line.cantidad}
                            </td>
                            <td className="px-3 py-2 text-right text-foreground font-mono">
                              ${Number(line.precioUnitario).toLocaleString("es-CL")}
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-foreground font-mono">
                              ${subtotal.toLocaleString("es-CL")}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic bg-background p-2.5 rounded-lg border border-border">
                No se han cargado insumos o repuestos adicionales a esta orden.
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border/50 pt-4">
              <DataField
                label="Total Repuestos"
                value={`$${productsCost.toLocaleString("es-CL")}`}
              />
              <DataField
                label="Monto Servicio"
                value={`$${laborCost.toLocaleString("es-CL")}`}
              />
              <DataField
                label="Monto Neto"
                value={`$${montoNeto.toLocaleString("es-CL")}`}
              />
              <DataField
                label="Monto Total"
                value={<span className="text-primary font-black">{`${Number(order.total).toLocaleString("es-CL")}`}</span>}
              />
            </div>
          </div>

          {/* 3.6. Historial de Pagos */}
          <div className="space-y-2 rounded-xl bg-muted/30 border border-border p-4">
            <h4 className="flex items-center gap-1.5 font-bold text-foreground border-b border-border pb-1.5">
              <Coins className="h-4 w-4 text-primary" />
              Estado de Pago e Historial
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-0.5">
                  Estado de Pago
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${isPaid
                    ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
                    : order.estadoPago?.toLowerCase() === "abono"
                      ? "bg-cyan-500/10 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300"
                      : "bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300"
                    }`}
                >
                  {isPaid ? "Pagada" : order.estadoPago}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-0.5">
                  Saldo Restante
                </span>
                <span
                  className={`font-bold text-sm ${isPaid
                    ? "text-emerald-600 dark:text-emerald-400"
                    : total - totalPagado > 0
                      ? "text-rose-500"
                      : "text-emerald-600 dark:text-emerald-400"
                    }`}
                >
                  $
                  {(isPaid
                    ? 0
                    : Math.max(0, total - totalPagado)
                  ).toLocaleString("es-CL")}
                </span>
              </div>
            </div>

            {order.pagos && order.pagos.length > 0 ? (
              <div className="mt-3 space-y-1.5 border-t border-dashed border-border pt-2 font-mono">
                <span className="text-[10px] text-muted-foreground font-sans uppercase font-bold block mb-1">
                  Pagos Registrados:
                </span>
                {order.pagos.map((pago: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-xs bg-background p-2 rounded border border-border"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold block capitalize font-sans text-foreground">
                        Pago #{idx + 1} ({pago.metodoPago})
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(pago.fechaRegistro).toLocaleString("es-CL")}
                      </span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +${Number(pago.monto).toLocaleString("es-CL")}
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
                  className="rounded-xl border border-border bg-muted/30 p-4 transition-all"
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

                      {bike.imagenUrl && (
                        <div>
                          <span className="text-xs text-muted-foreground block mb-1.5">
                            Fotografía de Ingreso
                          </span>
                          <div className="relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border border-border">
                            <img
                              src={bike.imagenUrl}
                              alt={`${bike.marca} ${bike.modelo}`}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div>
            {!isPaid && onPayClick && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPayClick(order)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 cursor-pointer"
              >
                <Coins className="h-4 w-4" />
                Registrar Pago Restante
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEdit && onAssignSuppliesClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignSuppliesClick(order)}
                className="gap-1.5 cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}

            {order.estadoOrden === "En curso" && canUpdateOrders && onModifyServiceClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onModifyServiceClick(order)}
                className="gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Wrench className="h-4 w-4" />
                Modificar servicio
              </Button>
            )}

            {onRescheduleClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRescheduleClick(order)}
                className="gap-1.5 text-amber-700 dark:text-amber-400"
              >
                <CalendarClock className="h-4 w-4" />
                Reprogramar
              </Button>
            )}

            {canCancel && onCancelClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancelClick(order)}
                className="gap-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400"
              >
                <XCircle className="h-4 w-4" />
                Anular
              </Button>
            )}

            {isAdmin && onAuditClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAuditClick(order)}
                className="gap-1.5"
              >
                <History className="h-4 w-4" />
                Ver auditoría
              </Button>
            )}

            {/* [Exportar ▾] */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 cursor-pointer">
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
                        `  Estado: ${order.estadoOrden}`,
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

            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
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

  // Guardar elemento con foco previo
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
    // Liberar estilos de bloqueo si Radix quedó en estado inconsistente
    document.body.style.pointerEvents = ""
    document.body.style.overflow = ""
    try {
      previouslyFocused?.focus()
    } catch {
      // Si el elemento ya no existe o cambió, no bloquea
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

      // Pequeño retardo para permitir que el DropdownMenu termine su transición de cierre
      // antes de que el browser suspenda el hilo principal con el diálogo nativo de impresión
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

  // Fallback de seguridad si onload no dispara
  setTimeout(triggerPrint, 350)
  // Red de seguridad máxima: asegura cleanup pasados 60s
  setTimeout(cleanup, 60000)
}

async function downloadWorkOrderPdf(order: WorkOrder) {
  // html2canvas-pro soporta lab()/oklch() de Tailwind v4; html2pdf.js usa html2canvas legacy que falla
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ])

  // Contenedor aislado (no heredará estilos del DOM principal con colores lab/oklch)
  const container = document.createElement("div")
  container.style.position = "fixed"
  container.style.left = "-9999px"
  container.style.top = "0"
  container.style.width = "794px" // ≈ letter width en 96dpi
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

    const pageWidth = 215.9 // letter en mm
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

// buildWorkOrderContent, buildWorkOrderHtml, isWorkOrderPaid e workOrderFileName
// estan definidos en @/components/common/WorkOrderDocument - modulo reutilizable.
