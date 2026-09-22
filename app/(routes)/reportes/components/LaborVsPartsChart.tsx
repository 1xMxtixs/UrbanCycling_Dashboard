"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/common/EmptyState"
import { BarChart3, Wrench, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCLP } from "@/lib/formatters"
import { useCountUp } from "@/hooks/use-count-up"
import type { LaborVsPartsData } from "../types"

interface LaborVsPartsChartProps {
  data: LaborVsPartsData
}

export function LaborVsPartsChart({ data }: LaborVsPartsChartProps) {
  const total = data.laborRevenue + data.partsRevenue
  const laborPct = total > 0 ? Math.round((data.laborRevenue / total) * 100) : 0
  const partsPct = total > 0 ? 100 - laborPct : 0

  const [isGrown, setIsGrown] = useState(false)
  const [hoveredBar, setHoveredBar] = useState<{
    idx: number
    type: "labor" | "parts"
    x: number
    y: number
  } | null>(null)
  const hasAnimated = useRef(false)
  const chartRef = useRef<HTMLDivElement>(null)

  const animatedLaborTotal = useCountUp(data.laborRevenue, 700, isGrown)
  const animatedPartsTotal = useCountUp(data.partsRevenue, 700, isGrown)

  // Animación de crecimiento al montar
  useEffect(() => {
    if (total === 0 || hasAnimated.current) return

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motionQuery.matches) {
      setIsGrown(true)
      hasAnimated.current = true
      return
    }

    const timer = requestAnimationFrame(() => {
      setIsGrown(true)
      hasAnimated.current = true
    })

    return () => cancelAnimationFrame(timer)
  }, [total])

  if (total === 0) {
    return (
      <Card className="border-border/80 bg-card/90 shadow-xs flex flex-col justify-between">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Mano de Obra vs. Repuestos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <EmptyState
            title="Sin datos en este período"
            description="No se registraron cobros de servicios ni venta de repuestos en el rango seleccionado."
            className="min-h-[180px]"
          />
        </CardContent>
      </Card>
    )
  }

  const series = data.series || []
  const maxVal = Math.max(
    ...series.map((s) => Math.max(s.laborAmount, s.partsAmount)),
    1000
  )

  const handleBarHover = (
    idx: number,
    type: "labor" | "parts",
    event: React.MouseEvent
  ) => {
    if (!chartRef.current) return
    const rect = chartRef.current.getBoundingClientRect()
    setHoveredBar({
      idx,
      type,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
  }

  return (
    <Card className="border-border/80 bg-card/90 shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-3.5 border-b border-border/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Mano de Obra vs. Repuestos
          </CardTitle>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            Total: {formatCLP(total)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Gráfico de Barras Agrupadas con animación de crecimiento */}
        <div className="space-y-2">
          {/* Leyenda del gráfico */}
          <div className="flex items-center justify-end gap-4 text-xs font-medium text-muted-foreground pb-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-teal-500" />
              <span>Mano de Obra</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              <span>Repuestos</span>
            </div>
          </div>

          {/* Área de barras con tooltip flotante */}
          <div
            ref={chartRef}
            className="relative h-44 w-full flex items-end justify-between gap-2 pt-4 px-2 border-b border-border/60"
          >
            {series.map((item, idx) => {
              const laborHeight = Math.max(8, Math.round((item.laborAmount / maxVal) * 100))
              const partsHeight = Math.max(8, Math.round((item.partsAmount / maxVal) * 100))

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group"
                >
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                    {/* Barra Mano de Obra (Teal) */}
                    <div
                      style={{
                        height: isGrown ? `${laborHeight}%` : "0%",
                        transitionDelay: `${idx * 80}ms`,
                      }}
                      className="w-full max-w-[18px] bg-teal-500 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-teal-400 cursor-pointer"
                      onMouseMove={(e) => handleBarHover(idx, "labor", e)}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {/* Barra Repuestos (Ámbar) */}
                    <div
                      style={{
                        height: isGrown ? `${partsHeight}%` : "0%",
                        transitionDelay: `${idx * 80 + 40}ms`,
                      }}
                      className="w-full max-w-[18px] bg-amber-500 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-amber-400 cursor-pointer"
                      onMouseMove={(e) => handleBarHover(idx, "parts", e)}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  </div>
                  {/* Label temporal */}
                  <span className="text-[10.5px] font-medium text-muted-foreground mt-2 truncate max-w-[50px] text-center">
                    {item.label}
                  </span>
                </div>
              )
            })}

            {/* Tooltip flotante personalizado */}
            {hoveredBar && series[hoveredBar.idx] && (
              <div
                className="absolute z-30 pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
                style={{
                  left: Math.min(hoveredBar.x, (chartRef.current?.clientWidth ?? 300) - 180),
                  top: Math.max(hoveredBar.y - 80, 0),
                }}
              >
                <div className="bg-popover/95 backdrop-blur-sm border border-border/80 rounded-xl px-3.5 py-2.5 shadow-lg text-xs space-y-1.5">
                  <p className="font-bold text-foreground text-[11px]">
                    {series[hoveredBar.idx].label}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm bg-teal-500 shrink-0" />
                    <span className="text-muted-foreground">Mano de Obra:</span>
                    <span className="font-bold text-foreground ml-auto">
                      {formatCLP(series[hoveredBar.idx].laborAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm bg-amber-500 shrink-0" />
                    <span className="text-muted-foreground">Repuestos:</span>
                    <span className="font-bold text-foreground ml-auto">
                      {formatCLP(series[hoveredBar.idx].partsAmount)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mini-cards de resumen con counter animado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Mano de Obra */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 transition-all duration-200 hover:border-teal-500/40 hover:shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Mano de Obra</p>
                <p className="text-xl font-black text-foreground">
                  {formatCLP(animatedLaborTotal)}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-foreground bg-muted/70 border border-border/60 px-2.5 py-1 rounded-lg">
              {laborPct}%
            </span>
          </div>

          {/* Repuestos e Insumos */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 transition-all duration-200 hover:border-amber-500/40 hover:shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Repuestos e Insumos</p>
                <p className="text-xl font-black text-foreground">
                  {formatCLP(animatedPartsTotal)}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-foreground bg-muted/70 border border-border/60 px-2.5 py-1 rounded-lg">
              {partsPct}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
