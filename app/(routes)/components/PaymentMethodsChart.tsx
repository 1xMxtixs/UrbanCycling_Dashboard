"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/common/EmptyState"
import { PieChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCLP } from "@/lib/formatters"
import { useCountUp } from "@/hooks/use-count-up"
import type { PaymentMethodItem } from "../types"

interface PaymentMethodsChartProps {
  data: PaymentMethodItem[]
}

function calculateDonutSegments(items: PaymentMethodItem[], circumference: number) {
  const segments: Array<
    PaymentMethodItem & {
      arcLength: number
      offset: number
    }
  > = []

  let accumulated = 0
  for (const item of items) {
    const arcLength = (item.percentage / 100) * circumference
    segments.push({
      ...item,
      arcLength,
      offset: accumulated,
    })
    accumulated += arcLength
  }

  return segments
}

export function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)
  const [isDrawn, setIsDrawn] = useState(false)
  const hasAnimated = useRef(false)

  const totalAmount = data.reduce((acc, item) => acc + item.amount, 0)
  const animatedTotal = useCountUp(totalAmount, 800, isDrawn)

  // Parámetros geométricos del Donut
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const donutSegments = calculateDonutSegments(data, circumference)

  // Animación draw-in al montar
  useEffect(() => {
    if (totalAmount === 0 || hasAnimated.current) return

    // Respeta prefers-reduced-motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (motionQuery.matches) {
      setIsDrawn(true)
      hasAnimated.current = true
      return
    }

    // Delay corto para que el componente esté montado antes de la transición
    const timer = requestAnimationFrame(() => {
      setIsDrawn(true)
      hasAnimated.current = true
    })

    return () => cancelAnimationFrame(timer)
  }, [totalAmount])

  if (totalAmount === 0 || data.length === 0) {
    return (
      <Card className="border-border/80 bg-card/90 shadow-xs flex flex-col justify-between">
        <CardHeader className="pb-3.5 border-b border-border/60">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <PieChart className="h-4 w-4 text-primary" />
            Ventas por Método de Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <EmptyState
            title="Sin transacciones"
            description="No se registraron ventas ni cobros en los métodos de pago durante el período."
            className="min-h-[180px]"
          />
        </CardContent>
      </Card>
    )
  }

  const activeItem = hoveredMethod
    ? data.find((d) => d.method === hoveredMethod)
    : null

  return (
    <Card className="border-border/80 bg-card/90 shadow-xs flex flex-col justify-between">
      <CardHeader className="pb-3.5 border-b border-border/60">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <PieChart className="h-4 w-4 text-primary" />
          Ventas por Método de Pago
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Donut SVG con animación draw-in */}
        <div className="relative flex items-center justify-center shrink-0 w-48 h-48">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-muted/40"
              strokeWidth="20"
              fill="transparent"
            />
            {/* Segmentos con draw-in progresivo */}
            {donutSegments.map((segment, idx) => {
              const isHovered = hoveredMethod === segment.method

              return (
                <circle
                  key={segment.method}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={isHovered ? "23" : "20"}
                  strokeDasharray={`${segment.arcLength} ${circumference}`}
                  strokeDashoffset={isDrawn ? -segment.offset : circumference}
                  strokeLinecap="butt"
                  onMouseEnter={() => setHoveredMethod(segment.method)}
                  onMouseLeave={() => setHoveredMethod(null)}
                  className="cursor-pointer"
                  style={{
                    transition: isDrawn
                      ? `stroke-dashoffset 800ms cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 120}ms, stroke-width 200ms ease`
                      : "none",
                    opacity: hoveredMethod && !isHovered ? 0.55 : 1,
                  }}
                />
              )
            })}
          </svg>

          {/* Center Info Badge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground transition-all duration-200">
              {activeItem ? activeItem.label : "Total Caja"}
            </span>
            <span className="text-lg font-black text-foreground transition-all duration-200">
              {activeItem
                ? `${activeItem.percentage}%`
                : formatCLP(animatedTotal)}
            </span>
            {activeItem && (
              <span className="text-[10.5px] font-semibold text-muted-foreground mt-0.5 animate-in fade-in-50 duration-200">
                {formatCLP(activeItem.amount)}
              </span>
            )}
          </div>
        </div>

        {/* Leyenda interactiva */}
        <div className="flex-1 w-full space-y-2">
          {data.map((item) => {
            const isHovered = hoveredMethod === item.method
            return (
              <div
                key={item.method}
                onMouseEnter={() => setHoveredMethod(item.method)}
                onMouseLeave={() => setHoveredMethod(null)}
                className={cn(
                  "flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 cursor-pointer",
                  isHovered
                    ? "bg-accent border-primary/40 shadow-xs scale-[1.02]"
                    : "bg-muted/30 border-border/50 hover:bg-muted/60"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full shrink-0 shadow-2xs transition-transform duration-200",
                      isHovered && "scale-125"
                    )}
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground leading-none">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                      {item.count} {item.count === 1 ? "pago" : "pagos"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black text-foreground">
                    {formatCLP(item.amount)}
                  </p>
                  <p className="text-[11px] font-bold text-primary">
                    {item.percentage}%
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
