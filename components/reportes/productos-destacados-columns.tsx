"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCLP } from "@/lib/formatters"
import { formatTipoProducto } from "@/lib/product-types"

export interface ProductoDestacado {
  ranking: number
  nombre: string
  tipo: string
  unidades: number
  totalRecaudado: number
}

export const productosDestacadosColumns: ColumnDef<ProductoDestacado>[] = [
  { accessorKey: "ranking", header: "#", cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() as number}</span>, enableSorting: false },
  { accessorKey: "nombre", header: "Producto / Repuesto", cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>, sortingFn: "text" },
  { accessorKey: "tipo", header: "Tipo", cell: ({ getValue }) => <Badge variant="secondary" className="font-normal">{formatTipoProducto(getValue() as string)}</Badge>, enableSorting: false },
  { accessorKey: "unidades", header: "Unidades despachadas", meta: { align: "right" }, cell: ({ getValue }) => <span className="tabular-nums">{getValue() as number}</span>, sortingFn: "basic" },
  { accessorKey: "totalRecaudado", header: "Total recaudado", meta: { align: "right" }, cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatCLP(getValue() as number)}</span>, sortingFn: "basic" },
]
