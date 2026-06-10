"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye } from "lucide-react"

export type ProductImage = {
  idImagenProducto: number
  idProducto: number
  url: string
}

export type ProductColumn = {
  idProducto: number
  tipoProducto: string
  nombre: string
  descripcion: string | null
  precioVenta: number | string
  stockActual: number
  stockMinimo: number
  estado: string
  imagenesProducto?: ProductImage[]
}

function getStockStatus(product: ProductColumn) {
  if (product.stockActual === 0) {
    return {
      label: "Sin stock",
      className:
        "bg-destructive/10 text-destructive dark:bg-destructive/20",
    }
  }

  if (product.stockActual <= product.stockMinimo) {
    return {
      label: "Stock bajo",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    }
  }

  return {
    label: "Disponible",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  }
}

export function getColumns(
  onViewDetail: (product: ProductColumn) => void,
): ColumnDef<ProductColumn>[] {
  return [
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Stock Actual
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
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
    id: "stockStatus",
    header: "Estado stock",
    cell: ({ row }) => {
      const status = getStockStatus(row.original)

      return (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
        >
          {status.label}
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
    cell: ({ row }) => {
      const estado = row.original.estado
      const isActive = estado === "activo"

      return (
        <span
          className={
            isActive
              ? "rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 capitalize"
              : "rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 capitalize"
          }
        >
          {estado}
        </span>
      )
    },
  },
  {
    id: "actions",
    header: "Detalle",
    cell: ({ row }) => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => onViewDetail(row.original)}
      >
        <Eye />
        Ver detalle
      </Button>
    ),
  },
  ]
}
