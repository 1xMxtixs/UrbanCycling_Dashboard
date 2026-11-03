"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { formatCLP } from "@/lib/formatters"

export interface MetodoPagoDatum {
  metodo: string
  label: string
  monto: number
  pagos: number
}

interface ChartVentasPorMetodoPagoProps {
  data: MetodoPagoDatum[]
}

const METHOD_CONFIG = {
  CREDITO: { label: "Crédito", color: "var(--chart-1)" },
  EFECTIVO: { label: "Efectivo", color: "var(--chart-2)" },
  DEBITO: { label: "Débito", color: "var(--chart-3)" },
  TRANSFERENCIA: { label: "Transferencia", color: "var(--chart-4)" },
}

const chartConfig = {
  monto: { label: "Monto" },
  ...METHOD_CONFIG,
} satisfies ChartConfig

export function ChartVentasPorMetodoPago({ data }: ChartVentasPorMetodoPagoProps) {
  const total = React.useMemo(() => data.reduce((sum, d) => sum + d.monto, 0), [data])

  const chartData = React.useMemo(
    () => [...data].sort((a, b) => b.monto - a.monto).map((d) => ({
      ...d,
      colorVar: METHOD_CONFIG[d.metodo as keyof typeof METHOD_CONFIG]?.color ?? "var(--chart-5)",
      fill: METHOD_CONFIG[d.metodo as keyof typeof METHOD_CONFIG]
        ? `var(--color-${d.metodo})`
        : "var(--chart-5)",
      pct: total > 0 ? Math.round((d.monto / total) * 100) : 0,
    })),
    [data, total]
  )

  return (
    <Card className="flex flex-col pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle className="text-base">Recaudación por Método de Pago</CardTitle>
        <CardDescription>Participación por medio de pago en el período seleccionado</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col pt-4 sm:pt-6">
        {data.length === 0 ? (
          <div className="flex min-h-[220px] flex-1 items-center justify-center text-sm text-muted-foreground">
            No hay datos suficientes para este período.
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-1 items-center justify-center">
            <div className="relative mx-auto h-[220px] w-[220px]">
              <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        formatter={(value, _name, item) => (
                          <div className="flex w-full items-center gap-2">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.payload.colorVar }} />
                            <span className="text-muted-foreground">{item.payload.label}</span>
                            <span className="ml-auto font-medium tabular-nums text-foreground">{formatCLP(Number(value))} · {item.payload.pct}%</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Pie data={chartData} dataKey="monto" nameKey="metodo" innerRadius={60} strokeWidth={2} stroke="var(--background)">
                    <Label
                      content={({ viewBox }) => {
                        if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                            <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-sm font-bold tabular-nums">
                              {formatCLP(total)}
                            </tspan>
                            <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                              Recaudado
                            </tspan>
                          </text>
                        )
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 text-xs sm:text-sm">
          {chartData.map((d) => (
            <div key={d.metodo} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.colorVar }} />
                <span className="truncate text-muted-foreground">{d.label}</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">({d.pagos} {d.pagos === 1 ? "pago" : "pagos"})</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-medium tabular-nums text-foreground">{formatCLP(d.monto)}</span>
                <span className="w-9 text-right text-muted-foreground tabular-nums">{d.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
