"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Eye, Loader2, Coins, FileText, CalendarClock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { type WorkOrder } from "./kpi-cards"

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
  const saldoPendiente = isPaid ? 0 : Math.max(0, total - totalPagado)

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
            className="flex cursor-pointer items-center gap-2 text-blue-600 font-semibold"
          >
            <FileText className="h-4 w-4" />
            Generar Boleta
          </DropdownMenuItem>
        )}

        {order.estadoPago?.toLowerCase() !== "pagada" && (
          <DropdownMenuItem
            onClick={() => meta?.onPayClick?.(order)}
            className="flex cursor-pointer items-center gap-2 text-green-600 font-semibold"
          >
            <Coins className="h-4 w-4" />
            Registrar Pago
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => meta?.onRescheduleClick?.(order)}
          className="flex cursor-pointer items-center gap-2 text-amber-700 font-semibold"
        >
          <CalendarClock className="h-4 w-4" />
          Reprogramar Entrega
        </DropdownMenuItem>

        {canCancel && (
          <DropdownMenuItem
            onClick={() => meta?.onCancelClick?.(order)}
            className="flex cursor-pointer items-center gap-2 text-red-600 font-semibold"
          >
            <XCircle className="h-4 w-4" />
            Anular Orden
          </DropdownMenuItem>
        )}

        {transitions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
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
      <span className="font-bold text-slate-900 dark:text-white">
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
      const clientName = order.cliente
        ? order.cliente.razonSocial ||
          `${order.cliente.primerNombre} ${order.cliente.apellidoPaterno || ""}`.trim()
        : "Cliente Desconocido"

      return (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {clientName}
          </span>
          {order.cliente && (
            <span className="mt-0.5 block text-[10px] text-muted-foreground">
              RUT: {order.cliente.rut}
            </span>
          )}
        </div>
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
          <span className="dark:text-slate-350 font-medium text-slate-700">
            {firstBike}
          </span>
          {extraCount > 0 && (
            <span className="dark:bg-slate-850 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-slate-500 uppercase">
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
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-red-700 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
            <span className="h-1.5 w-1.5 animate-ping rounded-full bg-red-500" />
            Retrasada
          </span>
        )
      }

      switch (order.estadoOrden) {
        case "Por realizar":
          return (
            <span className="dark:text-slate-350 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800">
              Por realizar
            </span>
          )
        case "En curso":
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold tracking-wider text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
              Activa
            </span>
          )
        case "En espera":
          return (
            <span className="border-yellow-250 text-yellow-750 dark:text-yellow-450 inline-flex items-center gap-1 rounded-full border bg-yellow-50 px-2.5 py-0.5 text-xs font-bold tracking-wider dark:border-yellow-800 dark:bg-yellow-950/40">
              En Espera
            </span>
          )
        case "Listo para entregar":
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold tracking-wider text-amber-700 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              Por Entregar
            </span>
          )
        case "Entregado":
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-bold tracking-wider text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400">
              Completada
            </span>
          )
        case "Anulada":
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-bold tracking-wider text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
              Anulada
            </span>
          )
        default:
          return (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {order.estadoOrden}
            </span>
          )
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
        <span className="dark:text-slate-350 font-medium text-slate-700">
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
    cell: CellActions,
  },
]
