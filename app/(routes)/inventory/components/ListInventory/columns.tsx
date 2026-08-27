"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, MoreHorizontal, Package } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { DataField } from "@/components/common/DataField"

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

export function getColumns(
  onViewDetail: (product: ProductColumn) => void,
): ColumnDef<ProductColumn>[] {
  return [
    {
      accessorKey: "nombre",
      header: "Producto / Tipo",
      cell: ({ row }) => {
        const p = row.original
        const firstImg = p.imagenesProducto?.[0]?.url

        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg border border-border/80 bg-muted/40 overflow-hidden flex items-center justify-center">
              {firstImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firstImg} alt={p.nombre} className="h-full w-full object-cover" />
              ) : (
                <Package className="h-4 w-4 text-muted-foreground/70" />
              )}
            </div>
            <DataField
              variant="table-cell"
              value={p.nombre}
              secondaryValue={p.tipoProducto}
            />
          </div>
        )
      },
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
            className="cursor-pointer p-0 font-semibold hover:bg-transparent"
          >
            Stock Actual
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const stockActual = row.original.stockActual
        const stockMinimo = row.original.stockMinimo
        const isLowStock = stockActual <= stockMinimo && stockActual > 0
        const isOutOfStock = stockActual === 0

        return (
          <span className="font-semibold text-sm text-foreground">
            {stockActual} u
          </span>
        )
      },
    },
    {
      id: "stockStatus",
      header: "Disponibilidad",
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
      header: "Mínimo",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-medium">
          {row.original.stockMinimo} u
        </span>
      ),
    },
    {
      accessorKey: "precioVenta",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
          className="cursor-pointer p-0 font-semibold hover:bg-transparent"
        >
          Precio Venta
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = Number(row.original.precioVenta)
        return (
          <span className="font-bold text-sm text-foreground">
            ${value.toLocaleString("es-CL")}
          </span>
        )
      },
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = row.original.estado
        const isActive = estado?.toLowerCase() === "activo"
        return (
          <StatusBadge
            status={isActive ? "success" : "neutral"}
            label={isActive ? "Activo" : "Inactivo"}
            showDot={false}
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
          <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/80">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onViewDetail(row.original)}
              className="flex cursor-pointer items-center gap-2 text-xs font-medium"
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
