"use client"

import React, { useEffect, useState, useSyncExternalStore } from "react"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useUserPermissions } from "@/components/providers"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { formatDateCL } from "@/lib/formatters"
import {
  DateRangeFilter,
  ChartRentabilidadOrdenesTrabajo,
  ChartVentasPorMetodoPago,
  DetalleOperacionesInventario,
  type RentabilidadOrdenTrabajoPoint,
  type MetodoPagoDatum,
  type ProductoDestacado,
  type ConsumoInsumo,
} from "@/components/reportes"
import { FinancialSummaryCards } from "./components/FinancialSummaryCards"
import { TodaySalesDetail } from "./components/TodaySalesDetail"
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

const emptySubscribe = () => () => {}

function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}

const PHRASES = [
  "Cada pedalada cuenta, igual que cada detalle del taller.",
  "Una buena jornada empieza con una cadena bien aceitada.",
  "Paso a paso se llega lejos, en la ruta y en el negocio.",
  "Hoy es un buen día para dejar más de una bici lista.",
  "La constancia es la mejor transmisión.",
  "Ordena el taller y el resto rueda solo.",
  "Cada cliente que sale sonriendo es una cuesta superada.",
  "Menos prisa, más precisión: así se arma una buena bici.",
  "El mejor ajuste es el que se hace a tiempo.",
]

function getWelcome(name?: string | null) {
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour >= 5 && hour <= 11 ? "Buenos días" : hour >= 12 && hour <= 19 ? "Buenas tardes" : "Buenas noches"
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const firstName = name?.trim().split(/\s+/)[0]
  return {
    title: firstName ? `${greeting}, ${firstName}` : greeting,
    phrase: PHRASES[(dayOfYear + Number(hour >= 12) + Number(hour >= 20)) % PHRASES.length],
  }
}

export default function DashboardPage() {
  const isClient = useIsClient()
  const { session, status, hasPermission } = useUserPermissions()
  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange)
  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const hasAccess = hasPermission("reports:read")
  const welcome = isClient ? getWelcome(session?.user?.name) : null

  useEffect(() => {
    if (status !== "authenticated" || !hasAccess) return

    let isMounted = true

    getDashboardData(dateRange)
      .then((data) => {
        if (isMounted) {
          setReportsData(data)
          setIsLoading(false)
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setReportsData(null)
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los datos del dashboard.")
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [dateRange, hasAccess, status, reloadKey])

  const handleApplyDateRange = async (newRange: import("react-day-picker").DateRange) => {
    if (!newRange.from || !newRange.to) return
    setIsLoading(true)
    setError(null)
    setDateRange({ from: formatDateISO(newRange.from), to: formatDateISO(newRange.to) })
  }

  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  if (status === "loading") return <DashboardLoading />

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reportes y Analítica" description="Análisis financiero y operativo del taller por período." />
        <AccessDeniedState />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Reportes y Analítica" description="Análisis financiero y operativo del taller por período." />
        <EmptyState
          icon={AlertCircle}
          title="Error al cargar reportes"
          description={error}
          action={
            <Button variant="outline" onClick={handleRetry}>
              Reintentar
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300 motion-reduce:animate-none">
      <PageHeader
        title={welcome?.title ?? "Bienvenido"}
        description={welcome?.phrase ?? "Panel de control general y análisis de operaciones."}
      />
      <DateRangeFilter onApply={handleApplyDateRange} />
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Resumen financiero y operativo</h2>
          <span className="text-xs text-muted-foreground">
            Período: {formatDateCL(dateRange.from)} al {formatDateCL(dateRange.to)}
          </span>
        </div>
        {isLoading || !reportsData ? <FinancialSummarySkeleton /> : <FinancialSummaryCards data={reportsData.financialSummary} />}
      </div>
      {!isLoading && reportsData && <TodaySalesDetail sales={reportsData.todaySales} />}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Análisis comparativo</h2>
        {isLoading || !reportsData ? <ChartsSkeleton /> : <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><ChartRentabilidadOrdenesTrabajo data={reportsData.workOrderProfitability.series.map((item) => ({ date: item.date, ingresosOrdenesTrabajo: item.workOrderRevenue, costosRepuestos: item.partsCost })) satisfies RentabilidadOrdenTrabajoPoint[]} /><ChartVentasPorMetodoPago data={reportsData.paymentMethods.map((item) => ({ metodo: item.method, label: item.label, monto: item.amount, pagos: item.count })) satisfies MetodoPagoDatum[]} /></div>}
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Detalle de operaciones e inventario</h2>
        {isLoading || !reportsData ? <TableSkeleton /> : <DetalleOperacionesInventario productosDestacados={reportsData.topProducts.map((item) => ({ ranking: item.ranking, nombre: item.name, tipo: item.type, unidades: item.quantityDispatched, totalRecaudado: item.totalRevenue })) satisfies ProductoDestacado[]} consumoInsumos={reportsData.supplyConsumption.map((item) => ({ nombre: item.name, tipo: item.type, cantidadUsada: item.quantityUsed, ordenesAsociadas: item.associatedOrdersCount, costoTotal: item.totalCost })) satisfies ConsumoInsumo[]} onExportCSV={() => exportSupplyConsumption(reportsData, dateRange)} />}
      </div>
    </div>
  )
}

function exportSupplyConsumption(data: ReportsData, dateRange: DateRange) {
  if (!data.supplyConsumption.length) {
    toast.error("No hay datos de consumo para exportar.")
    return
  }
  const headers = "Insumo,Tipo,Cantidad usada,Ordenes asociadas,Costo total CLP\n"
  const rows = data.supplyConsumption
    .map(
      (item) =>
        `"${item.name.replaceAll('"', '""')}","${item.type.replaceAll('"', '""')}",${item.quantityUsed},${item.associatedOrdersCount},${item.totalCost}`
    )
    .join("\n")
  const link = document.createElement("a")
  link.href = URL.createObjectURL(
    new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" })
  )
  link.download = `consumo_insumos_${dateRange.from}_a_${dateRange.to}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
  toast.success("Consumo de insumos exportado correctamente.")
}

function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reportes y Analítica" description="Cargando panel de gestión ejecutiva..." />
      <FinancialSummarySkeleton />
      <ChartsSkeleton />
      <TableSkeleton />
    </div>
  )
}
