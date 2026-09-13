"use client"

import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
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
        : [...value, idCategoria],
    )
  }

  return (
    <div
      role="listbox"
      aria-label="Categorías del producto"
      aria-multiselectable="true"
      className="grid gap-2 sm:grid-cols-2"
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
              "h-auto min-h-9 justify-between gap-2 px-3 py-2 text-left text-xs",
              isSelected && "border-primary bg-primary/10 text-primary",
            )}
          >
            <span className="truncate">{category.nombre}</span>
            {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
          </Button>
        )
      })}
    </div>
  )
}
