"use client"

import { useState } from "react"
import { AlertTriangle, ChevronDown } from "lucide-react"

import { WorkOrderStatusBadge } from "@/components/common/WorkOrderStatusBadge"
import { Button } from "@/components/ui/button"
import { formatClientName } from "@/lib/formatters"
import { ESTADOS_OT_CERRADOS, type EstadoOt } from "@/lib/work-order-status"
import { WorkOrder } from "../../types"

interface UpcomingDeadlinesProps {
  orders: WorkOrder[]
  onViewDetails: (order: WorkOrder) => void
}

const VISIBLE_LIMIT = 5
const DAY_MS = 86_400_000

function getCalendarDayDifference(order: WorkOrder, today: Date) {
  const raw = new Date(order.fechaEntregaEstimada)
  if (Number.isNaN(raw.getTime())) return null
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const delivery0 = new Date(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate())
  return Math.round((delivery0.getTime() - today0.getTime()) / DAY_MS)
}

function getDeadlineLabel(days: number) {
  if (days < 0) {
    const lateDays = -days
    return { label: `Retrasada ${lateDays} ${lateDays === 1 ? "día" : "días"}`, className: "text-destructive" }
  }
  if (days === 0) return { label: "Vence hoy", className: "text-foreground" }
  if (days === 1) return { label: "Vence mañana", className: "text-foreground" }
  return { label: "Vence en 2 días", className: "text-foreground" }
}
export function UpcomingDeadlines({ orders, onViewDetails }: UpcomingDeadlinesProps) {
  const [showAll, setShowAll] = useState(false)
  const today = new Date()
  const upcomingOrders = orders
    .map((order) => ({ order, days: getCalendarDayDifference(order, today) }))
    .filter(({ order, days }) => days !== null && days <= 2 && !ESTADOS_OT_CERRADOS.includes(order.estadoOrden as EstadoOt))
    .sort((a, b) => a.days! - b.days!)

  if (upcomingOrders.length === 0) return null

  const visibleOrders = showAll ? upcomingOrders : upcomingOrders.slice(0, VISIBLE_LIMIT)
  const hiddenCount = upcomingOrders.length - VISIBLE_LIMIT

  return (
    <section className="overflow-hidden rounded-xl border border-destructive/30 bg-destructive/5">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">Atención requerida</h2>
              <span className="rounded-full border border-destructive/25 bg-destructive/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-destructive">{upcomingOrders.length}</span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Órdenes vencidas o que vencen en las próximas 48 horas.</p>
          </div>
        </div>
      </div>
      <div>
        {visibleOrders.map(({ order, days }) => {
          const deadline = getDeadlineLabel(days!)
          const bike = order.bicicletas?.[0]
          const bikeName = bike ? `${bike.marca} ${bike.modelo}`.trim() : "Sin bicicleta"
          return (
            <button
              key={order.idOrdenDeTrabajo}
              type="button"
              className="flex w-full items-center justify-between gap-3 border-t border-destructive/15 px-4 py-2.5 text-left transition-colors hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring motion-reduce:transition-none"
              onClick={() => onViewDetails(order)}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 font-mono text-xs font-semibold tabular-nums text-foreground">#{order.idOrdenDeTrabajo}</span>
                <span className="min-w-0">
                  <span className="block line-clamp-1 text-sm font-semibold text-foreground">{formatClientName(order.cliente)}</span>
                  <span className="block line-clamp-1 text-xs text-muted-foreground">{bikeName}</span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <span className={`text-xs font-semibold tabular-nums ${deadline.className}`}>{deadline.label}</span>
                <WorkOrderStatusBadge estado={order.estadoOrden} nombre={order.estadoOrdenNombre} fechaEntregaEstimada={order.fechaEntregaEstimada} />
              </span>
            </button>
          )
        })}
      </div>
      {hiddenCount > 0 && (
        <div className="flex justify-center border-t border-destructive/15 p-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll((current) => !current)}>
            {showAll ? "Ver menos" : `Ver las ${hiddenCount} órdenes`}
            <ChevronDown className="ml-1 h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </section>
  )
}
