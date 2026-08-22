"use client"

import { Package, Boxes, AlertTriangle, AlertCircle } from "lucide-react"
import { MetricCard } from "@/components/MetricCard"
import { type ProductColumn } from "./columns"

interface KpiCardsProps {
  data: ProductColumn[]
}

export function KpiCards({ data }: KpiCardsProps) {
  const totalProducts = data.length
  const totalStock = data.reduce((acc, p) => acc + p.stockActual, 0)
  const outOfStockCount = data.filter((p) => p.stockActual === 0).length
  const lowStockCount = data.filter(
    (p) => p.stockActual > 0 && p.stockActual <= p.stockMinimo
  ).length

  const kpis = [
    {
      title: "Total Productos",
      value: totalProducts,
      description: "Productos registrados en catálogo",
      icon: Package,
    },
    {
      title: "Stock Total",
      value: `${totalStock} u`,
      description: "Unidades totales en inventario",
      icon: Boxes,
    },
    {
      title: "Stock Bajo",
      value: lowStockCount,
      description: "Por debajo del mínimo definido",
      icon: AlertTriangle,
    },
    {
      title: "Sin Stock",
      value: outOfStockCount,
      description: "Sin unidades disponibles",
      icon: AlertCircle,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {kpis.map((kpi) => {
        return (
          <MetricCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            description={kpi.description}
            icon={kpi.icon}
          />
        )
      })}
    </div>
  )
}
