"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { formatClientName, formatCLP } from "@/lib/formatters"
import { printReceipt } from "@/lib/print-receipt"
import { ShoppingBag, DollarSign, Clock, Ban } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { MetricCard } from "@/components/common/MetricCard"
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog"
import { EmptyState } from "@/components/common/EmptyState"

import { DataTable } from "./data-table"
import { columns } from "./columns"
import { SaleDetailDialog } from "./SaleDetailDialog"
import { SalePayDialog } from "./SalePayDialog"
import { SaleReceiptTicketDialog } from "./SaleReceiptTicketDialog"
import { SaleOperation, type DocumentoTributario } from "../../types"
import { ESTADO_PAGO } from "@/lib/payment-status"
import { ESTADO_VENTA, isVentaAnulada } from "@/lib/sale-status"
import { METODO_PAGO_DEFECTO } from "@/lib/payment-methods"
import { useSearchDetailNavigation } from "@/hooks/use-search-detail-navigation"

export function ListVentas() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const saleIdParam = searchParams.get("ventaId")
  const searchParam = searchParams.get("search") ?? ""
  const [sales, setSales] = useState<SaleOperation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const {
    activeItem: selectedSale,
    isOpen: openDetailsModal,
    openLocal: openSaleDetail,
    close: closeSaleDetail,
    setLocalItem: setSelectedSale,
  } = useSearchDetailNavigation(saleIdParam, sales, (sale) => Number(sale.venta.idVenta))

  const [payModalOpen, setPayModalOpen] = useState(false)
  const [saleToPay, setSaleToPay] = useState<{ idVenta: number; total: number } | null>(null)
  const [selectedMetodoPago, setSelectedMetodoPago] = useState<string>(METODO_PAGO_DEFECTO)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState<DocumentoTributario | null>(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false)

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [saleToCancel, setSaleToCancel] = useState<SaleOperation | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const getSales = useCallback(async () => {
    setIsLoading(true)
    setHasLoadError(false)
    try {
      const response = await fetch("/api/punto-venta", {
        cache: "no-store",
      })

      if (!response.ok) {
        setSales([])
        setHasLoadError(true)
        toast.error("No fue posible consultar las ventas en mostrador.")
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
      setHasLoadError(true)
      setSales([])
      toast.error("No fue posible consultar las ventas en mostrador.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Difiere la carga inicial para evitar una actualización de estado durante
    // el efecto y mantiene la suscripción para actualizaciones de ventas.
    void Promise.resolve().then(() => getSales())
    window.addEventListener("sales:refresh", getSales)

    return () => {
      window.removeEventListener("sales:refresh", getSales)
    }
  }, [getSales])

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
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el estado de la venta")
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePayClick = (idVenta: number, total: number) => {
    setSaleToPay({ idVenta, total: Number(total) })
    setSelectedMetodoPago(METODO_PAGO_DEFECTO)
    setPayModalOpen(true)
  }

  const handleCancelClick = (op: SaleOperation) => {
    setSaleToCancel(op)
    setCancelModalOpen(true)
  }

  const handleConfirmCancelSale = async () => {
    if (!saleToCancel) return
    setIsCancelling(true)
    try {
      await handleUpdateStatus(
        Number(saleToCancel.venta.idVenta),
        ESTADO_PAGO.ANULADA,
        ESTADO_VENTA.ANULADA
      )
      setCancelModalOpen(false)
      setSaleToCancel(null)
    } finally {
      setIsCancelling(false)
    }
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
          estadoPago: ESTADO_PAGO.PAGADA,
          metodoPago: selectedMetodoPago,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Error al registrar pago")
      }

      toast.success("Pago registrado correctamente.")
      setPayModalOpen(false)
      closeSaleDetail()
      getSales()
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el pago")
    } finally {
      setIsConfirmingPayment(false)
    }
  }

  const handleViewDetails = (op: SaleOperation) => {
    openSaleDetail(op)
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
        throw new Error(errorData.message || "Error al generar comprobante")
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "No se pudo generar el comprobante.")
    } finally {
      setIsGeneratingReceipt(false)
    }
  }

  // Cálculos de KPIs
  const totalSalesCount = sales.length
  const totalRevenue = sales
    .filter((s) => !isVentaAnulada(s.estadoVenta) && s.estadoPago === ESTADO_PAGO.PAGADA)
    .reduce((sum, s) => sum + Number(s.total), 0)
  const pendingRevenue = sales
    .filter((s) => !isVentaAnulada(s.estadoVenta) && s.estadoPago === ESTADO_PAGO.PENDIENTE)
    .reduce((sum, s) => sum + Number(s.total), 0)
  const canceledCount = sales
    .filter((s) => isVentaAnulada(s.estadoVenta))
    .length
  const sortedSales = useMemo(
    () => [...sales].sort((a, b) => Number(b.venta.idVenta) - Number(a.venta.idVenta)),
    [sales]
  )

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

  if (hasLoadError) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <EmptyState
          icon={ShoppingBag}
          title="No se pudieron cargar las ventas"
          description="Revisa la conexión e intenta cargar el listado nuevamente."
        />
        <div className="flex justify-center">
          <Button onClick={() => void getSales()}>Reintentar carga</Button>
        </div>
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
          value={formatCLP(totalRevenue)}
          description="Total ventas pagadas"
          icon={DollarSign}
        />
        <MetricCard
          title="Por Cobrar"
          value={formatCLP(pendingRevenue)}
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
        data={sortedSales}
        initialSearch={searchParam}
        onViewDetails={handleViewDetails}
        onUpdateStatus={handleUpdateStatus}
        updatingId={updatingId}
        onPayClick={handlePayClick}
        onGenerateReceipt={handleGenerateReceipt}
        onCancelClick={handleCancelClick}
      />

      <SaleDetailDialog
        open={openDetailsModal}
        onOpenChange={(open) => {
          if (!open) {
            closeSaleDetail()
          }
          if (!open && saleIdParam) {
            router.replace("/punto-ventas/ventas", { scroll: false })
          }
        }}
        sale={selectedSale}
        onPayClick={handlePayClick}
        onUpdateStatus={handleUpdateStatus}
        onCancelClick={handleCancelClick}
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
        onPrint={() => {
          if (!activeReceipt) return
          printReceipt({
            dte: activeReceipt,
            clientLabel: selectedSale?.cliente
              ? formatClientName(selectedSale.cliente)
              : "Cliente general",
            clientRut: selectedSale?.cliente?.rut,
            lines: selectedSale?.venta?.lineasDeVenta || [],
            detailLabel: "DETALLE DE PRODUCTOS:",
            lineFallback: "Producto",
            thanksMessage: "¡Gracias por su compra en Urban Cycling!",
            onError: () => toast.error("No se pudo preparar la impresión."),
          })
        }}
        isGeneratingReceipt={isGeneratingReceipt}
      />

      <StatusToggleDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        entityLabel="venta"
        entityName={saleToCancel ? `Venta #${saleToCancel.venta.idVenta}` : ""}
        title={saleToCancel ? `¿Anular Venta #${saleToCancel.venta.idVenta}?` : "¿Anular venta?"}
        description="La venta será anulada en el sistema y cambiará su estado a Anulada. Esta acción no se puede revertir."
        confirmLabel="Confirmar Anulación"
        actionVariant="destructive"
        isSubmitting={isCancelling}
        onConfirm={handleConfirmCancelSale}
      />
    </div>
  )
}
