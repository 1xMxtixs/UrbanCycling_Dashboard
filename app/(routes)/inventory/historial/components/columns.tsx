"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { StatusBadge } from "@/components/common/StatusBadge"

export type MovimientoColumn = {
  id: string
  fecha: string
  producto: string
  tipoMovimiento: string
  cantidad: number
  stockAnterior: number
  stockActual: number
  usuario: string
}

export function getColumns(): ColumnDef<MovimientoColumn>[] {
  return [
    {
      accessorKey: "fecha",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
          className="cursor-pointer p-0 font-semibold hover:bg-transparent"
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-foreground">
          {row.original.fecha}
        </span>
      ),
    },

    {
      accessorKey: "producto",
      header: "Producto",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground">
          {row.original.producto}
        </span>
      ),
    },

    {
      accessorKey: "tipoMovimiento",
      header: "Movimiento",
      cell: ({ row }) => {
        const tipo = row.original.tipoMovimiento

        const status =
          tipo === "Entrada"
            ? "success"
            : tipo === "Salida"
              ? "danger"
              : "warning"

        return (
          <StatusBadge
            status={status}
            label={tipo}
            showDot={false}
          />
        )
      },
    },

    {
      accessorKey: "cantidad",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
          className="cursor-pointer p-0 font-semibold hover:bg-transparent"
        >
          Cantidad
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const cantidad = row.original.cantidad

        return (
          <span
            className={
              cantidad > 0
                ? "text-sm font-semibold text-green-600 dark:text-green-500"
                : "text-sm font-semibold text-red-600 dark:text-red-500"
            }
          >
            {cantidad > 0 ? `+${cantidad}` : cantidad} u
          </span>
        )
      },
    },

    {
      accessorKey: "stockAnterior",
      header: "Stock anterior",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-muted-foreground">
          {row.original.stockAnterior} u
        </span>
      ),
    },

    {
      accessorKey: "stockActual",
      header: "Stock actual",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground">
          {row.original.stockActual} u
        </span>
      ),
    },

    {
      accessorKey: "usuario",
      header: "Usuario",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.usuario}
        </span>
      ),
    },
  ]
}