"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Eye, Check, XCircle, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export interface SaleOperation {
  idPuntoVenta: string
  tipoOperacion: "venta"
  fechaCreacion: string
  fechaRegistro: string
  total: number
  montoTotal: number
  estadoPago: string
  estadoVenta: string
  cliente: {
    idCliente: number
    tipoCliente: string
    rut: string
    razonSocial?: string | null
    primerNombre?: string | null
    apellidoPaterno?: string | null
  } | null
  usuario: any
  venta: {
    idVenta: number
    lineasDeVenta?: Array<{
      idLineaDeVenta: number
      idProducto: number
      cantidad: number
      precioUnitario: number
      producto: {
        nombre: string
        precioVenta: number
      }
    }>
  }
}

const CellActions = ({ row, table }: { row: any; table: any }) => {
  const op = row.original as SaleOperation
  const meta = table.options.meta as any
  const isPending = op.estadoPago?.toLowerCase() === "pendiente"
  const isAnulada = op.estadoVenta?.toLowerCase() === "anulada"
  const isPaid = op.estadoPago?.toLowerCase() === "pagada" || op.estadoPago?.toLowerCase() === "pagado"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
          {meta?.updatingId === op.venta.idVenta ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => meta?.onViewDetails(op)}
          className="flex cursor-pointer items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Ver Detalle
        </DropdownMenuItem>

        {isPaid && !isAnulada && (
          <DropdownMenuItem
            onClick={() => meta?.onGenerateReceipt?.(op)}
            className="flex cursor-pointer items-center gap-2 text-blue-600 font-semibold"
          >
            <FileText className="h-4 w-4" />
            Generar Boleta
          </DropdownMenuItem>
        )}

        {!isAnulada && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Actualizar Venta
            </DropdownMenuLabel>

            {isPending && (
              <DropdownMenuItem
                onClick={() => meta?.onPayClick ? meta.onPayClick(op.venta.idVenta, op.total) : meta?.onUpdateStatus(op.venta.idVenta, "pagada", op.estadoVenta)}
                className="flex cursor-pointer items-center gap-2 text-green-600 font-semibold"
              >
                <Check className="h-4 w-4" />
                Marcar como Pagada
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => meta?.onUpdateStatus(op.venta.idVenta, "anulada", "anulada")}
              className="flex cursor-pointer items-center gap-2 text-red-500 font-semibold"
            >
              <XCircle className="h-4 w-4" />
              Anular Venta
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const columns: ColumnDef<SaleOperation>[] = [
  {
    accessorKey: "idPuntoVenta",
    header: "ID Venta",
    cell: ({ row }) => (
      <span className="font-bold text-slate-900 dark:text-white">
        #{row.getValue("idPuntoVenta")}
      </span>
    ),
  },
  {
    id: "cliente",
    header: "Cliente",
    accessorFn: (row) => {
      if (!row.cliente) return "Cliente General"
      return (
        row.cliente.razonSocial ||
        `${row.cliente.primerNombre} ${row.cliente.apellidoPaterno || ""}`.trim()
      )
    },
    cell: ({ row }) => {
      const op = row.original
      const clientName = op.cliente
        ? op.cliente.razonSocial ||
          `${op.cliente.primerNombre} ${op.cliente.apellidoPaterno || ""}`.trim()
        : "Cliente General"

      return (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {clientName}
          </span>
          {op.cliente && (
            <span className="mt-0.5 block text-[10px] text-muted-foreground">
              RUT: {op.cliente.rut}
            </span>
          )}
        </div>
      )
    },
  },
  {
    id: "productos",
    header: "Productos",
    accessorFn: (row) => {
      const lineas = row.venta?.lineasDeVenta || []
      return lineas.map((l) => `${l.cantidad}x ${l.producto?.nombre}`).join(", ")
    },
    cell: ({ row }) => {
      const op = row.original
      const lineas = op.venta?.lineasDeVenta || []
      
      if (lineas.length === 0) {
        return <span className="text-muted-foreground italic text-xs">Sin productos</span>
      }

      const firstItem = `${lineas[0].cantidad}x ${lineas[0].producto?.nombre || "Producto"}`
      const extraCount = lineas.length - 1

      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
          <span className="font-medium truncate max-w-50">
            {firstItem}
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
    accessorKey: "estadoPago",
    header: "Estado Pago",
    cell: ({ row }) => {
      const op = row.original
      const isAnulada = op.estadoVenta?.toLowerCase() === "anulada"

      if (isAnulada) {
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-55 px-2.5 py-0.5 text-xs font-bold tracking-wider text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
            Anulada
          </span>
        )
      }

      switch (op.estadoPago?.toLowerCase()) {
        case "pagada":
        case "pagado":
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-bold tracking-wider text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400">
              Pagada
            </span>
          )
        case "pendiente":
          return (
            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-250 bg-yellow-50 px-2.5 py-0.5 text-xs font-bold tracking-wider text-yellow-750 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-450">
              Pendiente
            </span>
          )
        default:
          return (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {op.estadoPago}
            </span>
          )
      }
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="cursor-pointer p-0 font-semibold hover:bg-transparent"
      >
        Monto Total
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const total = Number(row.getValue("total"))
      return (
        <span className="font-bold text-slate-900 dark:text-white">
          ${total.toLocaleString("es-CL")}
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
