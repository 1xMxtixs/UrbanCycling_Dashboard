"use client"

import Link from "next/link"
import { ColumnDef, createColumnHelper } from "@tanstack/react-table"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { StatusType } from "@/components/common/StatusBadge"
import { formatCLP } from "@/lib/formatters"
import { ESTADO_PAGO, getNombreEstadoPago } from "@/lib/payment-status"

export interface TodaySale {
  id: string
  hora: string
  cliente: string
  monto: number
  estado: "pagada" | "pendiente" | "anulada"
}

const columnHelper = createColumnHelper<TodaySale>()
const paymentStatusByCode: Record<string, StatusType> = {
  [ESTADO_PAGO.PAGADA]: "success",
  [ESTADO_PAGO.PENDIENTE]: "warning",
  [ESTADO_PAGO.ANULADA]: "danger",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const todaySalesColumns: ColumnDef<TodaySale, any>[] = [
  columnHelper.accessor("id", {
    header: "ID venta",
    cell: ({ getValue }) => {
      const id = getValue() as string
      return <Link href={`/punto-ventas/ventas?ventaId=${id}`} className="font-mono text-xs tabular-nums text-primary hover:underline underline-offset-2">#{id}</Link>
    },
    enableSorting: false,
  }),
  columnHelper.accessor("hora", {
    header: "Hora",
    cell: ({ getValue }) => <span className="text-sm tabular-nums">{String(getValue()).slice(0, 5)}</span>,
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
      return <StatusBadge status={paymentStatusByCode[value.toUpperCase()] ?? "neutral"} label={getNombreEstadoPago(value)} showDot={false} />
    },
    enableSorting: false,
  }),
  columnHelper.accessor("monto", {
    header: "Monto",
    meta: { align: "right" },
    cell: ({ getValue }) => <span className="font-medium tabular-nums">{formatCLP(getValue())}</span>,
    sortingFn: "basic",
  }),
]
