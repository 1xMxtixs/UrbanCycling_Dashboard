import React from "react"
import { DollarSign, Calendar, Wrench } from "lucide-react"
import { MetricCard } from "@/components/common/MetricCard"
import { formatCLP } from "@/lib/formatters"
import type { FinancialSummaryData } from "../../types"

interface FinancialSummaryCardsProps {
  data: FinancialSummaryData
}

export function FinancialSummaryCards({ data }: FinancialSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        title="Ingresos del Período"
        value={formatCLP(data.totalRevenue)}
        description="Ventas mostrador + servicios de taller"
        icon={DollarSign}
      />

      <MetricCard
        title="Ingresos de Hoy"
        value={formatCLP(data.todayRevenue)}
        description="Cierre de caja en curso (día actual)"
        icon={Calendar}
      />

      <MetricCard
        title="Órdenes de Trabajo"
        value={data.totalWorkOrders}
        description={`${data.workOrdersFinished} finalizadas • ${data.workOrdersInProgress} en reparación`}
        icon={Wrench}
      />
    </div>
  )
}
