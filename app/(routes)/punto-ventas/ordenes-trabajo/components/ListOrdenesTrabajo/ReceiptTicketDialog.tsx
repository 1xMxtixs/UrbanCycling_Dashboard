"use client"

import { Button } from "@/components/ui/button"
import type { DocumentoTributario } from "@/app/(routes)/punto-ventas/ventas/types"
import { ReceiptTicketPreview } from "@/components/common/ReceiptTicketPreview"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface ReceiptTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeReceipt: DocumentoTributario | null
  onPrint: () => void
  isGeneratingReceipt: boolean
}

export function ReceiptTicketDialog({
  open,
  onOpenChange,
  activeReceipt,
  onPrint,
  isGeneratingReceipt,
}: ReceiptTicketDialogProps) {
  if (!activeReceipt) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-foreground">
            Comprobante de Compra Generado
          </DialogTitle>
          <DialogDescription>
            La boleta interna ha sido registrada y generada correctamente en el sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <ReceiptTicketPreview receipt={activeReceipt} />

          {/* Botones de acción */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onPrint}
              disabled={isGeneratingReceipt}
            >
              {isGeneratingReceipt ? "Imprimiendo..." : "Imprimir Comprobante"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
