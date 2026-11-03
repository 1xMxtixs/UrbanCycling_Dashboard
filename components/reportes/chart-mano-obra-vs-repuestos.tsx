"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

export interface RentabilidadOrdenTrabajoPoint {
  date: string
  ingresosOrdenesTrabajo: number
  costosRepuestos: number
}

interface ChartRentabilidadOrdenesTrabajoProps {
  data: RentabilidadOrdenTrabajoPoint[]
}

const chartConfig = {
  ingresosOrdenesTrabajo: { label: "Ingresos de OT", color: "var(--chart-1)" },
  costosRepuestos: { label: "Costo de Repuestos", color: "var(--chart-2)" },
} satisfies ChartConfig

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("es-CL", { month: "short", day: "numeric" })
}

export function ChartRentabilidadOrdenesTrabajo({ data }: ChartRentabilidadOrdenesTrabajoProps) {
  const totals = React.useMemo(() => {
    const ingresosTotal = data.reduce((sum, item) => sum + item.ingresosOrdenesTrabajo, 0)
    const costosTotal = data.reduce((sum, item) => sum + item.costosRepuestos, 0)
    const total = ingresosTotal + costosTotal
    return {
      ingresosTotal,
      costosTotal,
      ingresosPct: total > 0 ? Math.round((ingresosTotal / total) * 100) : 0,
      costosPct: total > 0 ? Math.round((costosTotal / total) * 100) : 0,
    }
  }, [data])

  return (
    <Card className="flex flex-col pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle className="text-base">Ingresos de OT vs. Costo de Repuestos</CardTitle>
        <CardDescription>Comparativo de órdenes entregadas en el período seleccionado</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-2 pt-4 sm:px-6 sm:pt-6">
        {data.length === 0 ? (
          <div className="flex min-h-[220px] flex-1 items-center justify-center text-sm text-muted-foreground">
            No hay datos suficientes para este período.
          </div>
        ) : (
          <div className="min-h-[220px] flex-1">
            <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
              <BarChart accessibilityLayer data={data} barGap={4}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  minTickGap={32}
                  tickFormatter={(value) => formatDateLabel(String(value))}
                />
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
                            <div
                              className="my-0.5 w-0 shrink-0 border-[1.5px] border-dashed"
                              style={{ borderColor: config?.color }}
                            />
                            <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                              <span className="text-muted-foreground">{config?.label ?? name}</span>
                              <span className="font-medium tabular-nums text-foreground">
                                {formatCLP(Number(value))}
                              </span>
                            </div>
                          </>
                        )
                      }}
                    />
                  }
                />
                <Bar dataKey="ingresosOrdenesTrabajo" fill="var(--color-ingresosOrdenesTrabajo)" radius={4} maxBarSize={48} />
                <Bar dataKey="costosRepuestos" fill="var(--color-costosRepuestos)" radius={4} maxBarSize={48} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
            <span className="text-muted-foreground">Ingresos de OT</span>
            <span className="font-medium tabular-nums">{formatCLP(totals.ingresosTotal)}</span>
            <span className="text-muted-foreground">({totals.ingresosPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
            <span className="text-muted-foreground">Costo de Repuestos</span>
            <span className="font-medium tabular-nums">{formatCLP(totals.costosTotal)}</span>
            <span className="text-muted-foreground">({totals.costosPct}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
