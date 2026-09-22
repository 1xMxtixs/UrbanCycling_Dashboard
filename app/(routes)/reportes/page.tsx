"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Package, Wrench } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { DataTableContainer } from "@/components/common/DataTableContainer"
import { Tabs } from "@/components/ui/tabs"
import { SegmentedTabs, SegmentedTabItem } from "@/components/forms/SegmentedTabs"
import { cn } from "@/lib/utils"

import { DateRangeFilter } from "./components/DateRangeFilter"
import { FinancialSummaryCards } from "./components/FinancialSummaryCards"
import { LaborVsPartsChart } from "./components/LaborVsPartsChart"
import { PaymentMethodsChart } from "./components/PaymentMethodsChart"
import { TopProductsTable } from "./components/TopProductsTable"
import { SupplyConsumptionTable } from "./components/SupplyConsumptionTable"
import { AccessDeniedState } from "./components/AccessDeniedState"
import {
  FinancialSummarySkeleton,
  ChartsSkeleton,
  TableSkeleton,
} from "./components/ReportsSkeletons"

import { getMockReportsData } from "./mockData"
import type { DateRange, ReportsData } from "./types"

export default function ReportesPage() {
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
  const [activeTab, setActiveTab] = useState<string>("productos")

  // Comprobar rol o permisos (Administrador o reports:read)
  const userRole = session?.user?.rol?.toLowerCase() || ""
  const userPermisos = session?.user?.permisos || []
  const hasAccess =
    userRole === "administrador" ||
    userRole === "admin" ||
    userPermisos.includes("reports:read")

  const handleApplyDateRange = (newRange: DateRange) => {
    setIsLoading(true)
    setDateRange(newRange)
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

  const tabItems: SegmentedTabItem[] = [
    {
      value: "productos",
      label: "Productos Destacados",
      icon: Package,
      count: reportsData?.topProducts.length,
    },
    {
      value: "insumos",
      label: "Consumo de Insumos",
      icon: Wrench,
      count: reportsData?.supplyConsumption.length,
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* 1. Header Estándar */}
      <PageHeader
        title="Reportes y Analítica"
        description="Análisis financiero y operativo del taller por período. Consulta de ingresos, mano de obra, métodos de pago e inventario."
      />

      {/* 2. Filtro Sticky de Fechas */}
      <DateRangeFilter
        initialRange={dateRange}
        onApply={handleApplyDateRange}
        isLoading={isLoading}
      />

      {/* 3. Grupo A: Resumen Financiero */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resumen Financiero & Operativo
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

      {/* 4. Grupo B: Gráficos Comparativos */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Análisis Comparativo
        </h2>

        {isLoading || !reportsData ? (
          <ChartsSkeleton />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-1">
            <LaborVsPartsChart data={reportsData.laborVsParts} />
            <PaymentMethodsChart data={reportsData.paymentMethods} />
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
            <DataTableContainer
              title={
                activeTab === "productos"
                  ? "Productos y Repuestos Destacados"
                  : "Reporte de Consumo de Insumos"
              }
              description={
                activeTab === "productos"
                  ? "Artículos con mayor demanda y volumen de recaudación en el período seleccionado."
                  : "Registro de insumos y materiales utilizados en órdenes de trabajo completadas."
              }
              toolbar={
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <SegmentedTabs items={tabItems} className="mb-2" />
                </Tabs>
              }
            >
              {activeTab === "productos" ? (
                <TopProductsTable products={reportsData.topProducts} />
              ) : (
                <SupplyConsumptionTable
                  supplies={reportsData.supplyConsumption}
                  dateRange={dateRange}
                />
              )}
            </DataTableContainer>
          </div>
        )}
      </div>
    </div>
  )
}
