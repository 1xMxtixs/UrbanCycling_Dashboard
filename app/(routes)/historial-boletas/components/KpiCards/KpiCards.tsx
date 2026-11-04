import { DollarSign, FileCheck, Percent, ReceiptText } from "lucide-react"
import { MetricCard } from "@/components/common/MetricCard"

interface KpiCardsProps {
  total: string
  emitidos: number
  neto: string
  iva: string
}

export function KpiCards({ total, emitidos, neto, iva }: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total facturado"
        value={total}
        description="Suma de boletas emitidas"
        icon={DollarSign}
      />
      <MetricCard
        title="Boletas Emitidas"
        value={emitidos}
        description="Documentos con estado emitido"
        icon={FileCheck}
      />
      <MetricCard
        title="Total Neto"
        value={neto}
        description="Base imponible"
        icon={ReceiptText}
      />
      <MetricCard
        title="IVA Débito (19%)"
        value={iva}
        description="IVA incluido en las boletas"
        icon={Percent}
      />
    </div>
  )
}
