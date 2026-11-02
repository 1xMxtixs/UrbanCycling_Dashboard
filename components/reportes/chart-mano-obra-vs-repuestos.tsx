"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatCLP } from "@/lib/formatters"

export interface RentabilidadOrdenTrabajoPoint {
  date: string
  ingresosOrdenesTrabajo: number
  costosRepuestos: number
}

interface ChartRentabilidadOrdenesTrabajoProps {
  data: RentabilidadOrdenTrabajoPoint[]
}

const INGRESOS_LABEL = "Ingresos de OT (neto)"

const chartConfig = {
  ingresosOrdenesTrabajo: { label: INGRESOS_LABEL, color: "var(--chart-1)" },
  costosRepuestos: { label: "Costo de Repuestos", color: "var(--chart-2)" },
} satisfies ChartConfig

function formatDateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("es-CL", { month: "short", day: "numeric" })
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })} M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)} mil`
  return `$${value}`
}

export function ChartRentabilidadOrdenesTrabajo({ data }: ChartRentabilidadOrdenesTrabajoProps) {
  const totals = React.useMemo(() => {
    const ingresos = data.reduce((sum, item) => sum + item.ingresosOrdenesTrabajo, 0)
    const costos = data.reduce((sum, item) => sum + item.costosRepuestos, 0)
    const margen = ingresos - costos
    return { ingresos, costos, margen, margenPct: ingresos > 0 ? Math.round((margen / ingresos) * 100) : 0 }
  }, [data])

  return (
    <Card className="flex flex-col pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle className="text-base">Ingresos de OT vs. Costo de Repuestos</CardTitle>
        <CardDescription>Órdenes entregadas en el período · ingresos netos de IVA</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-2 pt-4 sm:px-6 sm:pt-6">
        {data.length === 0 ? (
          <div className="flex min-h-[220px] flex-1 items-center justify-center text-sm text-muted-foreground">
            No hay datos suficientes para este período.
          </div>
        ) : data.length === 1 ? (
          <div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryTile label={INGRESOS_LABEL} value={totals.ingresos} color="var(--chart-1)" />
              <SummaryTile label="Costo de Repuestos" value={totals.costos} color="var(--chart-2)" />
              <SummaryTile label="Margen" value={totals.margen} detail={`${totals.margenPct}% de los ingresos`} negative={totals.margen < 0} />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Datos del {formatDateLabel(data[0].date)}</p>
          </div>
        ) : (
          <div className="min-h-[220px] flex-1">
            <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
              <BarChart accessibilityLayer data={data} barGap={4} barCategoryGap="25%">
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} minTickGap={28} tickFormatter={(value) => formatDateLabel(String(value))} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value) => formatCompact(Number(value))} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dashed"
                      labelFormatter={(value) => formatDateLabel(String(value))}
                      formatter={(value, name) => {
                        const config = chartConfig[name as keyof typeof chartConfig]
                        return (
                          <>
                            <div className="my-0.5 w-0 shrink-0 border-[1.5px] border-dashed" style={{ borderColor: config?.color }} />
                            <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                              <span className="text-muted-foreground">{config?.label ?? name}</span>
                              <span className="font-medium tabular-nums text-foreground">{formatCLP(Number(value))}</span>
                            </div>
                          </>
                        )
                      }}
                    />
                  }
                />
                <Bar dataKey="ingresosOrdenesTrabajo" fill="var(--color-ingresosOrdenesTrabajo)" radius={4} maxBarSize={40} />
                <Bar dataKey="costosRepuestos" fill="var(--color-costosRepuestos)" radius={4} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
        {data.length >= 2 && (
          <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border pt-4 text-xs sm:grid-cols-3 sm:text-sm">
            <LegendItem label={INGRESOS_LABEL} value={totals.ingresos} color="var(--chart-1)" />
            <LegendItem label="Costo de Repuestos" value={totals.costos} color="var(--chart-2)" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Margen</span>
              <span className={totals.margen < 0 ? "font-medium tabular-nums text-destructive" : "font-medium tabular-nums text-foreground"}>
                {formatCLP(totals.margen)} ({totals.margenPct}%)
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryTile({ label, value, color, detail, negative = false }: { label: string; value: number; color?: string; detail?: string; negative?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
        {label}
      </div>
      <div className={`mt-1 text-xl font-extrabold tabular-nums ${negative ? "text-destructive" : "text-foreground"}`}>{formatCLP(value)}</div>
      {detail && <p className={negative ? "text-[11px] text-destructive" : "text-[11px] text-muted-foreground"}>{detail}</p>}
    </div>
  )
}

function LegendItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-medium tabular-nums text-foreground">{formatCLP(value)}</span>
    </div>
  )
}
