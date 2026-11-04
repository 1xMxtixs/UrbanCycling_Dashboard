"use client"

import type { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatDateCL } from "@/lib/formatters"
import { SortableHeader } from "@/components/common/SortableHeader"
import type { ReactNode } from "react"

export type MovementColumn = {
  idMovimientoInventario: number
  idProducto?: number
  producto?: string | null
  tipoMovimiento: "ENTRADA" | "SALIDA" | string
  cantidad: number
  fechaOperacion: string | Date
  stockAnterior?: number | null
  stockNuevo?: number | null
  motivo?: string | null
  observacion?: string | null
  usuario?: string | null
}

export function formatMotivo(motivo?: string | null): string {
  const normalized = (motivo ?? "")
    .trim()
    .replace(/[_-]+/g, " ")
    .toLocaleLowerCase("es-CL")
  if (!normalized) return "—"
  if (normalized === "orden trabajo") return "Orden de trabajo"
  return normalized[0].toLocaleUpperCase("es-CL") + normalized.slice(1)
}

function renderObservacion(text?: string | null): ReactNode {
  if (!text?.trim()) return <span className="text-muted-foreground/60">—</span>
  const match = /\b(venta|OT)\s*#(\d+)/i.exec(text)
  if (!match) return text

  const referenceType = match[1].toLocaleLowerCase("es-CL")
  const referenceId = match[2]
  const href = referenceType === "venta"
    ? `/punto-ventas/ventas?ventaId=${referenceId}`
    : `/punto-ventas/ordenes-trabajo?ordenId=${referenceId}`
  const start = match.index
  const end = start + match[0].length

  return (
    <>
      {text.slice(0, start)}
      <Link
        href={href}
        className="font-medium text-primary hover:underline underline-offset-2"
        onClick={(event) => event.stopPropagation()}
      >
        {match[0]}
      </Link>
      {text.slice(end)}
    </>
  )
}

export const columns: ColumnDef<MovementColumn>[] = [
  {
    accessorKey: "fechaOperacion",
    header: ({ column }) => <SortableHeader column={column}>Fecha</SortableHeader>,
    cell: ({ row }) => {
      const v = row.original.fechaOperacion
      return (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {v ? formatDateCL(typeof v === "string" ? v : v.toISOString()) : "—"}
        </span>
      )
    },
  },
  {
    accessorKey: "producto",
    header: "Producto",
    cell: ({ row }) => <span className="font-semibold text-sm text-foreground">{row.original.producto || "—"}</span>,
  },
  {
    accessorKey: "tipoMovimiento",
    header: "Operación",
    filterFn: "equals",
    cell: ({ row }) => {
      const isEntrada = row.original.tipoMovimiento === "ENTRADA"
      return <StatusBadge status={isEntrada ? "success" : "danger"} label={isEntrada ? "Entrada" : "Salida"} showDot={false} />
    },
  },
  {
    accessorKey: "cantidad",
    header: "Cantidad",
    cell: ({ row }) => {
      const isEntrada = row.original.tipoMovimiento === "ENTRADA"
      return (
        <span className={`font-semibold text-sm tabular-nums ${isEntrada ? "text-primary" : "text-destructive"}`}>
          {isEntrada ? "+" : "-"}{row.original.cantidad} u
        </span>
      )
    },
  },
  {
    id: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const { stockAnterior, stockNuevo } = row.original
      if (stockAnterior === null || stockAnterior === undefined || stockNuevo === null || stockNuevo === undefined) {
        return <span className="text-muted-foreground text-xs">—</span>
      }
      return <span className="text-xs tabular-nums text-muted-foreground font-medium">{stockAnterior} → <span className="text-foreground font-semibold">{stockNuevo}</span></span>
    },
  },
  {
    id: "detalle",
    header: "Detalle",
    cell: ({ row }) => {
      const obs = row.original.observacion
      return (
        <div className="max-w-[320px] space-y-0.5">
          <span className="block text-sm text-foreground">{formatMotivo(row.original.motivo)}</span>
          <span className="block truncate text-xs text-muted-foreground" title={obs ?? undefined}>
            {renderObservacion(obs)}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "usuario",
    header: "Usuario",
    cell: ({ row }) => <span className="text-xs text-muted-foreground font-medium">{row.original.usuario || "—"}</span>,
  },
]
