import { DollarSign, FileCheck, Percent, ReceiptText } from "lucide-react"
import { MetricCard } from "@/components/common/MetricCard"

interface KpiCardsProps {
  total: string
  emitidos: number
  neto?: string
  iva?: string
}

export function KpiCards({ total, emitidos, neto, iva }: KpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Monto Facturado Bruto"
        value={total}
        description="Total acumulado en boletas"
        icon={DollarSign}
      />
      <MetricCard
        title="Boletas Emitidas"
        value={emitidos}
        description="Documentos tributarios activos"
        icon={FileCheck}
      />
      {neto && (
        <MetricCard
          title="Total Neto"
          value={neto}
          description="Base imponible acumulada"
          icon={ReceiptText}
        />
      )}
      {iva && (
        <MetricCard
          title="IVA Débito (19%)"
          value={iva}
          description="Impuesto fiscal retenido"
          icon={Percent}
        />
      )}
    </div>
  )
}
