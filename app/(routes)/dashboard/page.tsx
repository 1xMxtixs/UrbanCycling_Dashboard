"use client"

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react"
import dynamic from "next/dynamic"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useUserPermissions } from "@/components/providers"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { formatTipoProducto } from "@/lib/product-types"
import { cn } from "@/lib/utils"
import {
  DateRangeFilter,
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

const ChartRentabilidadOrdenesTrabajo = dynamic(
  () =>
    import("@/components/reportes").then(
      (mod) => mod.ChartRentabilidadOrdenesTrabajo
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[340px] w-full animate-pulse rounded-xl bg-muted/40" />
    ),
  }
)

const ChartVentasPorMetodoPago = dynamic(
  () =>
    import("@/components/reportes").then(
      (mod) => mod.ChartVentasPorMetodoPago
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[340px] w-full animate-pulse rounded-xl bg-muted/40" />
    ),
  }
)

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
  const requestRef = useRef(0)

  const hasAccess = hasPermission("reports:read")
  const welcome = isClient ? getWelcome(session?.user?.name) : null

  useEffect(() => {
    if (status !== "authenticated" || !hasAccess) return

    const id = ++requestRef.current
    let isMounted = true

    getDashboardData(dateRange)
      .then((data) => {
        if (!isMounted || id !== requestRef.current) return
        setReportsData(data)
      })
      .catch((loadError) => {
        if (!isMounted || id !== requestRef.current) return
        setReportsData(null)
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los datos del dashboard.")
      })
      .finally(() => {
        if (isMounted && id === requestRef.current) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [dateRange, hasAccess, status, reloadKey])

  const handleApplyDateRange = (newRange: import("react-day-picker").DateRange) => {
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

  const isRefreshing = isLoading && reportsData !== null

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
      <div className={cn("space-y-6 transition-opacity duration-200 motion-reduce:transition-none", isRefreshing && "opacity-60")} aria-busy={isRefreshing}>
        <section className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-sm font-semibold text-foreground">Resumen financiero y operativo</h2>
            <DateRangeFilter value={dateRange} onApply={handleApplyDateRange} />
          </div>
          {reportsData === null ? <FinancialSummarySkeleton /> : <FinancialSummaryCards data={reportsData.financialSummary} />}
        </section>
        {reportsData && <TodaySalesDetail sales={reportsData.todaySales} />}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Análisis comparativo</h2>
          {reportsData === null ? <ChartsSkeleton /> : <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"><ChartRentabilidadOrdenesTrabajo data={reportsData.workOrderProfitability.series.map((item) => ({ date: item.date, ingresosOrdenesTrabajo: item.workOrderRevenue, costosRepuestos: item.partsCost })) satisfies RentabilidadOrdenTrabajoPoint[]} /><ChartVentasPorMetodoPago data={reportsData.paymentMethods.map((item) => ({ metodo: item.method, label: item.label, monto: item.amount, pagos: item.count })) satisfies MetodoPagoDatum[]} /></div>}
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Detalle de operaciones e inventario</h2>
          {reportsData === null ? <TableSkeleton /> : <DetalleOperacionesInventario productosDestacados={reportsData.topProducts.map((item) => ({ ranking: item.ranking, nombre: item.name, tipo: item.type, unidades: item.quantityDispatched, totalRecaudado: item.totalRevenue })) satisfies ProductoDestacado[]} consumoInsumos={reportsData.supplyConsumption.map((item) => ({ nombre: item.name, tipo: item.type, cantidadUsada: item.quantityUsed, ordenesAsociadas: item.associatedOrdersCount, costoTotal: item.totalCost })) satisfies ConsumoInsumo[]} onExportProductsCSV={() => exportTopProducts(reportsData, dateRange)} onExportCSV={() => exportSupplyConsumption(reportsData, dateRange)} />}
        </section>
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

function exportTopProducts(data: ReportsData, dateRange: DateRange) {
  if (!data.topProducts.length) {
    toast.error("No hay productos destacados para exportar.")
    return
  }
  const headers = "Ranking,Producto,Tipo,Unidades despachadas,Total recaudado CLP\n"
  const rows = data.topProducts
    .map((item) =>
      `${item.ranking},"${item.name.replaceAll('"', '""')}","${formatTipoProducto(item.type).replaceAll('"', '""')}",${item.quantityDispatched},${item.totalRevenue}`
    )
    .join("\n")
  const link = document.createElement("a")
  link.href = URL.createObjectURL(
    new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" })
  )
  link.download = `productos_destacados_${dateRange.from}_a_${dateRange.to}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
  toast.success("Productos destacados exportados correctamente.")
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
