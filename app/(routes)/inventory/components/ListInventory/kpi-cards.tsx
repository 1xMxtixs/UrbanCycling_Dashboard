"use client"

import { Package, Boxes, AlertTriangle, AlertCircle } from "lucide-react"
import { MetricCard } from "@/components/common/MetricCard"
import { type ProductColumn } from "./columns"
import { isRegistroActivo } from "@/lib/registro-status"

interface KpiCardsProps {
  data: ProductColumn[]
}

export function KpiCards({ data }: KpiCardsProps) {
  const active = data.filter((product) => isRegistroActivo(product.estado))
  const totalProducts = active.length
  const totalStock = active.reduce((acc, p) => acc + p.stockActual, 0)
  const outOfStockCount = active.filter((p) => p.stockActual === 0).length
  const lowStockCount = active.filter(
    (p) => p.stockActual > 0 && p.stockActual <= p.stockMinimo
  ).length

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Productos Activos"
        value={totalProducts}
        description="En el catálogo vigente"
        icon={Package}
      />
      <MetricCard
        title="Stock Físico Total"
        value={`${totalStock.toLocaleString("es-CL")} u`}
        description="Unidades en productos activos"
        icon={Boxes}
      />
      <MetricCard
        title="Stock Bajo"
        value={lowStockCount}
        description="Requieren reposición pronto"
        icon={AlertTriangle}
        trend={lowStockCount > 0 ? { value: "Alerta", isPositive: false } : undefined}
      />
      <MetricCard
        title="Sin Existencias"
        value={outOfStockCount}
        description="Productos activos agotados"
        icon={AlertCircle}
        trend={outOfStockCount > 0 ? { value: "Agotado", isPositive: false } : undefined}
      />
    </div>
  )
}
