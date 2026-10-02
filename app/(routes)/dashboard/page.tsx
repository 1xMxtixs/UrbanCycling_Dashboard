"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { DateRangeFilter } from "./components/DateRangeFilter"
import { FinancialSummaryCards } from "./components/FinancialSummaryCards"
import { TodaySalesDetail } from "./components/TodaySalesDetail"
import { ChartRentabilidadOrdenesTrabajo, type RentabilidadOrdenTrabajoPoint } from "@/components/reportes/chart-mano-obra-vs-repuestos"
import { ChartVentasPorMetodoPago, type MetodoPagoDatum } from "@/components/reportes/chart-ventas-por-metodo-pago"
import { DetalleOperacionesInventario } from "@/components/reportes/detalle-operaciones-inventario"
import type { ProductoDestacado } from "@/components/reportes/productos-destacados-columns"
import type { ConsumoInsumo } from "@/components/reportes/consumo-insumos-columns"
import { AccessDeniedState } from "./components/AccessDeniedState"
import { FinancialSummarySkeleton, ChartsSkeleton, TableSkeleton } from "./components/ReportsSkeletons"
import { getDashboardData } from "./data"
import type { DateRange, ReportsData } from "./types"

function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getInitialRange(): DateRange {
  const now = new Date()
  return { from: formatDateISO(new Date(now.getFullYear(), now.getMonth(), 1)), to: formatDateISO(now) }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange)
  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasAccess = session?.user?.permisos?.includes("reports:read") ?? false

  const loadReports = useCallback(async (range: DateRange) => {
    setIsLoading(true)
    setError(null)
    try {
      setReportsData(await getDashboardData(range))
    } catch (loadError) {
      setReportsData(null)
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los datos del dashboard.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (status === "authenticated" && hasAccess) void loadReports(dateRange)
      if (status !== "loading" && !hasAccess) setIsLoading(false)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [dateRange, hasAccess, loadReports, status])

  const handleApplyDateRange = async (newRange: import("react-day-picker").DateRange) => {
    if (!newRange.from || !newRange.to) return
    setDateRange({ from: formatDateISO(newRange.from), to: formatDateISO(newRange.to) })
  }

  if (status === "loading") return <DashboardLoading />

  if (!hasAccess) {
    return <div className="space-y-6"><PageHeader title="Reportes y Analítica" description="Análisis financiero y operativo del taller por período." /><AccessDeniedState /></div>
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reportes y Analítica" description="Análisis financiero y operativo del taller por período." />
        <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => void loadReports(dateRange)}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <PageHeader title="Reportes y Analítica" description="Ingresos, órdenes de trabajo, pagos e inventario con datos registrados." />
      <DateRangeFilter onApply={handleApplyDateRange} />
      <div className="space-y-2">
        <div className="flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Resumen financiero y operativo</h2><span className="text-[11px] text-muted-foreground">Período: {dateRange.from} al {dateRange.to}</span></div>
        {isLoading || !reportsData ? <FinancialSummarySkeleton /> : <FinancialSummaryCards data={reportsData.financialSummary} />}
      </div>
      {!isLoading && reportsData && <TodaySalesDetail sales={reportsData.todaySales} />}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Análisis comparativo</h2>
        {isLoading || !reportsData ? <ChartsSkeleton /> : <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><ChartRentabilidadOrdenesTrabajo data={reportsData.workOrderProfitability.series.map((item) => ({ date: item.date, ingresosOrdenesTrabajo: item.workOrderRevenue, costosRepuestos: item.partsCost })) satisfies RentabilidadOrdenTrabajoPoint[]} /><ChartVentasPorMetodoPago data={reportsData.paymentMethods.map((item) => ({ metodo: item.method, label: item.label, monto: item.amount, pagos: item.count })) satisfies MetodoPagoDatum[]} /></div>}
      </div>
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detalle de operaciones e inventario</h2>
        {isLoading || !reportsData ? <TableSkeleton /> : <DetalleOperacionesInventario productosDestacados={reportsData.topProducts.map((item) => ({ ranking: item.ranking, nombre: item.name, tipo: item.type, unidades: item.quantityDispatched, totalRecaudado: item.totalRevenue })) satisfies ProductoDestacado[]} consumoInsumos={reportsData.supplyConsumption.map((item) => ({ nombre: item.name, tipo: item.type, cantidadUsada: item.quantityUsed, ordenesAsociadas: item.associatedOrdersCount, costoTotal: item.totalCost })) satisfies ConsumoInsumo[]} onExportCSV={() => exportSupplyConsumption(reportsData, dateRange)} />}
      </div>
    </div>
  )
}

function exportSupplyConsumption(data: ReportsData, dateRange: DateRange) {
  if (!data.supplyConsumption.length) return
  const headers = "Insumo,Tipo,Cantidad usada,Ordenes asociadas,Costo total CLP\n"
  const rows = data.supplyConsumption.map((item) => `"${item.name.replaceAll('"', '""')}","${item.type.replaceAll('"', '""')}",${item.quantityUsed},${item.associatedOrdersCount},${item.totalCost}`).join("\n")
  const link = document.createElement("a")
  link.href = URL.createObjectURL(new Blob([headers + rows], { type: "text/csv;charset=utf-8;" }))
  link.download = `consumo_insumos_${dateRange.from}_a_${dateRange.to}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}

function DashboardLoading() {
  return <div className="space-y-6"><PageHeader title="Reportes y Analítica" description="Cargando panel de gestión ejecutiva..." /><FinancialSummarySkeleton /><ChartsSkeleton /><TableSkeleton /></div>
}
