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
  // "mes"
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
  return { from, to: today }
}

export function DateRangeFilter({ onApply }: DateRangeFilterProps) {
  const [preset, setPreset] = React.useState<string>("mes")
  const [range, setRange] = React.useState<DateRange | undefined>(
    getPresetRange("mes")
  )
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

  function handlePresetChange(value: string) {
    if (!value) return
    const key = value as PresetKey
    setPreset(key)
    const newRange = getPresetRange(key)
    setRange(newRange)
    onApply(newRange)
  }

  function handleSelectDateRange(newRange: DateRange | undefined) {
    setRange(newRange)
    setPreset("") // deselecciona los botones de preset porque se eligió fecha manual
    if (newRange?.from && newRange?.to) {
      setIsPopoverOpen(false)
      onApply(newRange)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
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

      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
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
                defaultMonth={range?.from}
                selected={range}
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
  )
}
