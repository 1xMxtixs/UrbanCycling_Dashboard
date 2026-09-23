"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { PageHeader } from "@/components/common/PageHeader"

import { DateRangeFilter } from "./components/DateRangeFilter"
import { FinancialSummaryCards } from "./components/FinancialSummaryCards"
import { TodaySalesDetail } from "./components/TodaySalesDetail"
import { ChartManoObraVsRepuestos, type ManoObraVsRepuestosPoint } from "@/components/reportes/chart-mano-obra-vs-repuestos"
import { ChartVentasPorMetodoPago, type MetodoPagoDatum } from "@/components/reportes/chart-ventas-por-metodo-pago"
import { DetalleOperacionesInventario } from "@/components/reportes/detalle-operaciones-inventario"
import type { ProductoDestacado } from "@/components/reportes/productos-destacados-columns"
import type { ConsumoInsumo } from "@/components/reportes/consumo-insumos-columns"
import { AccessDeniedState } from "./components/AccessDeniedState"
import {
  FinancialSummarySkeleton,
  ChartsSkeleton,
  TableSkeleton,
} from "./components/ReportsSkeletons"

import { getMockReportsData } from "./mockData"
import type { DateRange, ReportsData } from "./types"

export default function DashboardPage() {
  const { data: session, status } = useSession()

  // Fechas iniciales: primer día del mes actual a hoy
  const getInitialRange = (): DateRange => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const format = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, "0")
      const day = String(d.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }
    return {
      from: format(firstDay),
      to: format(now),
    }
  }

  const [dateRange, setDateRange] = useState<DateRange>(getInitialRange)
  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Comprobar rol exclusivamente Administrador
  const userRole = session?.user?.rol?.toLowerCase() || ""
  const hasAccess = userRole === "administrador" || userRole === "admin"

  const formatDateISO = (d: Date): string => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const handleApplyDateRange = async (newRange: import("react-day-picker").DateRange) => {
    if (!newRange.from || !newRange.to) return
    setIsLoading(true)
    const formattedRange: DateRange = {
      from: formatDateISO(newRange.from),
      to: formatDateISO(newRange.to),
    }
    setDateRange(formattedRange)

    // Simula la duración real del fetch de datos para el período
    await new Promise((resolve) => setTimeout(resolve, 350))
    const data = getMockReportsData(formattedRange)
    setReportsData(data)
    setIsLoading(false)
  }

  // Carga de datos coordinada según el rango de fecha
  useEffect(() => {
    if (!hasAccess && status !== "loading") return

    let isMounted = true

    // Simulamos una llamada asíncrona fluida coordinada (300ms)
    const timer = setTimeout(() => {
      if (isMounted) {
        const data = getMockReportsData(dateRange)
        setReportsData(data)
        setIsLoading(false)
      }
    }, 300)

    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [dateRange, hasAccess, status])

  // Verificación de carga de sesión
  if (status === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reportes y Analítica"
          description="Cargando panel de gestión ejecutiva..."
        />
        <FinancialSummarySkeleton />
        <ChartsSkeleton />
        <TableSkeleton />
      </div>
    )
  }

  // Guard de acceso: solo Administrador o permisos válidos
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reportes y Analítica"
          description="Análisis financiero y operativo del taller por período."
        />
        <AccessDeniedState />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. Header Estándar */}
      <PageHeader
        title="Reportes y Analítica"
        description="Análisis financiero y operativo del taller por período. Consulta de ingresos, mano de obra, métodos de pago e inventario."
      />

      {/* 2. Filtro de Fechas */}
      <DateRangeFilter onApply={handleApplyDateRange} />

      {/* 3. Grupo A: Resumen Financiero */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resumen Financiero &amp; Operativo
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Período: {dateRange.from} al {dateRange.to}
          </span>
        </div>

        {isLoading || !reportsData ? (
          <FinancialSummarySkeleton />
        ) : (
          <div className="transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-1">
            <FinancialSummaryCards data={reportsData.financialSummary} />
          </div>
        )}
      </div>

      {/* Detalle de Ventas de Hoy (Colapsable) */}
      {!isLoading && reportsData && (
        <div className="transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-1">
          <TodaySalesDetail sales={reportsData.todaySales} />
        </div>
      )}

      {/* 4. Grupo B: Gráficos Comparativos */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Análisis Comparativo
        </h2>

        {isLoading || !reportsData ? (
          <ChartsSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-1">
            <ChartManoObraVsRepuestos
              data={
                reportsData.laborVsParts.series.map((s) => ({
                  date: s.date,
                  manoObra: s.laborAmount,
                  repuestos: s.partsAmount,
                })) satisfies ManoObraVsRepuestosPoint[]
              }
            />
            <ChartVentasPorMetodoPago
              data={
                reportsData.paymentMethods.map((pm) => ({
                  metodo: pm.method,
                  label: pm.label,
                  monto: pm.amount,
                  pagos: pm.count,
                })) satisfies MetodoPagoDatum[]
              }
            />
          </div>
        )}
      </div>

      {/* 5. Grupo C: Detalle Operativo en Pestañas Conmutables */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Detalle de Operaciones e Inventario
            </h2>
          </div>
        </div>

        {isLoading || !reportsData ? (
          <TableSkeleton />
        ) : (
          <div className="transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-1">
            <DetalleOperacionesInventario
              productosDestacados={
                reportsData.topProducts.map((p) => ({
                  ranking: p.ranking,
                  nombre: p.name,
                  sku: p.sku || "",
                  categoria: p.category || "General",
                  unidades: p.quantitySold,
                  totalRecaudado: p.totalRevenue,
                })) satisfies ProductoDestacado[]
              }
              consumoInsumos={
                reportsData.supplyConsumption.map((c) => ({
                  codigo: c.code,
                  nombre: c.name,
                  categoria: c.category,
                  cantidadUsada: `${c.quantityUsed} ${c.unit}`,
                  ordenesAsociadas: c.associatedOrdersCount,
                  costoTotalEst: c.estimatedCost,
                })) satisfies ConsumoInsumo[]
              }
              onExportCSV={() => {
                if (!reportsData.supplyConsumption.length) return
                const headers = "Codigo,Insumo,Categoria,Cantidad Utilizada,Unidad,Ordenes Asociadas,Costo Estimado CLP\n"
                const rows = reportsData.supplyConsumption
                  .map(
                    (item) =>
                      `"${item.code}","${item.name}","${item.category}",${item.quantityUsed},"${item.unit}",${item.associatedOrdersCount},${item.estimatedCost}`
                  )
                  .join("\n")

                const blob = new Blob([headers + rows], {
                  type: "text/csv;charset=utf-8;",
                })
                const link = document.createElement("a")
                const url = URL.createObjectURL(blob)
                link.setAttribute("href", url)
                link.setAttribute(
                  "download",
                  `consumo_insumos_${dateRange.from}_a_${dateRange.to}.csv`
                )
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
