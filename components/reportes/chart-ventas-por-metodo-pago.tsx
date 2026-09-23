"use client"

import * as React from "react"
import { Cell, Pie, PieChart } from "recharts"

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

export interface MetodoPagoDatum {
  metodo: string
  label: string
  monto: number
  pagos: number
}

interface ChartVentasPorMetodoPagoProps {
  data: MetodoPagoDatum[]
}

const chartConfig = {
  monto: { label: "Monto" },
  metodo1: { label: "Método 1", color: "var(--chart-1)" },
  metodo2: { label: "Método 2", color: "var(--chart-2)" },
  metodo3: { label: "Método 3", color: "var(--chart-3)" },
  metodo4: { label: "Método 4", color: "var(--chart-4)" },
  metodo5: { label: "Método 5", color: "var(--chart-5)" },
} satisfies ChartConfig

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`
}

export function ChartVentasPorMetodoPago({ data }: ChartVentasPorMetodoPagoProps) {
  const total = React.useMemo(() => data.reduce((sum, d) => sum + d.monto, 0), [data])

  const chartData = React.useMemo(
    () =>
      data.map((d, i) => ({
        ...d,
        colorVar: `var(--chart-${(i % 5) + 1})`,
        gradientId: `fillMetodo${i}`,
        pct: total > 0 ? Math.round((d.monto / total) * 100) : 0,
      })),
    [data, total]
  )

  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b py-5">
        <CardTitle className="text-base">Ventas por Método de Pago</CardTitle>
        <CardDescription>
          Participación por medio de pago en el período seleccionado
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-4 sm:pt-6">
        {data.length === 0 ? (
          <div className="flex flex-1 min-h-[220px] items-center justify-center text-sm text-muted-foreground">
            No hay datos suficientes para este período.
          </div>
        ) : (
          <div className="flex flex-1 min-h-[220px] items-center justify-center">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-full max-h-[220px]"
          >
            <PieChart>
              <defs>
                {chartData.map((d) => (
                  <linearGradient
                    key={d.gradientId}
                    id={d.gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={d.colorVar} stopOpacity={0.95} />
                    <stop offset="95%" stopColor={d.colorVar} stopOpacity={0.55} />
                  </linearGradient>
                ))}
              </defs>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => (
                      <div className="flex w-full items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: item.payload.colorVar }}
                        />
                        <span className="text-muted-foreground">{item.payload.label}</span>
                        <span className="ml-auto font-medium tabular-nums text-foreground">
                          {formatCLP(Number(value))} · {item.payload.pct}%
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="monto"
                nameKey="label"
                innerRadius={60}
                strokeWidth={2}
                stroke="var(--background)"
              >
                {chartData.map((d) => (
                  <Cell key={d.metodo} fill={`url(#${d.gradientId})`} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-sm">
          {chartData.map((d) => (
            <div key={d.metodo} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: d.colorVar }}
              />
              <span className="text-muted-foreground">{d.label}</span>
              <span className="text-xs text-muted-foreground">({d.pagos} pagos)</span>
              <span className="ml-auto font-medium tabular-nums">
                {formatCLP(d.monto)}
              </span>
              <span className="w-10 text-right text-muted-foreground">{d.pct}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
