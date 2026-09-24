"use client"

import { Wrench, CheckCircle2, DollarSign, PowerOff } from "lucide-react"
import { MetricCard } from "@/components/common/MetricCard"
import { type ServiceColumn } from "../../types"

interface ServiceKpiCardsProps {
  data: ServiceColumn[]
}

export function ServiceKpiCards({ data }: ServiceKpiCardsProps) {
  const totalServices = data.length
  const activeCount = data.filter((s) => s.estado.toLowerCase() === "activo").length
  const inactiveCount = data.filter((s) => s.estado.toLowerCase() === "inactivo").length

  const avgPrice =
    totalServices > 0
      ? Math.round(data.reduce((acc, s) => acc + Number(s.precioVenta), 0) / totalServices)
      : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <MetricCard
        title="Catálogo de Servicios"
        value={totalServices}
        description="Labores y trabajos de taller registrados"
        icon={Wrench}
      />
      <MetricCard
        title="Servicios Activos"
        value={activeCount}
        description="Disponibles para venta y taller"
        icon={CheckCircle2}
      />
      <MetricCard
        title="Tarifa Promedio"
        value={`$${avgPrice.toLocaleString("es-CL")}`}
        description="Mano de obra promedio por labor"
        icon={DollarSign}
      />
      <MetricCard
        title="Inactivos / Pausados"
        value={inactiveCount}
        description="Servicios temporalmente dados de baja"
        icon={PowerOff}
      />
    </div>
  )
}
