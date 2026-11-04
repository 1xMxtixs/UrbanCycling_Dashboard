"use client"

import { ColumnDef, Row, Table } from "@tanstack/react-table"
import { Eye, Check, Ban, FileText } from "lucide-react"
import { StatusBadge } from "@/components/common/StatusBadge"
import { RowActionsMenu } from "@/components/common/RowActionsMenu"
import { DataField } from "@/components/common/DataField"
import { formatClientName, formatCLP } from "@/lib/formatters"
import { SortableHeader } from "@/components/common/SortableHeader"
import { ESTADO_PAGO, getNombreEstadoPago } from "@/lib/payment-status"
import { ESTADO_VENTA, isVentaAnulada } from "@/lib/sale-status"
import { SaleOperation } from "../../types"

interface VentaTableMeta {
  updatingId?: number | null
  onViewDetails?: (sale: SaleOperation) => void
  onUpdateStatus?: (idVenta: number, nextStatus: string, estadoVenta: string) => void
  onPayClick?: (idVenta: number, total: number) => void
  onGenerateReceipt?: (sale: SaleOperation) => void
  onCancelClick?: (sale: SaleOperation) => void
}

const CellActions = ({ row, table }: { row: Row<SaleOperation>; table: Table<SaleOperation> }) => {
  const op = row.original
  const meta = table.options.meta as VentaTableMeta | undefined
  const isPending = op.estadoPago === ESTADO_PAGO.PENDIENTE
  const isAnulada = isVentaAnulada(op.estadoVenta)
  const isPaid = op.estadoPago === ESTADO_PAGO.PAGADA

  return (
    <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
      <RowActionsMenu
        ariaLabel={`Acciones de la venta #${op.venta.idVenta}`}
        isLoading={meta?.updatingId === op.venta.idVenta}
        groups={[
          {
            actions: [
              {
                label: "Ver detalle",
                icon: Eye,
                onSelect: () => meta?.onViewDetails?.(op),
              },
              {
                label: "Generar boleta",
                icon: FileText,
                variant: "primary",
                hidden: !isPaid || isAnulada,
                onSelect: () => meta?.onGenerateReceipt?.(op),
              },
            ],
          },
          {
            label: "Cambiar estado",
            actions: [
              {
                label: "Marcar como pagada",
                icon: Check,
                hidden: !isPending || isAnulada,
                onSelect: () =>
                  meta?.onPayClick
                    ? meta.onPayClick(op.venta.idVenta, Number(op.total))
                    : meta?.onUpdateStatus?.(op.venta.idVenta, ESTADO_PAGO.PAGADA, op.estadoVenta),
              },
            ],
          },
          {
            actions: [
              {
                label: "Anular venta",
                icon: Ban,
                variant: "destructive",
                hidden: isAnulada,
                onSelect: () =>
                  meta?.onCancelClick
                    ? meta.onCancelClick(op)
                    : meta?.onUpdateStatus?.(op.venta.idVenta, ESTADO_PAGO.ANULADA, ESTADO_VENTA.ANULADA),
              },
            ],
          },
        ]}
      />
    </div>
  )
}

export const columns: ColumnDef<SaleOperation>[] = [
  {
    id: "idVenta",
    header: "ID Venta",
    accessorFn: (row) => row.venta.idVenta,
    cell: ({ row }) => (
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
        #{row.original.venta.idVenta}
      </span>
    ),
  },
  {
    id: "cliente",
    header: "Cliente",
    accessorFn: (row) => {
      if (!row.cliente) return "Cliente general"
      return (
        row.cliente.razonSocial ||
        `${row.cliente.primerNombre} ${row.cliente.apellidoPaterno || ""}`.trim()
      )
    },
    cell: ({ row }) => {
      const op = row.original
      const clientName = op.cliente ? formatClientName(op.cliente) : "Cliente general"

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
      const isAnulada = isVentaAnulada(op.estadoVenta)

      if (isAnulada) {
        return <StatusBadge status="danger" label="Anulada" showDot={false} />
      }

      switch (op.estadoPago) {
        case ESTADO_PAGO.PAGADA:
          return <StatusBadge status="success" label="Pagada" showDot={false} />
        case ESTADO_PAGO.PENDIENTE:
          return <StatusBadge status="warning" label="Pendiente" showDot={false} />
        default:
          return <StatusBadge status="neutral" label={getNombreEstadoPago(op.estadoPago)} showDot={false} />
      }
    },
  },
  {
    accessorKey: "total",
    header: ({ column }) => <SortableHeader column={column}>Monto total</SortableHeader>,
    sortingFn: (rowA, rowB, columnId) =>
      Number(rowA.getValue(columnId)) - Number(rowB.getValue(columnId)),
    cell: ({ row }) => {
      const total = Number(row.getValue("total"))
      return (
        <span className="text-sm font-semibold tabular-nums">{formatCLP(total)}</span>
      )
    },
  },
  {
    id: "acciones",
    header: () => <div className="text-right">Acciones</div>,
    cell: CellActions,
  },
]
