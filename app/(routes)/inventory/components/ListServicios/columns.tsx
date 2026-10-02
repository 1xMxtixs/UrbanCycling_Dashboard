"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Eye, Pencil, Power, Trash2, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { DataField } from "@/components/common/DataField"
import { formatCurrency } from "@/lib/formatters"
import { getNombreEstadoRegistro, isRegistroActivo } from "@/lib/registro-status"
import { type ServiceColumn } from "../../types"

interface GetColumnsOptions {
  canUpdate?: boolean
  onViewDetails?: (service: ServiceColumn) => void
  onEdit?: (service: ServiceColumn) => void
  onToggleStatus?: (service: ServiceColumn) => void
}

export function getColumns({
  canUpdate = false,
  onViewDetails,
  onEdit,
  onToggleStatus,
}: GetColumnsOptions): ColumnDef<ServiceColumn>[] {
  return [
    {
      accessorKey: "codigo",
      header: "Código",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {row.getValue("codigo")}
        </span>
      ),
    },
    {
      accessorKey: "nombre",
      header: "Servicio / Labor",
      cell: ({ row }) => {
        const s = row.original

        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-lg border border-border/80 bg-muted/40 overflow-hidden flex items-center justify-center text-muted-foreground/70">
              <Wrench className="h-4 w-4" />
            </div>
            <DataField
              variant="table-cell"
              value={s.nombre}
              secondaryValue={s.descripcion || "Servicio técnico de taller"}
            />
          </div>
        )
      },
    },
    {
      accessorKey: "precioVenta",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="cursor-pointer p-0 font-semibold hover:bg-transparent"
          >
            Precio (Mano de Obra)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <span className="font-semibold text-sm text-foreground">
          {formatCurrency(row.original.precioVenta)}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const estado = String(row.getValue("estado"))
        const isActivo = isRegistroActivo(estado)

        return (
          <StatusBadge
            status={isActivo ? "success" : "danger"}
            label={getNombreEstadoRegistro(estado)}
          />
        )
      },
      filterFn: (row, id, value) => {
        if (!value) return true
        const isActivo = isRegistroActivo(String(row.getValue(id)))
        return value.toLowerCase() === "activo" ? isActivo : !isActivo
      },
    },
    {
      id: "actions",
      header: () => <span className="text-right block pr-2 text-xs font-semibold">Acciones</span>,
      cell: ({ row }) => {
        const servicio = row.original
        const isActivo = isRegistroActivo(servicio.estado)

        return (
          <div className="text-right pr-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Opciones</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onViewDetails?.(servicio)}
                  className="cursor-pointer text-xs"
                >
                  <Eye className="mr-2 h-3.5 w-3.5" /> Ver detalle
                </DropdownMenuItem>

                {canUpdate && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onEdit?.(servicio)}
                      className="cursor-pointer text-xs"
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Editar servicio
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {isActivo ? (
                      <DropdownMenuItem
                        onClick={() => onToggleStatus?.(servicio)}
                        className="flex cursor-pointer items-center gap-2 text-xs text-destructive focus:bg-gradient-to-r focus:from-destructive/20 focus:to-destructive/5 focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Inactivar servicio
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => onToggleStatus?.(servicio)}
                        className="flex cursor-pointer items-center gap-2 text-xs font-medium text-primary focus:text-primary"
                      >
                        <Power className="h-3.5 w-3.5" />
                        Reactivar servicio
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
