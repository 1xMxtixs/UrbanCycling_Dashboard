"use client"

import { Button } from "@/components/ui/button"
import { ColumnDef } from "@tanstack/react-table"
import {
  ArrowLeftRight,
  Eye,
  MoreHorizontal,
  Package,
  Power,
  Trash2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import {
  getNombreEstadoRegistro,
  isRegistroActivo,
} from "@/lib/registro-status"
import { DataField } from "@/components/common/DataField"
import { formatCurrency } from "@/lib/formatters"
import { SortableHeader } from "@/components/common/SortableHeader"
import { formatTipoProducto } from "@/lib/product-types"
import type { InventoryCategory } from "../../types"

export type { InventoryCategory } from "../../types"

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
  costoPromedio: number | string
  stockActual: number
  stockMinimo: number
  estado: string
  imagenesProducto?: ProductImage[]
  categoriasProducto?: InventoryCategory[]
  proveedores?: Array<{
    idProveedor: number
    razonSocial: string
    rut: string
    estado: string
  }>
}

export function getColumns(
  onViewDetail: (product: ProductColumn) => void,
  onRegisterMovement: (product: ProductColumn) => void,
  onToggleStatus: (product: ProductColumn) => void,
  canUpdate: boolean = false,
  onManageSuppliers?: (product: ProductColumn) => void
): ColumnDef<ProductColumn>[] {
  return [
    {
      accessorKey: "idProducto",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
          #{row.original.idProducto}
        </span>
      ),
    },
    {
      accessorKey: "nombre",
      header: "Producto / Tipo",
      cell: ({ row }) => {
        const p = row.original
        const firstImg = p.imagenesProducto?.[0]?.url

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/80 bg-muted/40">
              {firstImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={firstImg}
                  alt={p.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-4 w-4 text-muted-foreground/70" />
              )}
            </div>
            <DataField
              variant="table-cell"
              value={p.nombre}
              secondaryValue={formatTipoProducto(p.tipoProducto)}
            />
          </div>
        )
      },
    },
    {
      accessorKey: "stockActual",
      header: ({ column }) => <SortableHeader column={column}>Stock</SortableHeader>,
      cell: ({ row }) => {
        const { stockActual, stockMinimo } = row.original
        const badge = stockActual === 0 ? (
          <StatusBadge status="danger" label="Sin stock" showDot={false} />
        ) : stockActual <= stockMinimo ? (
          <StatusBadge status="warning" label="Stock bajo" showDot={false} />
        ) : null

        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tabular-nums text-foreground">{stockActual} u</span>
              {badge}
            </div>
            <span className="text-[11px] tabular-nums text-muted-foreground">Mín. {stockMinimo} u</span>
          </div>
        )
      },
    },
    {
      accessorKey: "precioVenta",
      header: ({ column }) => <SortableHeader column={column}>Precio venta</SortableHeader>,
      cell: ({ row }) => {
        return (
          <span className="text-sm font-bold tabular-nums text-foreground">
            {formatCurrency(row.original.precioVenta)}
          </span>
        )
      },
    },
    {
      accessorKey: "estado",
      filterFn: "equalsString",
      header: "Estado",
      cell: ({ row }) => {
        const estado = row.original.estado
        const isActive = isRegistroActivo(estado)
        return (
          <StatusBadge
            status={isActive ? "success" : "danger"}
            label={getNombreEstadoRegistro(estado)}
            showDot={isActive}
            animateDot={isActive}
          />
        )
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const isActive = isRegistroActivo(row.original.estado)

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-pointer"
              >
                <span className="sr-only">Abrir menú de opciones</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl border-border/80"
            >
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onViewDetail(row.original)}
                className="flex cursor-pointer items-center gap-2 text-xs font-medium"
              >
                <Eye className="h-4 w-4" />
                Ver detalle
              </DropdownMenuItem>
              {onManageSuppliers && (
                <DropdownMenuItem
                  onClick={() => onManageSuppliers(row.original)}
                >
                  Ver y asociar proveedores
                </DropdownMenuItem>
              )}
              {canUpdate && (
                <>
                  <DropdownMenuItem
                    onClick={() => onRegisterMovement(row.original)}
                    className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    Registrar movimiento
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isActive ? (
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(row.original)}
                      className="flex cursor-pointer items-center gap-2 text-xs text-destructive focus:bg-gradient-to-r focus:from-destructive/20 focus:to-destructive/5 focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Inactivar producto
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => onToggleStatus(row.original)}
                      className="flex cursor-pointer items-center gap-2 text-xs font-medium text-primary focus:text-primary"
                    >
                      <Power className="h-4 w-4" />
                      Reactivar producto
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
