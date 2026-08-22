import { DollarSign, FileCheck } from "lucide-react"
import { MetricCard } from "@/components/MetricCard"

interface KpiCardsProps {
  total: string
  emitidos: number
}

export function KpiCards({ total, emitidos }: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MetricCard
        title="Monto Total Facturado"
        value={total}
        description="Acumulado de boletas electrónicas"
        icon={DollarSign}
      />
      <MetricCard
        title="Boletas Emitidas"
        value={emitidos}
        description="Documentos tributarios en estado emitido"
        icon={FileCheck}
      />
    </div>
  )
}
