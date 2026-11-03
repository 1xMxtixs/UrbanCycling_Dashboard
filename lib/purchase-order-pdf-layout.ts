import type { PurchaseOrderDocumentData } from "@/lib/purchase-order-document-data"

export const PAGE_MARGIN = 36
const PAGE_HEIGHT = 792
export const CONTENT_WIDTH = 612 - PAGE_MARGIN * 2
const CONTENT_BOTTOM = PAGE_HEIGHT - PAGE_MARGIN - 24
const FOOTER_Y = PAGE_HEIGHT - PAGE_MARGIN - 12

const moneyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
})

const stateStyles: Record<string, { background: string; foreground: string }> = {
  BORRADOR: { background: "#f1f5f9", foreground: "#475569" },
  ENVIADA: { background: "#dbeafe", foreground: "#1d4ed8" },
  COMPLETADA: { background: "#dcfce7", foreground: "#166534" },
  ANULADA: { background: "#fee2e2", foreground: "#991b1b" },
}

export type PurchaseOrderReportContext = {
  generatedAt: Date
  generatedBy: string
}

export function money(value: number) {
  return moneyFormatter.format(value)
}

export function date(
  value: Date | null,
  timeZone: "UTC" | "America/Santiago" = "UTC",
) {
  return value
    ? new Intl.DateTimeFormat("es-CL", {
        dateStyle: "short",
        timeZone,
      }).format(value)
    : "-"
}

export function dateTime(value: Date) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Santiago",
  }).format(value)
}

export function readableLabel(value: string) {
  const normalized = value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-CL")

  return normalized
    ? normalized.charAt(0).toLocaleUpperCase("es-CL") + normalized.slice(1)
    : "-"
}

export function providerAddress(order: PurchaseOrderDocumentData) {
  const address = order.proveedor.direcciones[0]

  if (!address) return "Sin dirección registrada"

  return [
    `${address.calle} ${address.numero}`,
    address.unidad,
    address.comuna,
    address.ciudad,
    address.region,
  ]
    .filter(Boolean)
    .join(", ")
}

export function drawPageHeader(
  pdf: PDFKit.PDFDocument,
  order: PurchaseOrderDocumentData,
) {
  pdf
    .font("Helvetica-Bold")
    .fontSize(17)
    .fillColor("#004D70")
    .text("URBAN CYCLING", PAGE_MARGIN, PAGE_MARGIN, {
      width: CONTENT_WIDTH / 2,
    })
  pdf
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#64748b")
    .text("Reporte de gestión interna", PAGE_MARGIN, pdf.y + 2)
  pdf
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#004D70")
    .text(
      `ORDEN DE COMPRA #${order.idOrdenDeCompra}`,
      PAGE_MARGIN,
      PAGE_MARGIN,
      { width: CONTENT_WIDTH, align: "right" },
    )

  const style = stateStyles[order.estado] ?? stateStyles.BORRADOR
  const badgeWidth = 92
  const badgeX = PAGE_MARGIN + CONTENT_WIDTH - badgeWidth

  pdf.roundedRect(badgeX, PAGE_MARGIN + 22, badgeWidth, 18, 4).fill(style.background)
  pdf
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(style.foreground)
    .text(readableLabel(order.estado), badgeX, PAGE_MARGIN + 27, {
      width: badgeWidth,
      align: "center",
      lineBreak: false,
    })
  pdf
    .moveTo(PAGE_MARGIN, PAGE_MARGIN + 48)
    .lineTo(612 - PAGE_MARGIN, PAGE_MARGIN + 48)
    .lineWidth(1.5)
    .strokeColor("#004D70")
    .stroke()
  pdf.y = PAGE_MARGIN + 60
}

function addPage(pdf: PDFKit.PDFDocument) {
  pdf.addPage({
    size: "LETTER",
    margins: {
      top: PAGE_MARGIN,
      right: PAGE_MARGIN,
      bottom: PAGE_MARGIN,
      left: PAGE_MARGIN,
    },
  })
}

export function ensureSpace(pdf: PDFKit.PDFDocument, height: number) {
  if (pdf.y + height > CONTENT_BOTTOM) {
    addPage(pdf)
    return true
  }

  return false
}

export function drawSectionTitle(pdf: PDFKit.PDFDocument, title: string) {
  ensureSpace(pdf, 30)
  pdf.moveDown(0.65)
  pdf
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#004D70")
    .text(title.toLocaleUpperCase("es-CL"), PAGE_MARGIN, pdf.y, {
      width: CONTENT_WIDTH,
    })
  pdf.moveDown(0.45)
}

export function drawKeyValue(
  pdf: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  pdf.font("Helvetica-Bold").fontSize(8.5).fillColor("#64748b")
  pdf.text(`${label}:`, x, y, { width: 78 })
  pdf.font("Helvetica").fontSize(8.5).fillColor("#0f172a")
  pdf.text(value || "-", x + 80, y, { width: width - 80 })
}

export function drawPageNumbers(pdf: PDFKit.PDFDocument) {
  const pages = pdf.bufferedPageRange()

  for (let index = pages.start; index < pages.start + pages.count; index += 1) {
    pdf.switchToPage(index)
    pdf
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(`Página ${index + 1} de ${pages.count}`, PAGE_MARGIN, FOOTER_Y, {
        width: CONTENT_WIDTH,
        align: "right",
        lineBreak: false,
      })
  }
}
