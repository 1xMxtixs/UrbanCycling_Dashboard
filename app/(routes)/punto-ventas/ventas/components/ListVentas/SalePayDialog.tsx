"use client"

import { Coins, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/components/forms/FormDialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { METODOS_PAGO } from "@/lib/payment-methods"

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
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Confirmar Registro de Pago
        </span>
      }
      description="Seleccione el método de pago utilizado por el cliente para saldar la venta."
      size="md"
    >
      <div className="space-y-4 py-2">
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
          <Label htmlFor="metodoPagoModal" className="text-xs font-semibold text-foreground">
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
              {METODOS_PAGO.map((metodo) => <SelectItem key={metodo.codigo} value={metodo.codigo}>{metodo.nombre}</SelectItem>)}
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
    </FormDialog>
  )
}
