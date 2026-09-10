"use client"

import { CalendarClock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { WorkOrder } from "../../types"

function toDateInputValue(dateInput: string | Date | null | undefined) {
  if (!dateInput) return ""
  if (typeof dateInput === "string") {
    return dateInput.split("T")[0] ?? ""
  }
  return dateInput.toISOString().split("T")[0] ?? ""
}

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder | null
  newDeliveryDate: string
  onNewDeliveryDateChange: (date: string) => void
  onConfirmReschedule: () => void
  isRescheduling: boolean
}

export function RescheduleDialog({
  open,
  onOpenChange,
  order,
  newDeliveryDate,
  onNewDeliveryDateChange,
  onConfirmReschedule,
  isRescheduling,
}: RescheduleDialogProps) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-amber-700 dark:text-amber-400">
            <CalendarClock className="h-5 w-5" />
            Reprogramar Entrega
          </DialogTitle>
          <DialogDescription>
            Actualiza la fecha estimada comprometida para la orden seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-lg bg-muted/40 border border-border p-3 text-xs space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Orden</span>
              <span className="font-bold">#{order.idOrdenDeTrabajo}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Fecha de ingreso</span>
              <span className="font-bold">
                {new Date(order.fechaRecepcion || order.fechaCreacion || "").toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Fecha estimada actual</span>
              <span className="font-bold">
                {new Date(order.fechaEntregaEstimada).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nuevaFechaEntrega" className="text-xs font-bold text-foreground">
              Nueva Fecha Estimada de Entrega
            </Label>
            <Input
              id="nuevaFechaEntrega"
              type="date"
              value={newDeliveryDate}
              min={toDateInputValue(order.fechaRecepcion || order.fechaCreacion)}
              onChange={(event) => onNewDeliveryDateChange(event.target.value)}
              disabled={isRescheduling}
              className="h-10"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isRescheduling}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onConfirmReschedule}
              disabled={isRescheduling}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isRescheduling ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar Reprogramación"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
