"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

function formatDocDate(dateInput: any) {
  if (!dateInput) return ""
  let dateStr = ""
  if (typeof dateInput === "string") {
    dateStr = dateInput
  } else if (dateInput instanceof Date) {
    const day = String(dateInput.getDate()).padStart(2, "0")
    const month = String(dateInput.getMonth() + 1).padStart(2, "0")
    const year = dateInput.getFullYear()
    return `${day}-${month}-${year}`
  } else {
    dateStr = new Date(dateInput).toISOString()
  }
  const datePart = dateStr.split("T")[0]
  const parts = datePart.split("-")
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr
}

interface SaleReceiptTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeReceipt: any | null
  onPrint: () => void
  isGeneratingReceipt: boolean
}

export function SaleReceiptTicketDialog({
  open,
  onOpenChange,
  activeReceipt,
  onPrint,
  isGeneratingReceipt,
}: SaleReceiptTicketDialogProps) {
  if (!activeReceipt) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-900 dark:text-white">
            Comprobante de Compra Generado
          </DialogTitle>
          <DialogDescription>
            La boleta interna ha sido registrada y generada correctamente en el sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Ticket Físico Preview */}
          <div className="rounded-xl border border-border bg-background p-6 shadow-inner text-xs font-mono text-foreground max-w-xs mx-auto space-y-4">
            <div className="text-center space-y-1">
              <h4 className="font-sans font-black text-sm tracking-tight text-slate-900 dark:text-white">URBAN CYCLING</h4>
              <p className="text-[10px] text-muted-foreground font-sans">Giro: Venta y Servicio de Bicicletas</p>
              <p className="text-[10px] text-muted-foreground font-sans">RUT Emisor: {activeReceipt.rutEmisor}</p>
            </div>

            <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />

            <div className="text-center">
              <p className="font-sans font-bold text-xs uppercase tracking-wider">Comprobante de Compra</p>
              <p className="font-sans font-black text-sm text-primary">Folio N° {activeReceipt.numeroFolio}</p>
            </div>

            <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />

            <div className="space-y-1">
              <p><span className="text-muted-foreground font-sans">Fecha Emisión:</span> {formatDocDate(activeReceipt.fechaEmision)}</p>
              <p><span className="text-muted-foreground font-sans">Receptor:</span> {activeReceipt.rutReceptor}</p>
            </div>

            <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />

            <div className="space-y-1.5 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Monto Neto:</span>
                <span>${Number(activeReceipt.montoNeto).toLocaleString("es-CL")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">IVA (19%):</span>
                <span>${Number(activeReceipt.montoIva).toLocaleString("es-CL")}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-dashed border-slate-300 dark:border-slate-700 pt-1 text-sm text-primary">
                <span className="font-sans">TOTAL:</span>
                <span>${Number(activeReceipt.montoTotal).toLocaleString("es-CL")}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-2" />

            <div className="text-center text-[10px] text-muted-foreground font-sans leading-tight">
              Este documento es un comprobante interno de compra.<br />
              ¡Gracias por su preferencia!
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
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
