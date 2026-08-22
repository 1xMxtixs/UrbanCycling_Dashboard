"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Eye, Check, XCircle, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/StatusBadge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { DataField } from "@/components/DataField"
import { formatClientName } from "@/lib/formatters"
import { SaleOperation } from "../../types"

const CellActions = ({ row, table }: { row: any; table: any }) => {
  const op = row.original as SaleOperation
  const meta = table.options.meta as any
  const isPending = op.estadoPago?.toLowerCase() === "pendiente"
  const isAnulada = op.estadoVenta?.toLowerCase() === "anulada"
  const isPaid =
    op.estadoPago?.toLowerCase() === "pagada" ||
    op.estadoPago?.toLowerCase() === "pagado"

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
            className="flex cursor-pointer items-center gap-2 text-primary font-semibold"
          >
            <FileText className="h-4 w-4" />
            Generar Boleta
          </DropdownMenuItem>
        )}

        {!isAnulada && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
              Actualizar Venta
            </DropdownMenuLabel>

            {isPending && (
              <DropdownMenuItem
                onClick={() =>
                  meta?.onPayClick
                    ? meta.onPayClick(op.venta.idVenta, op.total)
                    : meta?.onUpdateStatus(op.venta.idVenta, "pagada", op.estadoVenta)
                }
                className="flex cursor-pointer items-center gap-2 text-primary font-semibold"
              >
                <Check className="h-4 w-4" />
                Marcar como Pagada
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => meta?.onUpdateStatus(op.venta.idVenta, "anulada", "anulada")}
              className="flex cursor-pointer items-center gap-2 text-destructive font-semibold"
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
      <DataField variant="table-cell" value={`#${row.getValue("idPuntoVenta")}`} />
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
      const clientName = formatClientName(op.cliente)

      return (
        <DataField
          variant="table-cell"
          value={clientName}
          secondaryValue={op.cliente?.rut ? `RUT: ${op.cliente.rut}` : undefined}
        />
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
        return <DataField variant="table-cell" value="Sin productos" />
      }

      const firstItem = `${lineas[0].cantidad}x ${lineas[0].producto?.nombre || "Producto"}`
      const extraCount = lineas.length - 1

      return (
        <div className="flex items-center gap-1.5">
          <DataField variant="table-cell" value={firstItem} />
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
    accessorKey: "estadoPago",
    header: "Estado Pago",
    cell: ({ row }) => {
      const op = row.original
      const isAnulada = op.estadoVenta?.toLowerCase() === "anulada"

      if (isAnulada) {
        return <StatusBadge status="danger" label="Anulada" />
      }

      switch (op.estadoPago?.toLowerCase()) {
        case "pagada":
        case "pagado":
          return <StatusBadge status="success" label="Pagada" />
        case "pendiente":
          return <StatusBadge status="warning" label="Pendiente" />
        default:
          return <StatusBadge status="neutral" label={op.estadoPago} />
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
        <DataField
          variant="table-cell"
          value={`$${total.toLocaleString("es-CL")}`}
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
