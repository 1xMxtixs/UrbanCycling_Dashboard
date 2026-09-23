"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export interface ProductoDestacado {
  ranking: number
  nombre: string
  sku: string
  categoria: string
  unidades: number
  totalRecaudado: number
}

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`
}

export const productosDestacadosColumns: ColumnDef<ProductoDestacado>[] = [
  {
    accessorKey: "ranking",
    header: "#",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">{getValue() as number}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "nombre",
    header: "Producto / Repuesto",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.nombre}</p>
        <p className="text-xs text-muted-foreground">SKU: {row.original.sku}</p>
      </div>
    ),
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
    accessorKey: "unidades",
    header: () => <div className="text-right">Unidades Vendidas/Usadas</div>,
    cell: ({ getValue }) => (
      <div className="text-right tabular-nums">{getValue() as number} unidades</div>
    ),
    sortingFn: "alphanumeric",
  },
  {
    accessorKey: "totalRecaudado",
    header: () => <div className="text-right">Total Recaudado</div>,
    cell: ({ getValue }) => (
      <div className="text-right font-medium tabular-nums">
        {formatCLP(getValue() as number)}
      </div>
    ),
    sortingFn: "alphanumeric",
  },
]
