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
  CalendarClock,
  XCircle,
  Pencil,
  Printer,
  Download,
  Mail,
  MoreHorizontal,
  Maximize2,
  X,
  Image as ImageIcon,
} from "lucide-react"
import { useState } from "react"
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
}

interface LightboxState {
  images: string[]
  index: number
  title: string
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
}: OrderDetailDialogProps) {
  const [openBikes, setOpenBikes] = useState<{ [key: number]: boolean }>({})
  const [lightbox, setLightbox] = useState<LightboxState | null>(null)

  if (!order) return null

  const laborCost = (order.lineasDeOrdenDeTrabajo || [])
    .filter((l) => l.idServicio !== null && l.idServicio !== undefined)
    .reduce((sum, l) => sum + Number(l.precioUnitario), 0)

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
  const totalPagado = Number(order.totalPagado || 0)

  const isPaid =
    order.estadoPago?.toLowerCase() === "pagada" ||
    order.estadoPago?.toLowerCase() === "pagado" ||
    Math.max(0, total - totalPagado) === 0

  const renderStatusBadge = (ord: WorkOrder) => {
    const isFullyCompleted = [
      "Listo para entregar",
      "Entregado",
      "Anulada",
    ].includes(ord.estadoOrden)

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

  const getBikeImages = (bike: NonNullable<WorkOrder["bicicletas"]>[number]) => {
    const images = [
      ...(bike.imagenes || []),
      ...(bike.imagenUrl ? [bike.imagenUrl] : []),
    ]

    return [...new Set(images.filter(Boolean))]
  }

  const openLightbox = (
    images: string[],
    index: number,
    title: string
  ) => {
    if (images.length === 0) return

    setLightbox({
      images,
      index,
      title,
    })
  }

  const closeLightbox = () => {
    setLightbox(null)
  }

  const showPreviousImage = () => {
    if (!lightbox) return

    setLightbox((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        index:
          prev.index === 0
            ? prev.images.length - 1
            : prev.index - 1,
      }
    })
  }

  const showNextImage = () => {
    if (!lightbox) return

    setLightbox((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        index:
          prev.index === prev.images.length - 1
            ? 0
            : prev.index + 1,
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between border-b border-border pb-2 text-xl font-black">
              <span>Orden de Trabajo #{order.idOrdenDeTrabajo}</span>

              <div className="mr-6">
                {renderStatusBadge(order)}
              </div>
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

                <DataField
                  label="RUT"
                  value={order.cliente?.rut || "No indicado"}
                />

                {order.cliente?.tipoCliente && (
                  <DataField
                    label="Tipo Cliente"
                    value={
                      <span className="capitalize">
                        {order.cliente.tipoCliente}
                      </span>
                    }
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
                  value={new Date(
                    order.fechaEntregaEstimada
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
                      ? new Date(
                          order.fechaEntregaReal
                        ).toLocaleDateString("es-ES", {
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
                {order.observacionesIngreso ||
                  "No se especificaron observaciones adicionales."}
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
                          <th className="px-3 py-2">
                            Producto / Insumo
                          </th>
                          <th className="px-3 py-2 text-center">
                            Cant
                          </th>
                          <th className="px-3 py-2 text-right">
                            Precio Unit.
                          </th>
                          <th className="px-3 py-2 text-right">
                            Subtotal
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-border">
                        {productLines.map((line) => {
                          const subtotal =
                            line.cantidad *
                            Number(line.precioUnitario)

                          return (
                            <tr
                              key={
                                line.idLineaDeOrdenDeTrabajo
                              }
                            >
                              <td className="px-3 py-2 font-medium text-foreground">
                                {line.producto?.nombre ||
                                  `Producto #${line.idProducto}`}
                              </td>

                              <td className="px-3 py-2 text-center font-bold text-foreground">
                                {line.cantidad}
                              </td>

                              <td className="px-3 py-2 text-right text-foreground font-mono">
                                $
                                {Number(
                                  line.precioUnitario
                                ).toLocaleString("es-CL")}
                              </td>

                              <td className="px-3 py-2 text-right font-bold text-foreground font-mono">
                                $
                                {subtotal.toLocaleString(
                                  "es-CL"
                                )}
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
                  No se han cargado insumos o repuestos adicionales a
                  esta orden.
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
                  value={`$${Number(
                    order.total
                  ).toLocaleString("es-CL")}`}
                  valueClassName="text-primary font-black"
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
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                      isPaid
                        ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
                        : order.estadoPago?.toLowerCase() ===
                            "abono"
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
                    className={`font-bold text-sm ${
                      isPaid
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
                          {new Date(
                            pago.fechaRegistro
                          ).toLocaleString("es-CL")}
                        </span>
                      </div>

                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        +$
                        {Number(pago.monto).toLocaleString(
                          "es-CL"
                        )}
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
                {order.bicicletas?.map((bike) => {
                  const bikeImages = getBikeImages(bike)

                  return (
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
                            Color:{" "}
                            <span className="font-medium text-foreground">
                              {bike.color}
                            </span>
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setOpenBikes((prev) => ({
                              ...prev,
                              [bike.idBicicleta]:
                                !prev[bike.idBicicleta],
                            }))
                          }
                          className="h-8 text-xs cursor-pointer gap-1"
                        >
                          {openBikes[bike.idBicicleta]
                            ? "Ocultar detalles"
                            : "Ver detalles"}

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

                          {/* Galería */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5" />
                                Fotografías de Ingreso
                              </span>

                              {bikeImages.length > 0 && (
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  {bikeImages.length}{" "}
                                  {bikeImages.length === 1
                                    ? "fotografía"
                                    : "fotografías"}
                                </span>
                              )}
                            </div>

                            {bikeImages.length > 0 ? (
                              <div className="space-y-2">
                                {/* Imagen principal */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    openLightbox(
                                      bikeImages,
                                      0,
                                      `${bike.marca} ${bike.modelo}`
                                    )
                                  }
                                  className="group relative block w-full max-w-lg aspect-video rounded-lg overflow-hidden border border-border bg-background cursor-pointer"
                                >
                                  <img
                                    src={bikeImages[0]}
                                    alt={`${bike.marca} ${bike.modelo} - fotografía 1`}
                                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                  />

                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/60 text-white p-3">
                                      <Maximize2 className="h-5 w-5" />
                                    </div>
                                  </div>
                                </button>

                                {/* Miniaturas */}
                                {bikeImages.length > 1 && (
                                  <div className="flex gap-2 overflow-x-auto pb-1">
                                    {bikeImages.map(
                                      (image, imageIndex) => (
                                        <button
                                          key={`${image}-${imageIndex}`}
                                          type="button"
                                          onClick={() =>
                                            openLightbox(
                                              bikeImages,
                                              imageIndex,
                                              `${bike.marca} ${bike.modelo}`
                                            )
                                          }
                                          className="group relative shrink-0 w-20 h-16 rounded-md overflow-hidden border border-border bg-background cursor-pointer hover:border-primary transition-colors"
                                        >
                                          <img
                                            src={image}
                                            alt={`${bike.marca} ${bike.modelo} - fotografía ${
                                              imageIndex + 1
                                            }`}
                                            className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
                                          />

                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

                                          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                                            {imageIndex + 1}
                                          </span>
                                        </button>
                                      )
                                    )}
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
                  )
                })}
              </div>
            </div>
          </div>

          {/* Acciones en el pie del Modal */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {canCancel && onAssignSuppliesClick && (
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  Más acciones
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-52">
                {onRescheduleClick && (
                  <DropdownMenuItem
                    onClick={() => onRescheduleClick(order)}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <CalendarClock className="h-4 w-4" />
                    Reprogramar Entrega
                  </DropdownMenuItem>
                )}

                {canCancel && onCancelClick && (
                  <>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => onCancelClick(order)}
                      className="flex cursor-pointer items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30"
                    >
                      <XCircle className="h-4 w-4" />
                      Anular Orden
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem className="flex cursor-pointer items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </DropdownMenuItem>

                <DropdownMenuItem className="flex cursor-pointer items-center gap-2">
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </DropdownMenuItem>

                <DropdownMenuItem className="flex cursor-pointer items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox / pantalla completa */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
        >
          {/* Cerrar */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 cursor-pointer"
            aria-label="Cerrar imagen"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Contador */}
          <div className="absolute left-4 top-4 z-20 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>

          {/* Título */}
          <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-semibold text-white">
            {lightbox.title}
          </div>

          {/* Anterior */}
          {lightbox.images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                showPreviousImage()
              }}
              className="absolute left-3 sm:left-6 z-20 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 cursor-pointer"
              aria-label="Fotografía anterior"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* Imagen */}
          <div
            className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.images[lightbox.index]}
              alt={`${lightbox.title} - fotografía ${
                lightbox.index + 1
              }`}
              className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Siguiente */}
          {lightbox.images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                showNextImage()
              }}
              className="absolute right-3 sm:right-6 z-20 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 cursor-pointer"
              aria-label="Fotografía siguiente"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}
        </div>
      )}
    </>
  )
}
