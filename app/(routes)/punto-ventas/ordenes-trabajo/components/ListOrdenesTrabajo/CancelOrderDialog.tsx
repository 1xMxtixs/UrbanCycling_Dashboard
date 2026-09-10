"use client"

import { Loader2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { WorkOrder } from "../../types"

interface CancelOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder | null
  onConfirmCancel: () => void
  isCancelling: boolean
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  order,
  onConfirmCancel,
  isCancelling,
}: CancelOrderDialogProps) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-rose-600 dark:text-rose-400">
            <XCircle className="h-5 w-5" />
            Anular Orden de Trabajo
          </DialogTitle>
          <DialogDescription>
            Confirma la anulación de la orden seleccionada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs space-y-2">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Orden</span>
              <span className="font-bold text-foreground">#{order.idOrdenDeTrabajo}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Estado actual</span>
              <span className="font-bold text-foreground">{order.estadoOrden}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isCancelling}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onConfirmCancel}
              disabled={isCancelling}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isCancelling ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Anulando...
                </span>
              ) : (
                "Confirmar Anulación"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
