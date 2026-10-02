"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export interface ProductoDestacado {
  ranking: number
  nombre: string
  tipo: string
  unidades: number
  totalRecaudado: number
}

function formatCLP(value: number) { return `$${value.toLocaleString("es-CL")}` }

export const productosDestacadosColumns: ColumnDef<ProductoDestacado>[] = [
  { accessorKey: "ranking", header: "#", cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() as number}</span>, enableSorting: false },
  { accessorKey: "nombre", header: "Producto / Repuesto", cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>, sortingFn: "text" },
  { accessorKey: "tipo", header: "Tipo", cell: ({ getValue }) => <Badge variant="secondary" className="font-normal">{getValue() as string}</Badge>, enableSorting: false },
  { accessorKey: "unidades", header: () => <div className="text-right">Unidades despachadas</div>, cell: ({ getValue }) => <div className="text-right tabular-nums">{getValue() as number}</div>, sortingFn: "alphanumeric" },
  { accessorKey: "totalRecaudado", header: () => <div className="text-right">Total recaudado</div>, cell: ({ getValue }) => <div className="text-right font-medium tabular-nums">{formatCLP(getValue() as number)}</div>, sortingFn: "alphanumeric" },
]
