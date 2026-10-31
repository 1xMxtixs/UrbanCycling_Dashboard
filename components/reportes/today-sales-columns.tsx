"use client"

import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatCLP } from "@/lib/formatters"
import { getPaymentStatusBadgeVariant, getNombreEstadoPago } from "@/lib/payment-status"

export interface TodaySale {
  id: string
  hora: string
  cliente: string
  monto: number
  estado: "pagada" | "pendiente" | "anulada"
}

const columnHelper = createColumnHelper<TodaySale>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      return (
        <StatusBadge
          status={getPaymentStatusBadgeVariant(value)}
          label={getNombreEstadoPago(value)}
        />
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
