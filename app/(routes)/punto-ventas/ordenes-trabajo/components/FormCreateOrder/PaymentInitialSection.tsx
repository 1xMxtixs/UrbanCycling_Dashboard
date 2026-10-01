"use client"

import React from "react"
import { DollarSign } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ESTADO_PAGO } from "@/lib/payment-status"
import { METODOS_PAGO } from "@/lib/payment-methods"

interface PaymentInitialSectionProps {
  estadoPago: string
  metodoPago: string
  montoAbono: number
  grandTotal: number
  onEstadoPagoChange: (estado: string) => void
  onMetodoPagoChange: (metodo: string) => void
  onMontoAbonoChange: (monto: number) => void
}

export function PaymentInitialSection({
  estadoPago,
  metodoPago,
  montoAbono,
  grandTotal,
  onEstadoPagoChange,
  onMetodoPagoChange,
  onMontoAbonoChange,
}: PaymentInitialSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
      <h3 className="text-foreground flex items-center gap-2 border-b border-border pb-2 text-sm font-bold">
        <DollarSign className="h-4.5 w-4.5 text-primary" />
        Información del Pago Inicial
      </h3>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Tipo de Pago / Estado Pago */}
        <div className="space-y-1.5">
          <Label
            htmlFor="estadoPago"
            className="text-muted-foreground text-xs font-semibold"
          >
            Tipo de Pago Inicial
          </Label>
          <Select value={estadoPago} onValueChange={onEstadoPagoChange}>
            <SelectTrigger className="h-10 w-full border-input bg-background text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ESTADO_PAGO.PENDIENTE}>
                Pendiente (Sin Pago Inicial)
              </SelectItem>
              <SelectItem value={ESTADO_PAGO.PARCIAL}>Abono (Pago Parcial)</SelectItem>
              <SelectItem value={ESTADO_PAGO.PAGADA}>
                Pago Total (${grandTotal.toLocaleString("es-CL")})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Método de Pago */}
        {estadoPago !== ESTADO_PAGO.PENDIENTE && (
          <div className="animate-in space-y-1.5 duration-200 fade-in">
            <Label
              htmlFor="metodoPago"
              className="text-muted-foreground text-xs font-semibold"
            >
              Método de Pago
            </Label>
            <Select value={metodoPago} onValueChange={onMetodoPagoChange}>
              <SelectTrigger className="h-10 w-full border-input bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {METODOS_PAGO.map((metodo) => <SelectItem key={metodo.codigo} value={metodo.codigo}>{metodo.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Monto del Abono */}
        {estadoPago === ESTADO_PAGO.PARCIAL && (
          <div className="animate-in space-y-1.5 duration-200 fade-in">
            <Label
              htmlFor="montoAbono"
              className="text-muted-foreground text-xs font-semibold"
            >
              Monto del Abono
            </Label>
            <Input
              id="montoAbono"
              type="number"
              min={1}
              max={grandTotal - 1}
              value={montoAbono || ""}
              onChange={(e) =>
                onMontoAbonoChange(Math.max(0, Number(e.target.value)))
              }
              placeholder="Monto en CLP"
              required
            />
          </div>
        )}
      </div>
    </div>
  )
}
