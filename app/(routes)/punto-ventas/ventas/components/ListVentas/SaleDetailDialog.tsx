"use client"

import { User, Calendar, ShoppingBag, CheckCircle, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { DataField } from "@/components/common/DataField"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatClientName, formatCLP } from "@/lib/formatters"
import { ESTADO_PAGO, getNombreEstadoPago } from "@/lib/payment-status"
import { ESTADO_VENTA, isVentaAnulada } from "@/lib/sale-status"
import { SaleOperation } from "../../types"

interface SaleDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: SaleOperation | null
  onPayClick: (idVenta: number, total: number) => void
  onUpdateStatus: (idVenta: number, nextPago: string, nextVenta: string) => void
  onCancelClick?: (op: SaleOperation) => void
}

export function SaleDetailDialog({
  open,
  onOpenChange,
  sale,
  onPayClick,
  onUpdateStatus,
  onCancelClick,
}: SaleDetailDialogProps) {
  if (!sale) return null

  const lineas = sale.venta?.lineasDeVenta || []
  const subtotal = lineas.reduce((sum, l) => sum + (l.cantidad * Number(l.precioUnitario)), 0)
  const descuento = sale.total ? Math.max(0, subtotal - Number(sale.total)) : 0
  const total = Number(sale.total)
  const neto = Math.round(total / 1.19)
  const iva = total - neto
  const isAnulada = isVentaAnulada(sale.estadoVenta)
  const clientLabel = sale.cliente ? formatClientName(sale.cliente) : "Cliente general"
  const sellerName = [sale.usuario?.primerNombre, sale.usuario?.apellidoPaterno]
    .filter(Boolean)
    .join(" ") || "—"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,48rem)] flex-col overflow-hidden bg-popover p-0 sm:max-w-xl">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4 pr-12">
          <DialogTitle className="flex items-center justify-between text-xl font-black">
            <span>Detalle de Venta #{sale.venta.idVenta}</span>
            <StatusBadge
              status={
                isAnulada
                  ? "danger"
                  : sale.estadoPago === ESTADO_PAGO.PAGADA
                    ? "success"
                    : "warning"
              }
              label={isAnulada ? "Anulada" : getNombreEstadoPago(sale.estadoPago)}
              showDot={false}
            />
          </DialogTitle>
          <DialogDescription>
            Resumen detallado de la venta en mostrador registrada
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain space-y-4 px-6 pb-5 pt-2 text-xs font-mono">
          {/* Info Cliente */}
          <div className="space-y-1 rounded-lg border border-border bg-popover p-3">
            <div className="flex items-center gap-1.5 font-sans font-bold border-b border-border pb-1 mb-1 text-foreground">
              <User className="h-3.5 w-3.5 text-primary" />
              Datos de Facturación / Cliente
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <DataField
                label="Nombre/Razón Social"
                value={clientLabel}
              />
              {sale.cliente && (
                <DataField
                  label="RUT"
                  value={sale.cliente.rut}
                />
              )}
              <DataField
                label="Fecha Operación"
                value={new Date(sale.fechaCreacion).toLocaleString("es-CL")}
                icon={Calendar}
              />
              <DataField
                label="Vendedor"
                value={sellerName}
              />
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-sans font-bold border-b border-border pb-1 mb-1 text-foreground">
              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
              Productos Vendidos
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-popover">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cant</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineas.map((line) => {
                    const lineSubtotal = line.cantidad * Number(line.precioUnitario)
                    return (
                      <TableRow key={line.idLineaDeVenta}>
                        <TableCell className="font-medium">
                          {line.producto?.nombre || `Producto #${line.idProducto}`}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {line.cantidad}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCLP(Number(line.precioUnitario))}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCLP(lineSubtotal)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Totales */}
          <div className="grid gap-3 pt-1 sm:grid-cols-2">
            <DataField label="Subtotal bruto" value={formatCLP(subtotal)} />
            {descuento > 0 && (
              <DataField label="Descuento" value={`-${formatCLP(descuento)}`} />
            )}
            <DataField label="Neto estimado" value={formatCLP(neto)} />
            <DataField label="IVA (19%)" value={formatCLP(iva)} />
            <DataField label="Total de la venta" value={formatCLP(total)} />
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className="flex shrink-0 justify-between gap-2 border-t border-border bg-popover px-6 py-4">
          <div>
            {!isAnulada && sale.estadoPago === ESTADO_PAGO.PENDIENTE && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPayClick(sale.venta.idVenta, total)}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Registrar Pago
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!isAnulada && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (onCancelClick) {
                    onCancelClick(sale)
                  } else {
                    onUpdateStatus(sale.venta.idVenta, ESTADO_PAGO.ANULADA, ESTADO_VENTA.ANULADA)
                  }
                }}
              >
                <Ban className="h-4 w-4 mr-1.5" />
                Anular
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
