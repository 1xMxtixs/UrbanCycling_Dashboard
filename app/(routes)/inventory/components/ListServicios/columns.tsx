"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Eye, Pencil, Power, PowerOff, Wrench } from "lucide-react"
import { RowActionsMenu } from "@/components/common/RowActionsMenu"
import { StatusBadge } from "@/components/common/StatusBadge"
import { DataField } from "@/components/common/DataField"
import { formatCurrency } from "@/lib/formatters"
import { getNombreEstadoRegistro, isRegistroActivo } from "@/lib/registro-status"
import { type ServiceColumn } from "../../types"
import { SortableHeader } from "@/components/common/SortableHeader"

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
        <span className="font-mono text-xs font-semibold text-muted-foreground">
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
      header: ({ column }) => <SortableHeader column={column}>Mano de obra</SortableHeader>,
      cell: ({ row }) => (
        <span className="font-semibold text-sm tabular-nums text-foreground">
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
            showDot={isActivo}
            animateDot={isActivo}
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
        const service = row.original
        const isActive = isRegistroActivo(service.estado)

        return (
          <div className="text-right pr-2">
            <RowActionsMenu
              ariaLabel={`Acciones del servicio ${service.codigo}`}
              groups={[
                {
                  actions: [
                    {
                      label: "Ver detalle",
                      icon: Eye,
                      onSelect: () => onViewDetails?.(service),
                    },
                    {
                      label: "Editar",
                      icon: Pencil,
                      hidden: !canUpdate,
                      onSelect: () => onEdit?.(service),
                    },
                  ],
                },
                {
                  label: "Cambiar estado",
                  actions: [
                    {
                      label: "Inactivar servicio",
                      icon: PowerOff,
                      variant: "destructive",
                      hidden: !canUpdate || !isActive,
                      onSelect: () => onToggleStatus?.(service),
                    },
                    {
                      label: "Reactivar servicio",
                      icon: Power,
                      variant: "primary",
                      hidden: !canUpdate || isActive,
                      onSelect: () => onToggleStatus?.(service),
                    },
                  ],
                },
              ]}
            />
          </div>
        )
      },
    }
  ]
}
