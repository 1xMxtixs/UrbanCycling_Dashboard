"use client"

import { Coins, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/components/forms/FormDialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WorkOrder } from "../../types"
import { METODOS_PAGO } from "@/lib/payment-methods"
import { ESTADO_OT } from "@/lib/work-order-status"

interface OrderPayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder
  selectedMetodoPago: string
  onMetodoPagoChange: (metodo: string) => void
  onConfirmPayment: (monto: number) => void
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
  const total = Number(order.total)
  const totalPagado = Number(order.totalPagado || 0)
  const saldoPendiente = Math.max(0, total - totalPagado)
  const [montoDraft, setMontoDraft] = useState(String(saldoPendiente))
  const monto = Number(montoDraft)
  const montoValido =
    Number.isSafeInteger(monto) &&
    monto > 0 &&
    monto <= saldoPendiente &&
    monto <= 999999999999
  const anulada = order.estadoOrden === ESTADO_OT.ANULADA
  const saldoDespues = montoValido ? saldoPendiente - monto : saldoPendiente

  return (
    <FormDialog
      open={open}
      onOpenChange={(value) => {
        if (!isConfirmingPayment) onOpenChange(value)
      }}
      title={
        <span className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Registrar pago o abono
        </span>
      }
      description="Indica el monto y el método utilizado. Puedes registrar varios abonos hasta completar el saldo de la orden."
      size="md"
      footer={
        <div className="flex justify-end gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isConfirmingPayment}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="order-payment-form"
            size="sm"
            disabled={isConfirmingPayment || !montoValido || anulada}
          >
            {isConfirmingPayment ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Procesando…
              </>
            ) : montoValido && monto === saldoPendiente ? (
              "Completar pago"
            ) : (
              "Registrar abono"
            )}
          </Button>
        </div>
      }
    >
      <form
        id="order-payment-form"
        className="space-y-4 py-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (montoValido && !anulada && !isConfirmingPayment)
            onConfirmPayment(monto)
        }}
      >
        <div className="space-y-2 rounded-lg border bg-muted/40 p-3 font-mono text-xs">
          <div className="flex justify-between">
            <span className="font-sans text-muted-foreground">ID Orden:</span>
            <span className="font-bold">#{order.idOrdenDeTrabajo}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-muted-foreground">
              Monto Total Orden:
            </span>
            <span className="font-bold">${total.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-sans text-muted-foreground">
              Monto Ya Pagado (Abonos):
            </span>
            <span className="font-bold text-foreground">
              ${totalPagado.toLocaleString("es-CL")}
            </span>
          </div>
          <div className="flex justify-between border-t border-dashed pt-2">
            <span className="font-sans text-muted-foreground">
              Saldo Restante a Cobrar:
            </span>
            <span className="text-sm font-bold text-destructive">
              ${saldoPendiente.toLocaleString("es-CL")}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="montoPagoModal">Monto a pagar ahora ($)</Label>
            <Button
              type="button"
              variant="link"
              size="sm"
              disabled={isConfirmingPayment || saldoPendiente === 0 || anulada}
              onClick={() => setMontoDraft(String(saldoPendiente))}
            >
              Pagar saldo completo
            </Button>
          </div>
          <Input
            id="montoPagoModal"
            type="number"
            inputMode="numeric"
            min={1}
            max={saldoPendiente}
            step={1}
            required
            value={montoDraft}
            onChange={(event) => setMontoDraft(event.target.value)}
            disabled={isConfirmingPayment || saldoPendiente === 0 || anulada}
            aria-invalid={!montoValido}
            aria-describedby="order-payment-amount-help"
          />
          <p
            id="order-payment-amount-help"
            className={`text-xs ${montoValido ? "text-muted-foreground" : "text-destructive"}`}
          >
            {anulada
              ? "No se pueden registrar pagos en una orden anulada."
              : saldoPendiente === 0
                ? "La orden ya está saldada."
                : !montoValido
                  ? "Ingresa un monto entero positivo que no supere el saldo pendiente."
                  : `Saldo después del pago: $${saldoDespues.toLocaleString("es-CL")}.`}
          </p>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="metodoPagoModal"
            className="text-xs font-semibold text-foreground"
          >
            Método de Pago
          </Label>
          <Select
            value={selectedMetodoPago}
            onValueChange={onMetodoPagoChange}
            disabled={isConfirmingPayment || saldoPendiente === 0 || anulada}
          >
            <SelectTrigger
              id="metodoPagoModal"
              className="w-full border bg-background text-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {METODOS_PAGO.map((metodo) => (
                <SelectItem key={metodo.codigo} value={metodo.codigo}>
                  {metodo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
    </FormDialog>
  )
}
