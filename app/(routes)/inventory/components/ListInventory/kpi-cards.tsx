"use client"

import { Package, Boxes, AlertTriangle, AlertCircle } from "lucide-react"
import { type ProductColumn } from "./columns"

interface KpiCardsProps {
  data: ProductColumn[]
}

export function KpiCards({ data }: KpiCardsProps) {
  const totalProducts = data.length
  
  const totalStock = data.reduce((acc, p) => acc + p.stockActual, 0)
  
  const outOfStockCount = data.filter(
    (product) => product.stockActual === 0,
  ).length

  const lowStockCount = data.filter(
    (product) =>
      product.stockActual > 0 && product.stockActual <= product.stockMinimo,
  ).length

  const kpis = [
    {
      title: "Total Productos",
      value: totalProducts,
      description: "Productos registrados en catálogo",
      icon: Package,
      bgClass: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50",
      textClass: "text-blue-700 dark:text-blue-400",
      iconClass: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Stock Total",
      value: `${totalStock} u`,
      description: "Unidades totales en inventario",
      icon: Boxes,
      bgClass: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50",
      textClass: "text-green-700 dark:text-green-400",
      iconClass: "bg-green-500/10 text-green-500",
    },
    {
      title: "Stock Bajo",
      value: lowStockCount,
      description: "Por debajo del mínimo definido",
      icon: AlertTriangle,
      bgClass: "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800/50",
      textClass: "text-yellow-700 dark:text-yellow-400",
      iconClass: "bg-yellow-500/10 text-yellow-500",
      badge: lowStockCount > 0 ? "Revisar" : null,
    },
    {
      title: "Sin Stock",
      value: outOfStockCount,
      description: "Sin unidades disponibles",
      icon: AlertCircle,
      bgClass: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50",
      textClass: "text-red-700 dark:text-red-400",
      iconClass: "bg-red-500/10 text-red-500",
      badge: outOfStockCount > 0 ? "Crítico" : null,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${kpi.bgClass}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {kpi.title}
                </p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {kpi.value}
                </h3>
              </div>
              <div className={`rounded-lg p-2.5 ${kpi.iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{kpi.description}</p>
            {kpi.badge && (
              <span className="absolute top-2 right-2 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                {kpi.badge}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
