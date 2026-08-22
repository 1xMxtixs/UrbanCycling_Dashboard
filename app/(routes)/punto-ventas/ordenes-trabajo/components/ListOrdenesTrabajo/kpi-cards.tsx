"use client"

import { Play, Pause, CheckCircle2, AlertTriangle, PackageCheck } from "lucide-react"
import { MetricCard } from "@/components/MetricCard"
import { WorkOrder } from "../../types"

interface KpiCardsProps {
  orders: WorkOrder[]
}

export function KpiCards({ orders }: KpiCardsProps) {
  const now = new Date()

  // 1. Activas (En curso)
  const activeOrdersCount = orders.filter(
    (o) => o.estadoOrden === "En curso"
  ).length

  // 2. En Espera
  const pendingOrdersCount = orders.filter(
    (o) => o.estadoOrden === "En espera"
  ).length

  // 3. Completadas Hoy (solo Entregado)
  const completedTodayCount = orders.filter((o) => {
    if (!o.fechaEntregaReal) return false
    const dReal = new Date(o.fechaEntregaReal)
    return (
      o.estadoOrden === "Entregado" &&
      dReal.getDate() === now.getDate() &&
      dReal.getMonth() === now.getMonth() &&
      dReal.getFullYear() === now.getFullYear()
    )
  }).length

  // 4. Por Entregar (Listo para entregar)
  const readyToDeliverCount = orders.filter(
    (o) => o.estadoOrden === "Listo para entregar"
  ).length

  // 5. Retrasadas (Estimado pasado y no completado)
  const delayedOrdersCount = orders.filter((o) => {
    const isFullyCompleted = ["Listo para entregar", "Entregado"].includes(o.estadoOrden)
    const dEstimada = new Date(o.fechaEntregaEstimada)
    return dEstimada < now && !isFullyCompleted
  }).length

  const kpis = [
    {
      title: "Activas",
      value: activeOrdersCount,
      description: "Órdenes en proceso de reparación",
      icon: Play,
    },
    {
      title: "En Espera",
      value: pendingOrdersCount,
      description: "Pausadas o esperando repuestos",
      icon: Pause,
    },
    {
      title: "Por Entregar",
      value: readyToDeliverCount,
      description: "Listas para ser retiradas por el cliente",
      icon: PackageCheck,
    },
    {
      title: "Completadas Hoy",
      value: completedTodayCount,
      description: "Servicios entregados el día de hoy",
      icon: CheckCircle2,
    },
    {
      title: "Retrasadas",
      value: delayedOrdersCount,
      description: "Fecha estimada de entrega vencida",
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
