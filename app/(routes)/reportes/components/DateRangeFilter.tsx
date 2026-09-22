"use client"

import React, { useState } from "react"
import { Filter, RotateCcw, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import type { DatePreset, DateRange } from "../types"

interface DateRangeFilterProps {
  initialRange: DateRange
  onApply: (range: DateRange) => void
  isLoading?: boolean
}

export function DateRangeFilter({
  initialRange,
  onApply,
  isLoading = false,
}: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<DatePreset>("thisMonth")
  const [fromDate, setFromDate] = useState(initialRange.from)
  const [toDate, setToDate] = useState(initialRange.to)
  const [validationError, setValidationError] = useState<string | null>(null)

  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const [justApplied, setJustApplied] = useState(false)

  const triggerFeedback = () => {
    setJustApplied(true)
    setTimeout(() => {
      setJustApplied(false)
    }, 1500)
  }

  const applyPreset = (preset: DatePreset) => {
    setActivePreset(preset)
    setValidationError(null)
    const now = new Date()

    let newRange: DateRange | null = null

    if (preset === "today") {
      const todayStr = formatLocalDate(now)
      setFromDate(todayStr)
      setToDate(todayStr)
      newRange = { from: todayStr, to: todayStr }
    } else if (preset === "last7days") {
      const start = new Date(now)
      start.setDate(now.getDate() - 6)
      const fromStr = formatLocalDate(start)
      const toStr = formatLocalDate(now)
      setFromDate(fromStr)
      setToDate(toStr)
      newRange = { from: fromStr, to: toStr }
    } else if (preset === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const fromStr = formatLocalDate(start)
      const toStr = formatLocalDate(now)
      setFromDate(fromStr)
      setToDate(toStr)
      newRange = { from: fromStr, to: toStr }
    }

    if (newRange) {
      triggerFeedback()
      onApply(newRange)
    }
  }

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault()

    if (!fromDate || !toDate) {
      setValidationError("Debes ingresar ambas fechas para filtrar.")
      return
    }

    if (fromDate > toDate) {
      setValidationError("La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.")
      return
    }

    setValidationError(null)
    triggerFeedback()
    onApply({ from: fromDate, to: toDate })
  }

  const presets: { id: DatePreset; label: string }[] = [
    { id: "today", label: "Hoy" },
    { id: "last7days", label: "Últimos 7 días" },
    { id: "thisMonth", label: "Este mes" },
    { id: "custom", label: "Personalizado" },
  ]

  return (
    <div
      className={cn(
        "sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3.5 bg-background/85 backdrop-blur-md border-b transition-all duration-300 shadow-2xs",
        justApplied
          ? "border-emerald-500/50 shadow-emerald-500/5 shadow-md"
          : "border-border/70"
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Presets Rápidos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1 hidden sm:inline">
            Período:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border",
                activePreset === preset.id
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted border-border/60"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Inputs De Rango + Botón Aplicar */}
        <form onSubmit={handleApplyCustom} className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="from-date" className="text-xs text-muted-foreground font-medium shrink-0">
              Desde:
            </Label>
            <div className="relative">
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setActivePreset("custom")
                  setValidationError(null)
                }}
                className="h-8.5 text-xs rounded-xl bg-background border-border/80 w-[136px] px-2.5 shadow-2xs focus-visible:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Label htmlFor="to-date" className="text-xs text-muted-foreground font-medium shrink-0">
              Hasta:
            </Label>
            <div className="relative">
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setActivePreset("custom")
                  setValidationError(null)
                }}
                className="h-8.5 text-xs rounded-xl bg-background border-border/80 w-[136px] px-2.5 shadow-2xs focus-visible:ring-primary/30"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={isLoading}
            className={cn(
              "h-8.5 rounded-xl text-xs font-bold gap-1.5 px-3.5 shadow-xs cursor-pointer transition-all duration-300",
              justApplied
                ? "bg-emerald-600 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                : ""
            )}
          >
            {justApplied ? (
              <>
                <Check className="h-3.5 w-3.5 animate-in zoom-in-50" />
                <span>¡Aplicado!</span>
              </>
            ) : (
              <>
                <Filter className="h-3.5 w-3.5" />
                <span>{isLoading ? "Aplicando..." : "Aplicar"}</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyPreset("thisMonth")}
            title="Restablecer a Este Mes"
            className="h-8.5 w-8.5 p-0 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

      {/* Alerta de validación inline */}
      {validationError && (
        <div className="max-w-7xl mx-auto mt-2 flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-1.5 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}
    </div>
  )
}
