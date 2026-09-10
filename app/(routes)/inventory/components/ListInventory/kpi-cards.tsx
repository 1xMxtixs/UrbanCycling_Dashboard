"use client"

import { Package, Boxes, AlertTriangle, AlertCircle } from "lucide-react"
import { MetricCard } from "@/components/common/MetricCard"
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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <MetricCard
        title="Catálogo General"
        value={totalProducts}
        description="Productos y repuestos registrados"
        icon={Package}
      />
      <MetricCard
        title="Stock Físico Total"
        value={`${totalStock.toLocaleString("es-CL")} u`}
        description="Unidades acumuladas en bodega"
        icon={Boxes}
      />
      <MetricCard
        title="Stock Bajo Mínimo"
        value={lowStockCount}
        description="Requieren reposición pronto"
        icon={AlertTriangle}
        trend={lowStockCount > 0 ? { value: "Alerta", isPositive: false } : undefined}
      />
      <MetricCard
        title="Sin Existencias"
        value={outOfStockCount}
        description="Productos agotados en tienda"
        icon={AlertCircle}
        trend={outOfStockCount > 0 ? { value: "Agotado", isPositive: false } : undefined}
      />
    </div>
  )
}
