"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Eye, Loader2, Coins, FileText, CalendarClock, XCircle } from "lucide-react"
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
import { WorkOrder } from "../../types"

function getAvailableTransitions(currentStatus: string) {
  const map: Record<string, string[]> = {
    "Por realizar": ["En curso", "En espera"],
    "En curso": ["Listo para entregar", "En espera"],
    "En espera": ["En curso", "Listo para entregar"],
    "Listo para entregar": ["Entregado", "En curso"],
    Entregado: [],
    Anulada: [],
  }
  return map[currentStatus] || []
}

const CellActions = ({ row, table }: { row: any; table: any }) => {
  const order = row.original as WorkOrder
  const meta = table.options.meta as any
  const transitions = getAvailableTransitions(order.estadoOrden)
  const canCancel = !["Entregado", "Anulada"].includes(order.estadoOrden)

  const total = Number(order.total)
  const totalPagado = Number(order.totalPagado || 0)
  const isPaid =
    order.estadoPago?.toLowerCase() === "pagada" ||
    order.estadoPago?.toLowerCase() === "pagado" ||
    Math.max(0, total - totalPagado) === 0

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
          onClick={() => meta?.onViewDetails(order)}
          className="flex cursor-pointer items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Ver Detalle
        </DropdownMenuItem>

        {isPaid && (
          <DropdownMenuItem
            onClick={() => meta?.onGenerateReceipt?.(order)}
            className="flex cursor-pointer items-center gap-2 text-primary font-semibold"
          >
            <FileText className="h-4 w-4" />
            Generar Boleta
          </DropdownMenuItem>
        )}

        {order.estadoPago?.toLowerCase() !== "pagada" && (
          <DropdownMenuItem
            onClick={() => meta?.onPayClick?.(order)}
            className="flex cursor-pointer items-center gap-2 text-primary font-semibold"
          >
            <Coins className="h-4 w-4" />
            Registrar Pago
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => meta?.onRescheduleClick?.(order)}
          className="flex cursor-pointer items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold"
        >
          <CalendarClock className="h-4 w-4" />
          Reprogramar Entrega
        </DropdownMenuItem>

        {canCancel && (
          <DropdownMenuItem
            onClick={() => meta?.onCancelClick?.(order)}
            className="flex cursor-pointer items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold"
          >
            <XCircle className="h-4 w-4" />
            Anular Orden
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
                  meta?.onStatusChange(order.idOrdenDeTrabajo, nextState)
                }
                className="flex cursor-pointer items-center gap-1.5 pl-6 text-xs"
              >
                <span>→ Mover a:</span>
                <span className="font-semibold text-primary">{nextState}</span>
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
      const isCompleted = ["Entregado"].includes(order.estadoOrden)
      const dEstimada = new Date(order.fechaEntregaEstimada)
      const localEndDay = new Date(
        dEstimada.getUTCFullYear(),
        dEstimada.getUTCMonth(),
        dEstimada.getUTCDate(),
        23,
        59,
        59,
        999
      )
      const isFullyCompleted = ["Listo para entregar", "Entregado", "Anulada"].includes(order.estadoOrden)
      const isDelayed = localEndDay < new Date() && !isFullyCompleted

      if (filterValue === "retrasada") {
        return isDelayed
      } else if (filterValue === "activa") {
        return order.estadoOrden === "En curso"
      } else if (filterValue === "espera") {
        return order.estadoOrden === "En espera"
      } else if (filterValue === "completada") {
        return isCompleted
      } else if (filterValue === "anulada") {
        return order.estadoOrden === "Anulada"
      } else if (filterValue === "por-entregar") {
        return order.estadoOrden === "Listo para entregar"
      } else if (filterValue === "por-realizar") {
        return order.estadoOrden === "Por realizar"
      }
      return true
    },
    cell: ({ row }) => {
      const order = row.original
      const isCompleted = ["Listo para entregar", "Entregado", "Anulada"].includes(
        order.estadoOrden
      )
      const dEstimada = new Date(order.fechaEntregaEstimada)
      const localEndDay = new Date(
        dEstimada.getUTCFullYear(),
        dEstimada.getUTCMonth(),
        dEstimada.getUTCDate(),
        23,
        59,
        59,
        999
      )
      const isDelayed = localEndDay < new Date() && !isCompleted

      if (isDelayed) {
        return <StatusBadge status="danger" label="Retrasada" />
      }

      switch (order.estadoOrden) {
        case "Por realizar":
          return <StatusBadge status="neutral" label="Por realizar" />
        case "En curso":
          return <StatusBadge status="info" label="Activa" />
        case "En espera":
          return <StatusBadge status="warning" label="En Espera" />
        case "Listo para entregar":
          return <StatusBadge status="warning" label="Por Entregar" />
        case "Entregado":
          return <StatusBadge status="success" label="Completada" />
        case "Anulada":
          return <StatusBadge status="danger" label="Anulada" />
        default:
          return <StatusBadge status="neutral" label={order.estadoOrden} />
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
