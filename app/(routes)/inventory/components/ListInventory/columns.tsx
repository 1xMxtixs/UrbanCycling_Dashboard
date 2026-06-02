"use client"

import { ColumnDef } from "@tanstack/react-table"

export type ProductColumn = {
  idProducto: number
  tipoProducto: string
  nombre: string
  descripcion: string | null
  precioVenta: number | string
  stockActual: number
  stockMinimo: number
  estado: string
}

export const columns: ColumnDef<ProductColumn>[] = [
  {
    accessorKey: "idProducto",
    header: "ID",
    cell: ({ row }) => `#${row.original.idProducto}`,
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "tipoProducto",
    header: "Tipo",
  },
  {
    accessorKey: "stockActual",
    header: "Stock actual",
    cell: ({ row }) => {
      const stockActual = row.original.stockActual
      const stockMinimo = row.original.stockMinimo
      const isLowStock = stockActual <= stockMinimo

      return (
        <span
          className={
            isLowStock
              ? "rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
              : "rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          }
        >
          {stockActual} u
        </span>
      )
    },
  },
  {
    accessorKey: "stockMinimo",
    header: "Stock minimo",
  },
  {
    accessorKey: "precioVenta",
    header: "Precio venta",
    cell: ({ row }) => {
      const value = Number(row.original.precioVenta)

      return `$${value.toLocaleString("es-CL")}`
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
  },
]
