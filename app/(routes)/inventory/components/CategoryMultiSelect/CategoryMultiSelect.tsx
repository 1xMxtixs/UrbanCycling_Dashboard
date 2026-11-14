"use client"

import { MultiSelect } from "@/components/ui/multi-select"
import type { InventoryCategory } from "../../types"
import { isRegistroActivo } from "@/lib/registro-status"

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
        No hay categorías disponibles.
      </p>
    )
  }

  return (
    <MultiSelect
      options={categories.map((category) => ({
        value: String(category.idCategoria),
        label: `${category.nombre}${category.estado !== undefined && !isRegistroActivo(category.estado) ? " (Inactiva)" : ""}`,
        disabled:
          category.estado !== undefined &&
          !isRegistroActivo(category.estado) &&
          !value.includes(category.idCategoria),
      }))}
      value={value.map(String)}
      onChange={(selectedValues) => onChange(selectedValues.map(Number))}
      emptyLabel="Sin categorías"
      ariaLabel="Categorías del producto"
      multipleLabel="categorías"
      disabled={disabled}
    />
  )
}
