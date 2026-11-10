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
  totalProductsCost: number
  totalServicesCost: number
  grandTotal: number
  onEstadoPagoChange: (estado: string) => void
  onMetodoPagoChange: (metodo: string) => void
  onMontoAbonoChange: (monto: number) => void
}

export function PaymentInitialSection({
  estadoPago,
  metodoPago,
  montoAbono,
  totalProductsCost,
  totalServicesCost,
  grandTotal,
  onEstadoPagoChange,
  onMetodoPagoChange,
  onMontoAbonoChange,
}: PaymentInitialSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <h3 className="text-foreground flex items-center gap-2 border-b border-border pb-2 text-sm font-bold">
        <DollarSign className="h-4.5 w-4.5 text-muted-foreground" />
        Información del Pago Inicial
      </h3>

      <div className="space-y-3">
        <div className={`grid content-start gap-3 ${estadoPago === ESTADO_PAGO.PARCIAL ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
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
          <div className="animate-in space-y-1.5 duration-200 fade-in motion-reduce:animate-none">
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
          <div className="animate-in space-y-1.5 duration-200 fade-in motion-reduce:animate-none">
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

        <div className="space-y-2.5 rounded-lg border border-border/70 bg-muted/50 p-3 text-xs font-semibold">
          <h4 className="border-b border-border pb-1.5 text-xs font-semibold text-foreground">
            Resumen de la orden
          </h4>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Total repuestos:</span>
            <span className="text-foreground">${totalProductsCost.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Total servicios:</span>
            <span className="text-foreground">${totalServicesCost.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between gap-3 pt-1 text-[11px] font-normal text-muted-foreground">
            <span>Neto estimado (afecto):</span>
            <span>${Math.round(grandTotal / 1.19).toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between gap-3 text-[11px] font-normal text-muted-foreground">
            <span>IVA (19%):</span>
            <span>${(grandTotal - Math.round(grandTotal / 1.19)).toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-2.5 text-sm font-bold text-foreground">
            <span>Total orden:</span>
            <span>${grandTotal.toLocaleString("es-CL")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
