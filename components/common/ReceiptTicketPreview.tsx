import type { ReactNode } from "react"

export interface ReceiptTicketData {
  rutEmisor: string
  numeroFolio: number
  fechaEmision: string
  rutReceptor?: string
  montoNeto: number | string
  montoIva: number | string
  montoTotal: number | string
}

interface ReceiptTicketPreviewProps {
  receipt: ReceiptTicketData
  footerMessage?: ReactNode
}

function formatReceiptDate(value: string) {
  if (!value) return ""
  const datePart = value.split("T")[0]
  const parts = datePart.split("-")
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : value
}

export function ReceiptTicketPreview({
  receipt,
  footerMessage = <>¡Gracias por su preferencia!</>,
}: ReceiptTicketPreviewProps) {
  return (
    <div className="mx-auto max-w-xs space-y-4 rounded-xl border border-border bg-card p-6 text-xs font-mono text-foreground shadow-xs">
      <div className="space-y-1 text-center">
        <h4 className="font-sans text-sm font-extrabold tracking-tight text-foreground">URBAN CYCLING</h4>
        <p className="font-sans text-[10px] text-muted-foreground">Giro: Venta y Servicio de Bicicletas</p>
        <p className="font-sans text-[10px] text-muted-foreground">RUT Emisor: {receipt.rutEmisor}</p>
      </div>

      <div className="my-2 border-t border-dashed border-border" />

      <div className="text-center">
        <p className="font-sans text-xs font-semibold text-muted-foreground">Comprobante de Compra</p>
        <p className="font-sans text-sm font-extrabold text-primary">Folio N° {receipt.numeroFolio}</p>
      </div>

      <div className="my-2 border-t border-dashed border-border" />

      <div className="space-y-1">
        <p><span className="font-sans text-muted-foreground">Fecha Emisión:</span> {formatReceiptDate(receipt.fechaEmision)}</p>
        <p><span className="font-sans text-muted-foreground">Receptor:</span> {receipt.rutReceptor || "No informado"}</p>
      </div>

      <div className="my-2 border-t border-dashed border-border" />

      <div className="space-y-1.5 text-right">
        <div className="flex justify-between">
          <span className="font-sans text-muted-foreground">Monto Neto:</span>
          <span>${Number(receipt.montoNeto || 0).toLocaleString("es-CL")}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-sans text-muted-foreground">IVA (19%):</span>
          <span>${Number(receipt.montoIva || 0).toLocaleString("es-CL")}</span>
        </div>
        <div className="flex justify-between border-t border-dashed border-border pt-1 text-sm font-bold text-primary">
          <span className="font-sans">TOTAL:</span>
          <span>${Number(receipt.montoTotal || 0).toLocaleString("es-CL")}</span>
        </div>
      </div>

      <div className="my-2 border-t border-dashed border-border" />

      <div className="text-center font-sans text-[10px] leading-tight text-muted-foreground">
        Este documento es un comprobante interno de compra.<br />
        {footerMessage}
      </div>
    </div>
  )
}
