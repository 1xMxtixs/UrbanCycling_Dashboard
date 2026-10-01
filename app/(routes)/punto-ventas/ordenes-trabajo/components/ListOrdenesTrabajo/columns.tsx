"use client"

import { ColumnDef, Row, Table } from "@tanstack/react-table"
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Loader2,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"
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
  ESTADOS_OT_CERRADOS,
  getNombreEstadoOt,
  getNombreEstadoOtVisible,
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
            <DropdownMenuLabel className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
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
      <DataField variant="table-cell" value={`#${row.getValue("idOrdenDeTrabajo")}`} />
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
      switch (order.estadoOrden) {
        case ESTADO_OT.POR_REALIZAR:
          return <StatusBadge status="neutral" label={getNombreEstadoOtVisible(order.estadoOrden, order.fechaEntregaEstimada, order.estadoOrdenNombre)} />
        case ESTADO_OT.EN_CURSO:
          return <StatusBadge status="info" label={getNombreEstadoOtVisible(order.estadoOrden, order.fechaEntregaEstimada, order.estadoOrdenNombre)} />
        case ESTADO_OT.EN_ESPERA:
          return <StatusBadge status="warning" label={getNombreEstadoOtVisible(order.estadoOrden, order.fechaEntregaEstimada, order.estadoOrdenNombre)} />
        case ESTADO_OT.LISTO_PARA_ENTREGAR:
          return <StatusBadge status="warning" label={getNombreEstadoOtVisible(order.estadoOrden, order.fechaEntregaEstimada, order.estadoOrdenNombre)} />
        case ESTADO_OT.ENTREGADO:
          return <StatusBadge status="success" label={getNombreEstadoOtVisible(order.estadoOrden, order.fechaEntregaEstimada, order.estadoOrdenNombre)} />
        case ESTADO_OT.ANULADA:
          return <StatusBadge status="danger" label={getNombreEstadoOtVisible(order.estadoOrden, order.fechaEntregaEstimada, order.estadoOrdenNombre)} />
        default:
          return <StatusBadge status="neutral" label={getNombreEstadoOtVisible(order.estadoOrden, order.fechaEntregaEstimada, order.estadoOrdenNombre)} />
      }
    },
  },
  {
    accessorKey: "fechaEntregaEstimada",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer p-0 font-semibold hover:bg-transparent"
        >
          Fecha Entrega
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("fechaEntregaEstimada"))
      return (
        <DataField
          variant="table-cell"
          value={date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })}
        />
      )
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: CellActions,
  },
]
