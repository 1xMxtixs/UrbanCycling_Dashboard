"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/sonner"
import { 
  Loader2, 
  User, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  AlertTriangle,
  Ban,
  CheckCircle,
  Coins,
  FileText
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DataTable } from "./data-table"
import { columns, SaleOperation } from "./columns"

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

export function ListVentas() {
  const router = useRouter()
  const [sales, setSales] = useState<SaleOperation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const [selectedSale, setSelectedSale] = useState<SaleOperation | null>(null)
  const [openDetailsModal, setOpenDetailsModal] = useState(false)

  const [payModalOpen, setPayModalOpen] = useState(false)
  const [saleToPay, setSaleToPay] = useState<{ idVenta: number; total: number } | null>(null)
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>("efectivo")
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false)

  const getSales = async () => {
    try {
      const response = await fetch("/api/punto-venta", {
        cache: "no-store",
      })

      if (!response.ok) {
        setSales([])
        return
      }

      const data = await response.json()
      const ventas = Array.isArray(data)
        ? data
            .filter((item) => item.tipoOperacion === "venta")
            .filter(Boolean)
        : []

      setSales(ventas)
    } catch (err) {
      console.error("Error fetching sales:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    getSales()
    window.addEventListener("sales:refresh", getSales)

    return () => {
      window.removeEventListener("sales:refresh", getSales)
    }
  }, [])

  const handleUpdateStatus = async (idVenta: number, nextPagoStatus: string, nextVentaStatus: string) => {
    setUpdatingId(idVenta)
    try {
      const res = await fetch(`/api/punto-venta/venta-${idVenta}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estadoPago: nextPagoStatus,
          estadoVenta: nextVentaStatus,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Error al actualizar venta")
      }

      toast.success("Venta actualizada correctamente.")
      
      if (selectedSale && selectedSale.venta.idVenta === idVenta) {
        setSelectedSale({
          ...selectedSale,
          estadoPago: nextPagoStatus,
          estadoVenta: nextVentaStatus,
        })
      }

      getSales()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo actualizar el estado de la venta")
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePayClick = (idVenta: number, total: number) => {
    setSaleToPay({ idVenta, total: Number(total) })
    setSelectedMetodoPago("efectivo")
    setPayModalOpen(true)
  }

  const handleConfirmPayment = async () => {
    if (!saleToPay) return
    setIsConfirmingPayment(true)
    try {
      const res = await fetch(`/api/punto-venta/venta-${saleToPay.idVenta}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estadoPago: "pagada",
          metodoPago: selectedMetodoPago,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Error al registrar pago")
      }

      toast.success("Pago registrado correctamente.")
      setPayModalOpen(false)
      setOpenDetailsModal(false)
      getSales()
      router.refresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo registrar el pago")
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  const handleViewDetails = (op: SaleOperation) => {
    setSelectedSale(op)
    setOpenDetailsModal(true)
  }

  const handleGenerateReceipt = async (op: SaleOperation) => {
    setIsGeneratingReceipt(true)
    try {
      const res = await fetch("/api/documentos-tributarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origen: "venta",
          idVenta: op.venta.idVenta,
          tipoDte: 39,
        }),
      })

      if (res.status === 201 || res.status === 409) {
        const data = await res.json()
        setActiveReceipt(data.documentoTributario)
        setSelectedSale(op)
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

  const handlePrintReceipt = (dte: any, sale: SaleOperation | null) => {
    const printWindow = window.open("", "_blank", "width=400,height=600")
    if (!printWindow) {
      toast.error("Por favor, permite las ventanas emergentes para imprimir.")
      return
    }

    const clientLabel = sale?.cliente
      ? sale.cliente.razonSocial
        ? sale.cliente.razonSocial
        : `${sale.cliente.primerNombre || ""} ${sale.cliente.apellidoPaterno || ""}`.trim()
      : "Cliente General"

    const lineas = sale?.venta?.lineasDeVenta || []

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
          ${sale?.cliente?.rut ? `<div>RUT Receptor: ${sale.cliente.rut}</div>` : ""}
          <div class="divider"></div>
          
          <div class="bold" style="margin-bottom: 5px;">DETALLE DE PRODUCTOS:</div>
          ${lineas.map((line: any) => `
            <div class="flex">
              <span>${line.cantidad}x ${line.producto?.nombre || "Producto"}</span>
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
            ¡Gracias por su compra en Urban Cycling!
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

  // Cálculos de KPIs
  const totalSalesCount = sales.length
  const totalRevenue = sales
    .filter((s) => s.estadoVenta?.toLowerCase() !== "anulada" && (s.estadoPago?.toLowerCase() === "pagada" || s.estadoPago?.toLowerCase() === "pagado"))
    .reduce((sum, s) => sum + Number(s.total), 0)
  const pendingRevenue = sales
    .filter((s) => s.estadoVenta?.toLowerCase() !== "anulada" && s.estadoPago?.toLowerCase() === "pendiente")
    .reduce((sum, s) => sum + Number(s.total), 0)
  const canceledCount = sales
    .filter((s) => s.estadoVenta?.toLowerCase() === "anulada")
    .length

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-75 gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-805 p-8 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-semibold text-muted-foreground">Cargando ventas registradas...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Panel de KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Ventas */}
        <div className="rounded-xl border bg-background p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total de Ventas</p>
            <p className="text-2xl font-black">{totalSalesCount}</p>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-800 dark:text-slate-100">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 2: Ingresos de Caja */}
        <div className="rounded-xl border bg-background p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ingresos (Pagados)</p>
            <p className="text-2xl font-black text-green-600 dark:text-green-400">
              ${totalRevenue.toLocaleString("es-CL")}
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/40 rounded-lg text-green-600 dark:text-green-400">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 3: Cuentas Pendientes */}
        <div className="rounded-xl border bg-background p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Por Cobrar</p>
            <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
              ${pendingRevenue.toLocaleString("es-CL")}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/40 rounded-lg text-yellow-600 dark:text-yellow-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* KPI 4: Ventas Anuladas */}
        <div className="rounded-xl border bg-background p-4 shadow-sm flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ventas Anuladas</p>
            <p className="text-2xl font-black text-red-500">{canceledCount}</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-lg text-red-500">
            <Ban className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabla Principal */}
      <DataTable
        columns={columns}
        data={sales}
        onViewDetails={handleViewDetails}
        onUpdateStatus={handleUpdateStatus}
        updatingId={updatingId}
        onPayClick={handlePayClick}
        onGenerateReceipt={handleGenerateReceipt}
      />

      {/* Modal de Detalle de Venta */}
      <Dialog open={openDetailsModal} onOpenChange={setOpenDetailsModal}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedSale && (() => {
            const lineas = selectedSale.venta.lineasDeVenta || []
            const subtotal = lineas.reduce((sum, l) => sum + (l.cantidad * Number(l.precioUnitario)), 0)
            const descuento = selectedSale.total ? Math.max(0, subtotal - Number(selectedSale.total)) : 0
            const total = Number(selectedSale.total)
            const neto = Math.round(total / 1.19)
            const iva = total - neto
            const isAnulada = selectedSale.estadoVenta === "anulada"

            const clientLabel = selectedSale.cliente
              ? selectedSale.cliente.razonSocial
                ? selectedSale.cliente.razonSocial
                : `${selectedSale.cliente.primerNombre} ${selectedSale.cliente.apellidoPaterno || ""}`.trim()
              : "Cliente General"

            return (
              <>
                <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-2">
                  <DialogTitle className="flex items-center justify-between text-xl font-black">
                    <span>Detalle de Venta #{selectedSale.idPuntoVenta}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                      isAnulada
                        ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                        : (selectedSale.estadoPago?.toLowerCase() === "pagada" || selectedSale.estadoPago?.toLowerCase() === "pagado")
                          ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                          : "bg-yellow-50 border-yellow-250 text-yellow-750 dark:bg-yellow-950/40 dark:text-yellow-450"
                    }`}>
                      {isAnulada ? "Anulada" : selectedSale.estadoPago}
                    </span>
                  </DialogTitle>
                  <DialogDescription>
                    Resumen detallado de la venta en mostrador registrada
                  </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 py-4 space-y-4 text-xs font-mono">
                  {/* Info Cliente */}
                  <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                    <div className="flex items-center gap-1.5 font-sans font-bold border-b border-slate-200/50 dark:border-slate-800 pb-1 mb-1 text-slate-800 dark:text-slate-200">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Datos de Facturación / Cliente
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Nombre/Razón Social</span>
                        <span className="font-semibold">{clientLabel}</span>
                      </div>
                      {selectedSale.cliente && (
                        <div>
                          <span className="text-muted-foreground block text-[10px]">RUT</span>
                          <span className="font-semibold">{selectedSale.cliente.rut}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Fecha Operación</span>
                        <span className="font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(selectedSale.fechaCreacion).toLocaleString("es-CL")}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Vendedor Responsable</span>
                        <span className="font-semibold">ID #1 (Admin)</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Productos */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-sans font-bold border-b border-slate-200/50 dark:border-slate-800 pb-1 mb-1 text-slate-800 dark:text-slate-200">
                      <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                      Productos Vendidos
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                            <th className="px-3 py-1.5">Producto</th>
                            <th className="px-3 py-1.5 text-center">Cant</th>
                            <th className="px-3 py-1.5 text-right">Precio Unit.</th>
                            <th className="px-3 py-1.5 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {lineas.map((line) => {
                            const lineSubtotal = line.cantidad * Number(line.precioUnitario)
                            return (
                              <tr key={line.idLineaDeVenta}>
                                <td className="px-3 py-1.5 font-medium">
                                  {line.producto?.nombre || `Producto #${line.idProducto}`}
                                </td>
                                <td className="px-3 py-1.5 text-center font-bold">
                                  {line.cantidad}
                                </td>
                                <td className="px-3 py-1.5 text-right">
                                  ${Number(line.precioUnitario).toLocaleString("es-CL")}
                                </td>
                                <td className="px-3 py-1.5 text-right font-bold">
                                  ${lineSubtotal.toLocaleString("es-CL")}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totales */}
                  <div className="space-y-1.5 border-t border-slate-200/50 dark:border-slate-800 pt-3 text-right">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SUBTOTAL BRUTO:</span>
                      <span className="font-semibold">${subtotal.toLocaleString("es-CL")}</span>
                    </div>
                    {descuento > 0 && (
                      <div className="flex justify-between text-red-500 font-bold">
                        <span>DESCUENTO:</span>
                        <span>-${descuento.toLocaleString("es-CL")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>NETO ESTIMADO:</span>
                      <span>${neto.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>IVA (19%):</span>
                      <span>${iva.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-dashed border-slate-300 dark:border-slate-700 pt-1.5 text-primary">
                      <span>TOTAL DE LA VENTA:</span>
                      <span>${total.toLocaleString("es-CL")}</span>
                    </div>
                  </div>
                </div>

                {/* Acciones del Modal */}
                <div className="flex justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div>
                    {!isAnulada && selectedSale.estadoPago?.toLowerCase() === "pendiente" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handlePayClick(selectedSale.venta.idVenta, total)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Registrar Pago
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isAnulada && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedSale.venta.idVenta, "anulada", "anulada")}
                        className="font-bold"
                      >
                        <Ban className="h-4 w-4 mr-1.5" />
                        Anular
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setOpenDetailsModal(false)}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Pago */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-green-600 dark:text-green-400">
              <Coins className="h-5 w-5" />
              Confirmar Registro de Pago
            </DialogTitle>
            <DialogDescription>
              Seleccione el método de pago utilizado por el cliente para saldar la venta.
            </DialogDescription>
          </DialogHeader>

          {saleToPay && (
            <div className="space-y-4 py-3">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 border p-3 text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">ID Venta:</span>
                  <span className="font-bold">#{saleToPay.idVenta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-sans">Monto a Pagar:</span>
                  <span className="font-bold text-primary">${saleToPay.total.toLocaleString("es-CL")}</span>
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
                    "Confirmar Pago"
                  )}
                </Button>
              </div>
            </div>
          )}
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
                  onClick={() => handlePrintReceipt(activeReceipt, selectedSale)}
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
