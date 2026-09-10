"use client"

import { Coins, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WorkOrder } from "../../types"

interface OrderPayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder | null
  selectedMetodoPago: string
  onMetodoPagoChange: (metodo: string) => void
  onConfirmPayment: () => void
  isConfirmingPayment: boolean
}

export function OrderPayDialog({
  open,
  onOpenChange,
  order,
  selectedMetodoPago,
  onMetodoPagoChange,
  onConfirmPayment,
  isConfirmingPayment,
}: OrderPayDialogProps) {
  if (!order) return null

  const total = Number(order.total)
  const totalPagado = Number(order.totalPagado || 0)
  const saldoPendiente = Math.max(0, total - totalPagado)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-green-600 dark:text-green-400">
            <Coins className="h-5 w-5" />
            Confirmar Registro de Pago Restante
          </DialogTitle>
          <DialogDescription>
            Seleccione el método de pago utilizado por el cliente para saldar la cuenta pendiente de la orden de trabajo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 border p-3 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-sans">ID Orden:</span>
              <span className="font-bold">#{order.idOrdenDeTrabajo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-sans">Monto Total Orden:</span>
              <span className="font-bold">${total.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-sans">Monto Ya Pagado (Abonos):</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">${totalPagado.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between border-t border-dashed pt-2">
              <span className="text-muted-foreground font-sans">Saldo Restante a Cobrar:</span>
              <span className="font-bold text-red-500 text-sm">${saldoPendiente.toLocaleString("es-CL")}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodoPagoModal" className="text-xs font-bold text-slate-700">
              Método de Pago
            </Label>
            <Select
              value={selectedMetodoPago}
              onValueChange={onMetodoPagoChange}
            >
              <SelectTrigger className="w-full border bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="debito">Tarjeta de Débito</SelectItem>
                <SelectItem value="credito">Tarjeta de Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isConfirmingPayment}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onConfirmPayment}
              disabled={isConfirmingPayment}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {isConfirmingPayment ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Procesando...
                </span>
              ) : (
                "Confirmar Pago Restante"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
