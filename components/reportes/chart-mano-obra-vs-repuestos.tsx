"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
            <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="fillIngresosOrdenesTrabajo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-ingresosOrdenesTrabajo)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-ingresosOrdenesTrabajo)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillCostosRepuestos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-costosRepuestos)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-costosRepuestos)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32}
                  tickFormatter={(value) => new Date(value).toLocaleDateString("es-CL", { month: "short", day: "numeric" })} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent
                  labelFormatter={(value) => new Date(value).toLocaleDateString("es-CL", { month: "short", day: "numeric" })}
                  formatter={(value, name) => <div className="flex w-full items-center gap-2"><span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label ?? name}</span><span className="ml-auto font-medium tabular-nums text-foreground">{formatCLP(Number(value))}</span></div>}
                />} />
                <Area dataKey="ingresosOrdenesTrabajo" type="natural" fill="url(#fillIngresosOrdenesTrabajo)" stroke="var(--color-ingresosOrdenesTrabajo)" />
                <Area dataKey="costosRepuestos" type="natural" fill="url(#fillCostosRepuestos)" stroke="var(--color-costosRepuestos)" />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} /><span className="text-muted-foreground">Ingresos de OT</span><span className="font-medium tabular-nums">{formatCLP(totals.ingresosTotal)}</span><span className="text-muted-foreground">({totals.ingresosPct}%)</span></div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} /><span className="text-muted-foreground">Costo de Repuestos</span><span className="font-medium tabular-nums">{formatCLP(totals.costosTotal)}</span><span className="text-muted-foreground">({totals.costosPct}%)</span></div>
        </div>
      </CardContent>
    </Card>
  )
}
