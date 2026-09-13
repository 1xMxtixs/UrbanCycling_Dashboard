"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"

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

export const columns: ColumnDef<MovementColumn>[] = [
  {
    accessorKey: "fechaOperacion",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="cursor-pointer p-0 font-semibold hover:bg-transparent">
        Fecha <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const v = row.original.fechaOperacion
      return <span className="text-xs text-muted-foreground whitespace-nowrap">{v ? new Date(v).toLocaleString("es-CL") : "—"}</span>
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
      return <StatusBadge status={isEntrada ? "success" : "danger"} label={isEntrada ? "Entrada" : "Salida"} />
    },
  },
  {
    accessorKey: "cantidad",
    header: "Cantidad",
    cell: ({ row }) => {
      const isEntrada = row.original.tipoMovimiento === "ENTRADA"
      return (
        <span className={`font-semibold text-sm ${isEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
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
      return <span className="text-xs text-muted-foreground font-medium">{stockAnterior} → <span className="text-foreground font-semibold">{stockNuevo}</span></span>
    },
  },
  {
    accessorKey: "motivo",
    header: "Motivo",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.motivo || "—"}</span>,
  },
  {
    accessorKey: "observacion",
    header: "Observación",
    cell: ({ row }) => {
      const obs = row.original.observacion
      return obs ? <span className="block max-w-[200px] truncate text-xs text-muted-foreground" title={obs}>{obs}</span> : <span className="text-xs text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: "usuario",
    header: "Usuario",
    cell: ({ row }) => <span className="text-xs text-muted-foreground font-medium">{row.original.usuario || "—"}</span>,
  },
]
