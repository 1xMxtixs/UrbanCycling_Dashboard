"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface DateRangeFilterProps {
  onApply: (range: DateRange) => Promise<void> | void
}

type PresetKey = "hoy" | "7dias" | "mes"

function getPresetRange(preset: PresetKey): DateRange {
  const today = new Date()
  if (preset === "hoy") return { from: today, to: today }
  if (preset === "7dias") {
    const from = new Date(today)
    from.setDate(from.getDate() - 6)
    return { from, to: today }
  }
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
  return { from, to: today }
}

export function DateRangeFilter({ onApply }: DateRangeFilterProps) {
  const [preset, setPreset] = React.useState<string>("mes")
  const [range, setRange] = React.useState<DateRange | undefined>(
    getPresetRange("mes")
  )
  const [pendingRange, setPendingRange] = React.useState<DateRange | undefined>(range)
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
  const [showIncompleteWarning, setShowIncompleteWarning] = React.useState(false)
  const warningTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function handlePresetChange(value: string) {
    if (!value) return
    const key = value as PresetKey
    setPreset(key)
    const newRange = getPresetRange(key)
    setRange(newRange)
    setPendingRange(newRange)
    onApply(newRange)
  }

  function handleSelectDateRange(newRange: DateRange | undefined) {
    setPendingRange(newRange)
    setPreset("")
    if (newRange?.from && newRange?.to) {
      setShowIncompleteWarning(false)
      setRange(newRange)
      setIsPopoverOpen(false)
      onApply(newRange)
    }
  }

  function handlePopoverOpenChange(open: boolean) {
    setIsPopoverOpen(open)
    if (!open) {
      const incomplete = !!pendingRange?.from && !pendingRange?.to
      if (incomplete) {
        setPendingRange(range)
        setShowIncompleteWarning(true)
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
        warningTimeoutRef.current = setTimeout(() => {
          setShowIncompleteWarning(false)
        }, 3000)
      }
    }
  }

  React.useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col gap-2 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Período:
        </span>

        <ToggleGroup
          type="single"
          variant="outline"
          value={preset}
          onValueChange={handlePresetChange}
        >
          <ToggleGroupItem value="hoy">Hoy</ToggleGroupItem>
          <ToggleGroupItem value="7dias">Últimos 7 días</ToggleGroupItem>
          <ToggleGroupItem value="mes">Este mes</ToggleGroupItem>
        </ToggleGroup>

        <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {range?.from
                ? range.from.toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "Desde"}
              {" – "}
              {range?.to
                ? range.to.toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "Hasta"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Card className="w-fit border-0 p-0 shadow-none">
              <CardContent className="p-0">
                <Calendar
                  mode="range"
                  defaultMonth={pendingRange?.from}
                  selected={pendingRange}
                  onSelect={handleSelectDateRange}
                  numberOfMonths={2}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      </div>

      {showIncompleteWarning && (
        <p className="animate-in fade-in-0 text-xs text-destructive duration-300">
          Debes seleccionar ambas fechas del rango (inicio y fin) para aplicar el filtro.
        </p>
      )}
    </div>
  )
}
