"use client"

import * as React from "react"
import { FilterIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface DateRangeFilterProps {
  onApply: (range: DateRange) => Promise<void> | void
}

type PresetKey = "hoy" | "7dias" | "mes" | "personalizado"

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
  const [preset, setPreset] = React.useState<PresetKey>("mes")
  const [range, setRange] = React.useState<DateRange | undefined>(
    getPresetRange("mes")
  )
  const [isApplying, setIsApplying] = React.useState(false)

  function handlePresetChange(value: string) {
    if (!value) return
    const key = value as PresetKey
    setPreset(key)
    if (key !== "personalizado") {
      setRange(getPresetRange(key))
    }
  }

  async function handleApply() {
    if (!range?.from || !range?.to) return
    setIsApplying(true)
    try {
      await onApply(range)
    } finally {
      setIsApplying(false)
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
        <ToggleGroupItem value="personalizado">Personalizado</ToggleGroupItem>
      </ToggleGroup>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreset("personalizado")}
          >
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
                onSelect={(newRange) => {
                  setRange(newRange)
                  setPreset("personalizado")
                }}
                numberOfMonths={2}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
              />
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>

      <Button
        size="sm"
        onClick={handleApply}
        disabled={isApplying || !range?.from || !range?.to}
      >
        {isApplying ? (
          <>
            <Spinner data-icon="inline-start" />
            Aplicando...
          </>
        ) : (
          <>
            <FilterIcon className="h-3.5 w-3.5" />
            Aplicar
          </>
        )}
      </Button>
    </div>
  )
}
