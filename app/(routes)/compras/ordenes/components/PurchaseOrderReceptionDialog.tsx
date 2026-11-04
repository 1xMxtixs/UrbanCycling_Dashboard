"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ReceptionOrder = {
  idOrdenDeCompra: number
  lineas: Array<{
    idLineaDeOrdenDeCompra: number
    cantidadOrdenada: number
    cantidadRecibida: number
    producto: { nombre: string }
  }>
}

export function PurchaseOrderReceptionDialog({
  order,
  onClose,
  onReceived,
}: {
  order: ReceptionOrder
  onClose: () => void
  onReceived: (message: string) => void
}) {
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submitting = useRef(false)

  async function receive(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const lines = order.lineas.map((line) => ({
      idLineaDeOrdenDeCompra: line.idLineaDeOrdenDeCompra,
      cantidadRecibida:
        quantities[line.idLineaDeOrdenDeCompra] === ""
          ? Number.NaN
          : Number(quantities[line.idLineaDeOrdenDeCompra] ?? "0"),
      cantidadRecibidaAnterior: line.cantidadRecibida,
    }))
    if (
      lines.some(
        (line, i) =>
          !Number.isSafeInteger(line.cantidadRecibida) ||
          line.cantidadRecibida < 0 ||
          line.cantidadRecibida >
            order.lineas[i].cantidadOrdenada - order.lineas[i].cantidadRecibida
      )
    ) {
      setError(
        "Ingrese cantidades enteras entre cero y las unidades pendientes de cada producto."
      )
      return
    }
    const received = lines.filter((line) => line.cantidadRecibida > 0)
    if (!received.length) {
      setError("Ingrese al menos una cantidad recibida mayor que cero.")
      return
    }
    submitting.current = true
    setBusy(true)
    setError("")
    try {
      const response = await fetch(
        `/api/ordenes-compra/${order.idOrdenDeCompra}/recepciones`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lineas: received }),
        }
      )
      const result = await response.json().catch(() => null)
      if (!response.ok)
        throw new Error(
          result?.message ?? "No fue posible registrar la recepción."
        )
      window.dispatchEvent(new Event("inventory:refresh"))
      onReceived(result.message)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No fue posible registrar la recepción."
      )
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        aria-busy={busy}
      >
        <DialogHeader>
          <DialogTitle>
            Registrar recepción · OC-{order.idOrdenDeCompra}
          </DialogTitle>
          <DialogDescription>
            Ingrese solo las unidades que llegaron en esta entrega. Se sumarán a
            lo recibido y al inventario, sin modificar lo pedido.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={receive} className="space-y-4">
          {order.lineas.map((line) => {
            const pending = line.cantidadOrdenada - line.cantidadRecibida
            const inputId = `reception-${line.idLineaDeOrdenDeCompra}`
            return (
              <div
                key={line.idLineaDeOrdenDeCompra}
                className="space-y-2 rounded-lg border p-3"
              >
                <p className="font-medium">{line.producto.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  Ordenado: {line.cantidadOrdenada} · Recibido:{" "}
                  {line.cantidadRecibida} · Pendiente: {pending}
                </p>
                <Label htmlFor={inputId}>Recibido en esta entrega</Label>
                <Input
                  id={inputId}
                  type="number"
                  min={0}
                  max={pending}
                  step={1}
                  required
                  disabled={busy || pending === 0}
                  value={quantities[line.idLineaDeOrdenDeCompra] ?? "0"}
                  onChange={(event) =>
                    setQuantities((current) => ({
                      ...current,
                      [line.idLineaDeOrdenDeCompra]: event.target.value,
                    }))
                  }
                />
              </div>
            )
          })}
          <p className="text-xs text-muted-foreground">
            Puede registrar una entrega parcial aunque el pago esté pendiente.
            El cierre de la orden exige recepción completa y pago total.
          </p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error} Si otra recepción fue registrada, cierre esta ventana para
              actualizar el detalle.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Registrando..." : "Confirmar recepción"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
