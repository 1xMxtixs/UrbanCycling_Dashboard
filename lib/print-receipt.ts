import type { DocumentoTributario, ReceiptLine } from "@/app/(routes)/punto-ventas/ventas/types"
import { escapeHtml } from "@/components/common/WorkOrderDocument"

interface PrintReceiptOptions {
  dte: DocumentoTributario
  clientLabel: string
  clientRut?: string
  lines: ReceiptLine[]
  detailLabel: string
  lineFallback: string
  thanksMessage: string
  onError: () => void
}

/** Abre e imprime un comprobante interno en blanco y negro. */
export function printReceipt({
  dte,
  clientLabel,
  clientRut,
  lines,
  detailLabel,
  lineFallback,
  thanksMessage,
  onError,
}: PrintReceiptOptions) {
  const content = `
    <html>
      <head>
        <title>Comprobante de Compra N° ${escapeHtml(dte.numeroFolio)}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; padding: 20px; max-width: 300px; margin: 0 auto; font-size: 12px; color: #000; line-height: 1.4; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .flex { display: flex; justify-content: space-between; }
          .header-title { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
          .receipt-title { font-size: 14px; font-weight: bold; margin: 15px 0 5px 0; }
          .footer { font-size: 10px; margin-top: 25px; text-align: center; color: #555; }
        </style>
      </head>
      <body>
        <div class="text-center header-title">URBAN CYCLING</div>
        <div class="text-center">Giro: Venta y Servicio de Bicicletas</div>
        <div class="text-center">RUT Emisor: ${escapeHtml(dte.rutEmisor)}</div>
        <div class="divider"></div>
        <div class="text-center receipt-title">COMPROBANTE DE COMPRA</div>
        <div class="text-center bold">N° Folio: ${escapeHtml(dte.numeroFolio)}</div>
        <div class="divider"></div>
        <div>Fecha Emisión: ${new Date(dte.fechaEmision).toLocaleDateString("es-CL")}</div>
        <div>Cliente: ${escapeHtml(clientLabel)}</div>
        ${clientRut ? `<div>RUT Receptor: ${escapeHtml(clientRut)}</div>` : ""}
        <div class="divider"></div>
        <div class="bold" style="margin-bottom: 5px;">${escapeHtml(detailLabel)}</div>
        ${lines.map((line) => `
          <div class="flex">
            <span>${line.cantidad}x ${escapeHtml(line.servicio?.nombre || line.producto?.nombre || lineFallback)}</span>
            <span>$${(line.cantidad * Number(line.precioUnitario)).toLocaleString("es-CL")}</span>
          </div>
        `).join("")}
        <div class="divider"></div>
        <div class="flex"><span>Neto:</span><span>$${Number(dte.montoNeto).toLocaleString("es-CL")}</span></div>
        <div class="flex"><span>IVA (19%):</span><span>$${Number(dte.montoIva).toLocaleString("es-CL")}</span></div>
        <div class="flex bold" style="font-size: 13px; margin-top: 5px;"><span>TOTAL:</span><span>$${Number(dte.montoTotal).toLocaleString("es-CL")}</span></div>
        <div class="divider"></div>
        <div class="footer">ESTE DOCUMENTO ES UN COMPROBANTE INTERNO DE COMPRA.<br>${escapeHtml(thanksMessage)}</div>
      </body>
    </html>
  `

  const iframe = document.createElement("iframe")
  iframe.style.position = "fixed"
  iframe.style.right = "0"
  iframe.style.bottom = "0"
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.border = "0"
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentWindow?.document
  if (!iframeDoc) {
    onError()
    document.body.removeChild(iframe)
    return
  }

  iframeDoc.open()
  iframeDoc.write(content)
  iframeDoc.close()

  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
  }

  const cleanup = () => {
    if (document.body.contains(iframe)) document.body.removeChild(iframe)
  }

  if (iframe.contentWindow) iframe.contentWindow.onafterprint = cleanup
  setTimeout(cleanup, 60000)
}
