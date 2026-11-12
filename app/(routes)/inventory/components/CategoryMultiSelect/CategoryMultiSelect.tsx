"use client"

import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { InventoryCategory } from "../../types"

type CategoryMultiSelectProps = {
  categories: InventoryCategory[]
  value: number[]
  onChange: (categoryIds: number[]) => void
  disabled?: boolean
}

export function CategoryMultiSelect({
  categories,
  value,
  onChange,
  disabled = false,
}: CategoryMultiSelectProps) {
  if (categories.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        No hay categorías activas disponibles.
      </p>
    )
  }

  const toggleCategory = (idCategoria: number) => {
    const isSelected = value.includes(idCategoria)

    onChange(
      isSelected
        ? value.filter((id) => id !== idCategoria)
        : [...value, idCategoria]
    )
  }

  const selectedCategories = categories.filter((category) =>
    value.includes(category.idCategoria)
  )
  const summary =
    value.length === 0
      ? "Sin categorías"
      : value.length === 1
        ? (selectedCategories[0]?.nombre ?? "1 categoría")
        : `${value.length} categorías`

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="min-h-11 w-full justify-between gap-2 overflow-hidden px-3 py-2 text-left text-sm"
          aria-label={`Categorías: ${summary}`}
        >
          <span className="truncate">{summary}</span>
          <span className="shrink-0 text-xs text-muted-foreground">▾</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-2"
      >
        <Button
          type="button"
          variant="outline"
          className="mb-1 w-full justify-between"
          disabled={disabled}
          onClick={() => onChange([])}
        >
          Sin categorías
          {value.length === 0 ? <Check className="h-4 w-4 shrink-0" /> : null}
        </Button>
        <div
          role="listbox"
          aria-label="Categorías del producto"
          aria-multiselectable="true"
          className="max-h-64 space-y-1 overflow-y-auto"
        >
          {categories.map((category) => {
            const isSelected = value.includes(category.idCategoria)

            return (
              <Button
                key={category.idCategoria}
                type="button"
                variant="outline"
                role="option"
                aria-selected={isSelected}
                disabled={disabled}
                onClick={() => toggleCategory(category.idCategoria)}
                className={cn(
                  "h-auto min-h-9 w-full justify-between gap-2 px-3 py-2 text-left text-xs",
                  isSelected && "border-primary bg-primary/10 text-primary"
                )}
              >
                <span className="truncate">{category.nombre}</span>
                {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
