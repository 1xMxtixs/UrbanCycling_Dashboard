"use client"

import { User, Calendar, ShoppingBag, CheckCircle, Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { DataField } from "@/components/DataField"
import { formatClientName } from "@/lib/formatters"
import { SaleOperation } from "../../types"

interface SaleDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: SaleOperation | null
  onPayClick: (idVenta: number, total: number) => void
  onUpdateStatus: (idVenta: number, nextPago: string, nextVenta: string) => void
}

export function SaleDetailDialog({
  open,
  onOpenChange,
  sale,
  onPayClick,
  onUpdateStatus,
}: SaleDetailDialogProps) {
  if (!sale) return null

  const lineas = sale.venta?.lineasDeVenta || []
  const subtotal = lineas.reduce((sum, l) => sum + (l.cantidad * Number(l.precioUnitario)), 0)
  const descuento = sale.total ? Math.max(0, subtotal - Number(sale.total)) : 0
  const total = Number(sale.total)
  const neto = Math.round(total / 1.19)
  const iva = total - neto
  const isAnulada = sale.estadoVenta === "anulada"
  const clientLabel = formatClientName(sale.cliente)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-2">
          <DialogTitle className="flex items-center justify-between text-xl font-black">
            <span>Detalle de Venta #{sale.idPuntoVenta}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
              isAnulada
                ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                : (sale.estadoPago?.toLowerCase() === "pagada" || sale.estadoPago?.toLowerCase() === "pagado")
                  ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                  : "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
            }`}>
              {isAnulada ? "Anulada" : sale.estadoPago}
            </span>
          </DialogTitle>
          <DialogDescription>
            Resumen detallado de la venta en mostrador registrada
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 py-4 space-y-4 text-xs font-mono">
          {/* Info Cliente */}
          <div className="space-y-1 bg-muted/30 p-3 rounded-lg border border-border">
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
                label="Vendedor Responsable"
                value="ID #1 (Admin)"
              />
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-sans font-bold border-b border-border pb-1 mb-1 text-foreground">
              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
              Productos Vendidos
            </div>
            <div className="rounded-lg border border-border bg-background overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted text-muted-foreground font-bold border-b border-border">
                    <th className="px-3 py-1.5">Producto</th>
                    <th className="px-3 py-1.5 text-center">Cant</th>
                    <th className="px-3 py-1.5 text-right">Precio Unit.</th>
                    <th className="px-3 py-1.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {lineas.map((line) => {
                    const lineSubtotal = line.cantidad * Number(line.precioUnitario)
                    return (
                      <tr key={line.idLineaDeVenta}>
                        <td className="px-3 py-1.5 font-medium">
                          {line.producto?.nombre || `Producto #${line.idProducto}`}
                        </td>
                        <td className="px-3 py-1.5 text-center font-bold">
                          {line.cantidad}
                        </td>
                        <td className="px-3 py-1.5 text-right">
                          ${Number(line.precioUnitario).toLocaleString("es-CL")}
                        </td>
                        <td className="px-3 py-1.5 text-right font-bold">
                          ${lineSubtotal.toLocaleString("es-CL")}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totales */}
          <div className="grid gap-3 border-t border-slate-200/50 pt-3 sm:grid-cols-2">
            <DataField label="Subtotal bruto" value={`$${subtotal.toLocaleString("es-CL")}`} />
            {descuento > 0 && (
              <DataField label="Descuento" value={`-$${descuento.toLocaleString("es-CL")}`} />
            )}
            <DataField label="Neto estimado" value={`$${neto.toLocaleString("es-CL")}`} />
            <DataField label="IVA (19%)" value={`$${iva.toLocaleString("es-CL")}`} />
            <DataField label="Total de la venta" value={`$${total.toLocaleString("es-CL")}`} />
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className="flex justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <div>
            {!isAnulada && sale.estadoPago?.toLowerCase() === "pendiente" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPayClick(sale.venta.idVenta, total)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold"
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
                onClick={() => onUpdateStatus(sale.venta.idVenta, "anulada", "anulada")}
                className="font-bold"
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
