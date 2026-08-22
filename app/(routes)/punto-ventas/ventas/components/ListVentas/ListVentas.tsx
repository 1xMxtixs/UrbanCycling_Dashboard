"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatClientName } from "@/lib/formatters"
import { ShoppingBag, DollarSign, Clock, Ban } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { MetricCard } from "@/components/MetricCard"

import { DataTable } from "./data-table"
import { columns } from "./columns"
import { SaleDetailDialog } from "./SaleDetailDialog"
import { SalePayDialog } from "./SalePayDialog"
import { SaleReceiptTicketDialog } from "./SaleReceiptTicketDialog"
import { SaleOperation } from "../../types"

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
      
      if (selectedSale && Number(selectedSale.venta.idVenta) === idVenta) {
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
          origen: "venta-directa",
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
        throw new Error(errorData.message || "Error al generar comprobante")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo generar el comprobante.")
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

    const clientLabel = formatClientName(sale?.cliente)
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
          
          <div>Fecha Emisión: ${new Date(dte.fechaEmision).toLocaleDateString("es-CL")}</div>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Ventas"
          value={totalSalesCount}
          description="Ventas registradas"
          icon={ShoppingBag}
        />
        <MetricCard
          title="Ingresos Cobrados"
          value={`$${totalRevenue.toLocaleString("es-CL")}`}
          description="Total ventas pagadas"
          icon={DollarSign}
        />
        <MetricCard
          title="Por Cobrar"
          value={`$${pendingRevenue.toLocaleString("es-CL")}`}
          description="Ventas pendientes"
          icon={Clock}
        />
        <MetricCard
          title="Ventas Anuladas"
          value={canceledCount}
          description="Operaciones canceladas"
          icon={Ban}
        />
      </div>

      <DataTable
        columns={columns}
        data={sales}
        onViewDetails={handleViewDetails}
        onUpdateStatus={handleUpdateStatus}
        updatingId={updatingId}
        onPayClick={handlePayClick}
        onGenerateReceipt={handleGenerateReceipt}
      />

      <SaleDetailDialog
        open={openDetailsModal}
        onOpenChange={setOpenDetailsModal}
        sale={selectedSale}
        onPayClick={handlePayClick}
        onUpdateStatus={handleUpdateStatus}
      />

      <SalePayDialog
        open={payModalOpen}
        onOpenChange={setPayModalOpen}
        saleToPay={saleToPay}
        selectedMetodoPago={selectedMetodoPago}
        onMetodoPagoChange={setSelectedMetodoPago}
        onConfirmPayment={handleConfirmPayment}
        isConfirmingPayment={isConfirmingPayment}
      />

      <SaleReceiptTicketDialog
        open={receiptModalOpen}
        onOpenChange={setReceiptModalOpen}
        activeReceipt={activeReceipt}
        onPrint={() => handlePrintReceipt(activeReceipt, selectedSale)}
        isGeneratingReceipt={isGeneratingReceipt}
      />
    </div>
  )
}
