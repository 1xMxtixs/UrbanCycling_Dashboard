"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/StatusBadge"
import { DataField } from "@/components/DataField"

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
    accessorKey: "nombre",
    header: "Nombre / Tipo",
    cell: ({ row }) => (
      <DataField
        variant="table-cell"
        value={row.original.nombre}
        secondaryValue={row.original.tipoProducto}
      />
    ),
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
        <StatusBadge
          status={isLowStock ? "warning" : "info"}
          label={`${stockActual} u`}
        />
      )
    },
  },
  {
    id: "stockStatus",
    header: "Estado stock",
    cell: ({ row }) => {
      const p = row.original
      const statusKey =
        p.stockActual === 0
          ? "danger"
          : p.stockActual <= p.stockMinimo
          ? "warning"
          : "success"
      const label =
        p.stockActual === 0
          ? "Sin stock"
          : p.stockActual <= p.stockMinimo
          ? "Stock bajo"
          : "Disponible"

      return <StatusBadge status={statusKey} label={label} />
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
      return (
        <StatusBadge
          status={estado === "activo" ? "success" : "danger"}
          label={estado}
        />
      )
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => onViewDetail(row.original)}
            className="flex cursor-pointer items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Ver detalle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  ]
}
