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

interface SalePayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleToPay: { idVenta: number; total: number } | null
  selectedMetodoPago: string
  onMetodoPagoChange: (metodo: string) => void
  onConfirmPayment: () => void
  isConfirmingPayment: boolean
}

export function SalePayDialog({
  open,
  onOpenChange,
  saleToPay,
  selectedMetodoPago,
  onMetodoPagoChange,
  onConfirmPayment,
  isConfirmingPayment,
}: SalePayDialogProps) {
  if (!saleToPay) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-green-600 dark:text-green-400">
            <Coins className="h-5 w-5" />
            Confirmar Registro de Pago
          </DialogTitle>
          <DialogDescription>
            Seleccione el método de pago utilizado por el cliente para saldar la venta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-lg bg-muted/30 border border-border p-3 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-sans">ID Venta:</span>
              <span className="font-bold">#{saleToPay.idVenta}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-sans">Monto a Pagar:</span>
              <span className="font-bold text-primary">${saleToPay.total.toLocaleString("es-CL")}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodoPagoModal" className="text-xs font-bold text-foreground">
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
                "Confirmar y Pagar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
