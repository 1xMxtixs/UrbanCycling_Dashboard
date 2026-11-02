"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCLP } from "@/lib/formatters"
import { formatTipoProducto } from "@/lib/product-types"

export interface ConsumoInsumo {
  nombre: string
  tipo: string
  cantidadUsada: number
  ordenesAsociadas: number
  costoTotal: number
}

export const consumoInsumosColumns: ColumnDef<ConsumoInsumo>[] = [
  { accessorKey: "nombre", header: "Insumo / Repuesto", cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>, sortingFn: "text" },
  { accessorKey: "tipo", header: "Tipo", cell: ({ getValue }) => <Badge variant="secondary" className="font-normal">{formatTipoProducto(getValue() as string)}</Badge>, enableSorting: false },
  { accessorKey: "cantidadUsada", header: "Cantidad usada", meta: { align: "right" }, cell: ({ getValue }) => <span className="tabular-nums">{getValue() as number}</span>, sortingFn: "basic" },
  { accessorKey: "ordenesAsociadas", header: "Órdenes asociadas", meta: { align: "right" }, cell: ({ getValue }) => <Badge variant="outline" className="font-normal tabular-nums">{getValue() as number} ODT</Badge>, enableSorting: false },
  { accessorKey: "costoTotal", header: "Costo total", meta: { align: "right" }, cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatCLP(getValue() as number)}</span>, sortingFn: "basic" },
]
