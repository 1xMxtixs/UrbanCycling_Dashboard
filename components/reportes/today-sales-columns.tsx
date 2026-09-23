"use client"

import { ColumnDef, createColumnHelper } from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"

export interface TodaySale {
  id: string
  hora: string
  cliente: string
  monto: number
  estado: "pagada" | "pendiente" | "anulada"
}

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`
}

const columnHelper = createColumnHelper<TodaySale>()

export const todaySalesColumns: ColumnDef<TodaySale, any>[] = [
  columnHelper.accessor("id", {
    header: "ID Venta",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-muted-foreground">#{getValue()}</span>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("hora", {
    header: "Hora",
    cell: ({ getValue }) => <span className="text-sm tabular-nums">{getValue()}</span>,
    enableSorting: false,
  }),
  columnHelper.accessor("cliente", {
    header: "Cliente",
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    sortingFn: "text",
  }),
  columnHelper.accessor("estado", {
    header: "Estado",
    cell: ({ getValue }) => {
      const value = getValue()
      const label =
        value === "pagada" ? "Pagada" : value === "pendiente" ? "Pendiente" : "Anulada"
      const variant =
        value === "pagada" ? "default" : value === "pendiente" ? "secondary" : "destructive"
      return (
        <Badge variant={variant} className="font-normal">
          {label}
        </Badge>
      )
    },
    enableSorting: false,
  }),
  columnHelper.accessor("monto", {
    header: () => <div className="text-right">Monto</div>,
    cell: ({ getValue }) => (
      <div className="text-right font-medium tabular-nums">{formatCLP(getValue())}</div>
    ),
    sortingFn: "alphanumeric",
  }),
]
