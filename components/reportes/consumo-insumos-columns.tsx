"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export interface ConsumoInsumo {
  codigo: string
  nombre: string
  categoria: string
  cantidadUsada: string
  ordenesAsociadas: number
  costoTotalEst: number
}

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`
}

export const consumoInsumosColumns: ColumnDef<ConsumoInsumo>[] = [
  {
    accessorKey: "codigo",
    header: "Código",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {getValue() as string}
      </span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "nombre",
    header: "Insumo / Repuesto",
    cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>,
    sortingFn: "text",
  },
  {
    accessorKey: "categoria",
    header: "Categoría",
    cell: ({ getValue }) => (
      <Badge variant="secondary" className="font-normal">
        {getValue() as string}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "cantidadUsada",
    header: () => <div className="text-right">Cantidad Usada</div>,
    cell: ({ getValue }) => (
      <div className="text-right tabular-nums">{getValue() as string}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "ordenesAsociadas",
    header: () => <div className="text-right">Órdenes Asociadas</div>,
    cell: ({ getValue }) => (
      <div className="text-right">
        <Badge variant="outline" className="font-normal tabular-nums">
          {getValue() as number} ODT
        </Badge>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "costoTotalEst",
    header: () => <div className="text-right">Costo Total Est.</div>,
    cell: ({ getValue }) => (
      <div className="text-right font-medium tabular-nums">
        {formatCLP(getValue() as number)}
      </div>
    ),
    sortingFn: "alphanumeric",
  },
]
