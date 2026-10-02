"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export interface ConsumoInsumo {
  nombre: string
  tipo: string
  cantidadUsada: number
  ordenesAsociadas: number
  costoTotal: number
}

function formatCLP(value: number) { return `$${value.toLocaleString("es-CL")}` }

export const consumoInsumosColumns: ColumnDef<ConsumoInsumo>[] = [
  { accessorKey: "nombre", header: "Insumo / Repuesto", cell: ({ getValue }) => <span className="font-medium">{getValue() as string}</span>, sortingFn: "text" },
  { accessorKey: "tipo", header: "Tipo", cell: ({ getValue }) => <Badge variant="secondary" className="font-normal">{getValue() as string}</Badge>, enableSorting: false },
  { accessorKey: "cantidadUsada", header: () => <div className="text-right">Cantidad usada</div>, cell: ({ getValue }) => <div className="text-right tabular-nums">{getValue() as number}</div>, sortingFn: "alphanumeric" },
  { accessorKey: "ordenesAsociadas", header: () => <div className="text-right">Órdenes asociadas</div>, cell: ({ getValue }) => <div className="text-right"><Badge variant="outline" className="font-normal tabular-nums">{getValue() as number} ODT</Badge></div>, enableSorting: false },
  { accessorKey: "costoTotal", header: () => <div className="text-right">Costo total</div>, cell: ({ getValue }) => <div className="text-right font-medium tabular-nums">{formatCLP(getValue() as number)}</div>, sortingFn: "alphanumeric" },
]
