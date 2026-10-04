import React from "react"
import { Calendar, DollarSign, Wrench } from "lucide-react"
import { MetricCard } from "@/components/common/MetricCard"
import { formatCLP } from "@/lib/formatters"
import type { FinancialSummaryData } from "../types"

interface FinancialSummaryCardsProps {
  data: FinancialSummaryData
}

export function FinancialSummaryCards({ data }: FinancialSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <MetricCard title="Recaudación del período" value={formatCLP(data.totalRevenue)} description="Pagos registrados en ventas y órdenes de trabajo" icon={DollarSign} />
      <MetricCard title="Ingresos de hoy" value={formatCLP(data.todayRevenue)} description="Ventas y órdenes registradas en la jornada actual" icon={Calendar} />
      <MetricCard title="Órdenes de trabajo" value={data.totalWorkOrders} description={`${data.workOrdersFinished} entregadas en el período`} icon={Wrench} />
    </div>
  )
}
