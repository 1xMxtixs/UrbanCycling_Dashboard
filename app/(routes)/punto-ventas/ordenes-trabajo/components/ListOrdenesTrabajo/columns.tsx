"use client"

import { ColumnDef, Row, Table } from "@tanstack/react-table"
import {
  MoreHorizontal,
  Eye,
  Loader2,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SortableHeader } from "@/components/common/SortableHeader"
import { WorkOrderStatusBadge } from "@/components/common/WorkOrderStatusBadge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { DataField } from "@/components/common/DataField"
import { formatClientName } from "@/lib/formatters"
import {
  ESTADO_OT,
  getNombreEstadoOt,
  isOrdenTrabajoRetrasada,
  TRANSICIONES_OT,
} from "@/lib/work-order-status"
import { WorkOrder } from "../../types"

interface WorkOrderTableMeta {
  updatingId?: number | null
  onViewDetails?: (order: WorkOrder) => void
  onStatusChange?: (orderId: number, nextStatus: string) => void
  onPayClick?: (order: WorkOrder) => void
  onGenerateReceipt?: (order: WorkOrder) => void
  onRescheduleClick?: (order: WorkOrder) => void
  onCancelClick?: (order: WorkOrder) => void
  onAssignSuppliesClick?: (order: WorkOrder) => void
  onAuditClick?: (order: WorkOrder) => void
  onModifyServiceClick?: (order: WorkOrder) => void
}

function getAvailableTransitions(currentStatus: string) {
  return TRANSICIONES_OT[currentStatus as keyof typeof TRANSICIONES_OT] || []
}

const CellActions = ({ row, table }: { row: Row<WorkOrder>; table: Table<WorkOrder> }) => {
  const order = row.original
  const meta = table.options.meta as WorkOrderTableMeta | undefined
  const transitions = getAvailableTransitions(order.estadoOrden)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
          {meta?.updatingId === order.idOrdenDeTrabajo ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          <span className="sr-only">Abrir menú de opciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => meta?.onViewDetails?.(order)}
          className="flex cursor-pointer items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Ver Detalle
        </DropdownMenuItem>

        {order.estadoOrden === ESTADO_OT.ENTREGADO && (
          <DropdownMenuItem
            onClick={() => meta?.onGenerateReceipt?.(order)}
            className="flex cursor-pointer items-center gap-2 text-primary font-semibold"
          >
            <FileText className="h-4 w-4" />
            Generar Boleta
          </DropdownMenuItem>
        )}
        {transitions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-semibold tracking-tight text-muted-foreground">
              Cambiar Estado
            </DropdownMenuLabel>
            {transitions.map((nextState: string) => (
              <DropdownMenuItem
                key={nextState}
                onClick={() =>
                  meta?.onStatusChange?.(order.idOrdenDeTrabajo, nextState)
                }
                className="flex cursor-pointer items-center gap-1.5 pl-6 text-xs"
              >
                <span>→ Mover a:</span>
                <span className="font-semibold text-primary">{getNombreEstadoOt(nextState)}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns: ColumnDef<WorkOrder>[] = [
  {
    accessorKey: "idOrdenDeTrabajo",
    header: "ID Orden",
    cell: ({ row }) => (
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        #{row.getValue("idOrdenDeTrabajo")}
      </span>
    ),
  },
  {
    id: "cliente",
    header: "Cliente",
    accessorFn: (row) => {
      if (!row.cliente) return ""
      return (
        row.cliente.razonSocial ||
        `${row.cliente.primerNombre} ${row.cliente.apellidoPaterno || ""}`.trim()
      )
    },
    cell: ({ row }) => {
      const order = row.original
      const clientName = formatClientName(order.cliente)

      return (
        <DataField
          variant="table-cell"
          value={clientName}
          secondaryValue={order.cliente?.rut ? `RUT: ${order.cliente.rut}` : undefined}
        />
      )
    },
  },
  {
    id: "bicicletas",
    header: "Bicicleta(s)",
    accessorFn: (row) => {
      if (!row.bicicletas || row.bicicletas.length === 0) return ""
      return row.bicicletas.map((b) => `${b.marca} ${b.modelo}`).join(", ")
    },
    cell: ({ row }) => {
      const order = row.original
      const firstBike =
        order.bicicletas && order.bicicletas.length > 0
          ? `${order.bicicletas[0].marca} ${order.bicicletas[0].modelo}`
          : "Sin bicicleta"
      const extraCount = order.bicicletas ? order.bicicletas.length - 1 : 0

      return (
        <div className="flex items-center gap-1.5">
          <DataField variant="table-cell" value={firstBike} />
          {extraCount > 0 && (
            <span className="inline-flex rounded-full bg-muted border border-border px-2 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
              +{extraCount} más
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "estadoOrden",
    header: "Estado",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true
      const order = row.original
      const isCompleted = order.estadoOrden === ESTADO_OT.ENTREGADO
      const isDelayed = isOrdenTrabajoRetrasada(
        order.estadoOrden,
        order.fechaEntregaEstimada
      )

      if (filterValue === "retrasada") {
        return isDelayed
      } else if (filterValue === "activa") {
        return order.estadoOrden === ESTADO_OT.EN_CURSO
      } else if (filterValue === "espera") {
        return order.estadoOrden === ESTADO_OT.EN_ESPERA
      } else if (filterValue === "completada") {
        return isCompleted
      } else if (filterValue === "anulada") {
        return order.estadoOrden === ESTADO_OT.ANULADA
      } else if (filterValue === "por-entregar") {
        return order.estadoOrden === ESTADO_OT.LISTO_PARA_ENTREGAR
      } else if (filterValue === "por-realizar") {
        return order.estadoOrden === ESTADO_OT.POR_REALIZAR
      }
      return true
    },
    cell: ({ row }) => {
      const order = row.original
      return (
        <WorkOrderStatusBadge estado={order.estadoOrden} nombre={order.estadoOrdenNombre} fechaEntregaEstimada={order.fechaEntregaEstimada} />
      )
    },
  },
  {
    accessorKey: "fechaEntregaEstimada",
    header: ({ column }) => <SortableHeader column={column}>Fecha entrega</SortableHeader>,
    cell: ({ row }) => {
      const date = new Date(row.getValue("fechaEntregaEstimada"))
      return (
        <span className="text-sm tabular-nums text-foreground">
          {date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })}
        </span>
      )
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row, table }) => (
      <div className="flex justify-end" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
        <CellActions row={row} table={table} />
      </div>
    ),
  },
]
