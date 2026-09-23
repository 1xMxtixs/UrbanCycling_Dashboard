"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface ManoObraVsRepuestosPoint {
  date: string // formato ISO "YYYY-MM-DD"
  manoObra: number
  repuestos: number
}

interface ChartManoObraVsRepuestosProps {
  data: ManoObraVsRepuestosPoint[]
}

const chartConfig = {
  manoObra: {
    label: "Mano de Obra",
    color: "var(--chart-1)",
  },
  repuestos: {
    label: "Repuestos e Insumos",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`
}

export function ChartManoObraVsRepuestos({ data }: ChartManoObraVsRepuestosProps) {
  const totals = React.useMemo(() => {
    const manoObraTotal = data.reduce((sum, d) => sum + d.manoObra, 0)
    const repuestosTotal = data.reduce((sum, d) => sum + d.repuestos, 0)
    const total = manoObraTotal + repuestosTotal
    return {
      manoObraTotal,
      repuestosTotal,
      manoObraPct: total > 0 ? Math.round((manoObraTotal / total) * 100) : 0,
      repuestosPct: total > 0 ? Math.round((repuestosTotal / total) * 100) : 0,
    }
  }, [data])

  return (
    <Card className="flex flex-col pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle className="text-base">Mano de Obra vs. Repuestos</CardTitle>
        <CardDescription>
          Distribución de ingresos por tipo en el período seleccionado
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-2 pt-4 sm:px-6 sm:pt-6">
        {data.length === 0 ? (
          <div className="flex flex-1 min-h-[220px] items-center justify-center text-sm text-muted-foreground">
            No hay datos suficientes para este período.
          </div>
        ) : (
          <div className="flex-1 min-h-[220px]">
          <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="fillManoObra" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-manoObra)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-manoObra)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillRepuestos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-repuestos)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-repuestos)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("es-CL", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("es-CL", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    formatter={(value, name) => (
                      <div className="flex w-full items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              chartConfig[name as keyof typeof chartConfig]?.color,
                          }}
                        />
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]?.label ?? name}
                        </span>
                        <span className="ml-auto font-medium tabular-nums text-foreground">
                          {formatCLP(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="manoObra"
                type="natural"
                fill="url(#fillManoObra)"
                stroke="var(--color-manoObra)"
                stackId="a"
              />
              <Area
                dataKey="repuestos"
                type="natural"
                fill="url(#fillRepuestos)"
                stroke="var(--color-repuestos)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--chart-1)" }}
            />
            <span className="text-muted-foreground">Mano de Obra</span>
            <span className="font-medium tabular-nums">
              {formatCLP(totals.manoObraTotal)}
            </span>
            <span className="text-muted-foreground">({totals.manoObraPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--chart-2)" }}
            />
            <span className="text-muted-foreground">Repuestos e Insumos</span>
            <span className="font-medium tabular-nums">
              {formatCLP(totals.repuestosTotal)}
            </span>
            <span className="text-muted-foreground">({totals.repuestosPct}%)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
