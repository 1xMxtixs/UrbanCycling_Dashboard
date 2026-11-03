import PDFDocument from "pdfkit"

import {
  getPurchaseOrderDocumentData,
  type PurchaseOrderDocumentData,
} from "@/lib/purchase-order-document-data"
import {
  CONTENT_WIDTH,
  date,
  dateTime,
  drawKeyValue,
  drawPageHeader,
  drawPageNumbers,
  drawSectionTitle,
  ensureSpace,
  money,
  PAGE_MARGIN,
  providerAddress,
  type PurchaseOrderReportContext,
  readableLabel,
} from "@/lib/purchase-order-pdf-layout"

/** Genera el reporte interno de la orden de compra completamente en memoria. */
export async function generatePurchaseOrderPdf(
  idOrdenDeCompra: number,
  context: PurchaseOrderReportContext,
): Promise<Buffer> {
  const order = await getPurchaseOrderDocumentData(
    idOrdenDeCompra,
    context.generatedAt,
  )

  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({
      size: "LETTER",
      margins: {
        top: PAGE_MARGIN,
        right: PAGE_MARGIN,
        bottom: PAGE_MARGIN,
        left: PAGE_MARGIN,
      },
      bufferPages: true,
      info: {
        Title: `Reporte interno OC #${order.idOrdenDeCompra}`,
        Author: "Urban Cycling",
      },
    })
    const chunks: Buffer[] = []

    pdf.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
    pdf.once("error", reject)
    pdf.once("end", () => resolve(Buffer.concat(chunks)))

    try {
      pdf.on("pageAdded", () => drawPageHeader(pdf, order))
      drawPageHeader(pdf, order)
      drawOrderSummary(pdf, order, context)
      drawProvider(pdf, order)
      drawLines(pdf, order)
      drawTotals(pdf, order)
      drawPayments(pdf, order)
      drawInternalIndicators(pdf, order)
      drawPageNumbers(pdf)
      pdf.end()
    } catch (error) {
      reject(error)
    }
  })
}

function drawOrderSummary(
  pdf: PDFKit.PDFDocument,
  order: PurchaseOrderDocumentData,
  context: PurchaseOrderReportContext,
) {
  drawSectionTitle(pdf, "Control interno")
  const startY = pdf.y
  const half = CONTENT_WIDTH / 2 - 8
  const rightX = PAGE_MARGIN + CONTENT_WIDTH / 2

  drawKeyValue(pdf, "Creada por", order.creador.nombre, PAGE_MARGIN, startY, half)
  drawKeyValue(
    pdf,
    "Emisión",
    date(order.fechaRegistro),
    PAGE_MARGIN,
    startY + 15,
    half,
  )
  drawKeyValue(
    pdf,
    "Entrega estimada",
    date(order.fechaEntregaEstimada),
    PAGE_MARGIN,
    startY + 30,
    half,
  )
  drawKeyValue(
    pdf,
    "Entrega real",
    date(order.fechaEntregaReal, "America/Santiago"),
    PAGE_MARGIN,
    startY + 45,
    half,
  )
  drawKeyValue(
    pdf,
    "Generado por",
    context.generatedBy,
    rightX,
    startY,
    half,
  )
  drawKeyValue(
    pdf,
    "Generado el",
    dateTime(context.generatedAt),
    rightX,
    startY + 15,
    half,
  )
  drawKeyValue(
    pdf,
    "Estado pago",
    readableLabel(order.estadoPago),
    rightX,
    startY + 30,
    half,
  )
  drawKeyValue(
    pdf,
    "Recepción",
    readableLabel(order.estadoRecepcion),
    rightX,
    startY + 45,
    half,
  )
  pdf.y = startY + 62
}

function drawProvider(pdf: PDFKit.PDFDocument, order: PurchaseOrderDocumentData) {
  drawSectionTitle(pdf, "Proveedor")
  const startY = pdf.y
  const half = CONTENT_WIDTH / 2 - 8
  const rightX = PAGE_MARGIN + CONTENT_WIDTH / 2
  const provider = order.proveedor

  drawKeyValue(pdf, "Razón social", provider.razonSocial, PAGE_MARGIN, startY, half)
  drawKeyValue(pdf, "RUT", provider.rut, PAGE_MARGIN, startY + 15, half)
  drawKeyValue(
    pdf,
    "Contacto",
    provider.nombreContacto ?? "Sin contacto registrado",
    PAGE_MARGIN,
    startY + 30,
    half,
  )
  drawKeyValue(
    pdf,
    "Condiciones",
    provider.condicionesDePago,
    rightX,
    startY,
    half,
  )
  drawKeyValue(
    pdf,
    "Teléfono",
    provider.telefonos[0]?.telefono ?? "Sin teléfono registrado",
    rightX,
    startY + 15,
    half,
  )
  drawKeyValue(
    pdf,
    "Correo",
    provider.correos[0]?.correo ?? "Sin correo registrado",
    rightX,
    startY + 30,
    half,
  )
  pdf.y = startY + 47
  drawKeyValue(pdf, "Dirección", providerAddress(order), PAGE_MARGIN, pdf.y, CONTENT_WIDTH)
  pdf.y += 18
}

const LINE_COLUMNS = [145, 43, 43, 50, 62, 92, 105]

function drawLineTableHeader(pdf: PDFKit.PDFDocument) {
  const labels = ["Producto", "Ord.", "Rec.", "Pend.", "% Rec.", "Costo unit.", "Total"]
  let x = PAGE_MARGIN
  const y = pdf.y

  pdf.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 22).fill("#eaf0f4")
  pdf.font("Helvetica-Bold").fontSize(7.3).fillColor("#334155")
  labels.forEach((label, index) => {
    pdf.text(label, x + 4, y + 6, {
      width: LINE_COLUMNS[index] - 8,
      align: index === 0 ? "left" : "right",
    })
    x += LINE_COLUMNS[index]
  })
  pdf.y = y + 22
}

function drawLines(pdf: PDFKit.PDFDocument, order: PurchaseOrderDocumentData) {
  drawSectionTitle(pdf, "Detalle de productos")
  drawLineTableHeader(pdf)

  for (const line of order.lineas) {
    const description = [
      `#${line.idProducto} ${line.descripcion}`,
      line.codigoProveedor ? `Código proveedor: ${line.codigoProveedor}` : null,
    ]
      .filter(Boolean)
      .join("\n")
    pdf.font("Helvetica").fontSize(8)
    const rowHeight = Math.max(
      25,
      pdf.heightOfString(description, { width: LINE_COLUMNS[0] - 8 }) + 10,
    )

    if (ensureSpace(pdf, rowHeight)) drawLineTableHeader(pdf)

    const cells = [
      description,
      String(line.cantidadOrdenada),
      String(line.cantidadRecibida),
      String(line.cantidadPendiente),
      `${line.porcentajeRecepcion.toFixed(1)}%`,
      money(line.precioUnitario),
      money(line.total),
    ]
    let x = PAGE_MARGIN
    const rowY = pdf.y

    cells.forEach((value, index) => {
      pdf.font("Helvetica").fontSize(7.7).fillColor("#0f172a")
      pdf.text(value, x + 4, rowY + 5, {
        width: LINE_COLUMNS[index] - 8,
        height: rowHeight - 8,
        align: index === 0 ? "left" : "right",
        lineBreak: index === 0,
      })
      x += LINE_COLUMNS[index]
    })
    pdf
      .moveTo(PAGE_MARGIN, rowY + rowHeight)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, rowY + rowHeight)
      .lineWidth(0.5)
      .strokeColor("#cbd5e1")
      .stroke()
    pdf.y = rowY + rowHeight
  }
  pdf.moveDown(0.5)
}

function drawTotals(pdf: PDFKit.PDFDocument, order: PurchaseOrderDocumentData) {
  drawSectionTitle(pdf, "Resumen financiero")
  const rows: Array<[string, number]> = [
    ["Subtotal", order.montos.subtotal],
    ["Descuentos por productos", order.montos.descuentoProductos],
    ["Descuento global", order.montos.descuentoGlobal],
    ["Neto", order.montos.neto],
    ["IVA", order.montos.iva],
    ["Total orden", order.montos.total],
    ["Total pagado confirmado", order.montos.totalPagado],
    ["Saldo pendiente", order.montos.saldoPendiente],
  ]

  rows.forEach(([label, value], index) => {
    ensureSpace(pdf, 18)
    const strong = label === "Total orden" || label === "Saldo pendiente"
    const rowY = pdf.y
    pdf
      .font(strong ? "Helvetica-Bold" : "Helvetica")
      .fontSize(strong ? 10 : 9)
      .fillColor(strong ? "#004D70" : "#334155")
      .text(label, PAGE_MARGIN + CONTENT_WIDTH - 270, rowY, { width: 195 })
      .text(money(value), PAGE_MARGIN + CONTENT_WIDTH - 75, rowY, {
        width: 75,
        align: "right",
      })
    pdf.moveDown(index === 2 || index === 5 ? 0.7 : 0.2)
  })
}

const PAYMENT_COLUMNS = [45, 72, 110, 100, 95, 118]

function drawPaymentTableHeader(pdf: PDFKit.PDFDocument) {
  const labels = ["Pago", "Fecha", "Método", "Tipo", "Estado", "Monto"]
  let x = PAGE_MARGIN
  const y = pdf.y

  pdf.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 22).fill("#eaf0f4")
  pdf.font("Helvetica-Bold").fontSize(7.3).fillColor("#334155")
  labels.forEach((label, index) => {
    pdf.text(label, x + 4, y + 6, {
      width: PAYMENT_COLUMNS[index] - 8,
      align: index === 5 ? "right" : "left",
    })
    x += PAYMENT_COLUMNS[index]
  })
  pdf.y = y + 22
}

function drawPayments(pdf: PDFKit.PDFDocument, order: PurchaseOrderDocumentData) {
  drawSectionTitle(pdf, "Historial de pagos")

  if (order.pagos.length === 0) {
    pdf.font("Helvetica").fontSize(9).fillColor("#64748b")
    pdf.text("No existen pagos asociados a esta orden.", PAGE_MARGIN, pdf.y)
    pdf.moveDown(0.8)
    return
  }

  drawPaymentTableHeader(pdf)
  for (const payment of order.pagos) {
    const cells = [
      `#${payment.idPago}`,
      date(payment.fechaRegistro, "America/Santiago"),
      payment.metodoPago,
      readableLabel(payment.tipoAbono),
      readableLabel(payment.estado),
      money(payment.monto),
    ]
    const rowHeight = 25

    if (ensureSpace(pdf, rowHeight)) drawPaymentTableHeader(pdf)

    let x = PAGE_MARGIN
    const rowY = pdf.y
    cells.forEach((value, index) => {
      pdf.font("Helvetica").fontSize(7.5).fillColor("#0f172a")
      pdf.text(value, x + 4, rowY + 6, {
        width: PAYMENT_COLUMNS[index] - 8,
        height: rowHeight - 8,
        align: index === 5 ? "right" : "left",
        lineBreak: index !== 0 && index !== 5,
      })
      x += PAYMENT_COLUMNS[index]
    })
    pdf
      .moveTo(PAGE_MARGIN, rowY + rowHeight)
      .lineTo(PAGE_MARGIN + CONTENT_WIDTH, rowY + rowHeight)
      .lineWidth(0.5)
      .strokeColor("#cbd5e1")
      .stroke()
    pdf.y = rowY + rowHeight
  }
  pdf.moveDown(0.5)
}

function drawInternalIndicators(
  pdf: PDFKit.PDFDocument,
  order: PurchaseOrderDocumentData,
) {
  drawSectionTitle(pdf, "Indicadores internos")
  const indicators = [
    {
      label: "Productos pendientes",
      value: String(order.indicadores.productosPendientes),
      warning: order.indicadores.productosPendientes > 0,
    },
    {
      label: "Recepción física",
      value: order.indicadores.recepcionCompleta ? "Completa" : "Pendiente",
      warning: !order.indicadores.recepcionCompleta,
    },
    {
      label: "Saldo financiero",
      value: money(order.montos.saldoPendiente),
      warning: order.montos.saldoPendiente > 0,
    },
    {
      label: "Cumplimiento de plazo",
      value: order.indicadores.vencida ? "Orden vencida" : "Dentro de plazo",
      warning: order.indicadores.vencida,
    },
  ]
  const gap = 8
  const boxWidth = (CONTENT_WIDTH - gap) / 2

  for (let index = 0; index < indicators.length; index += 2) {
    ensureSpace(pdf, 52)
    const rowY = pdf.y

    for (let column = 0; column < 2; column += 1) {
      const indicator = indicators[index + column]
      if (!indicator) continue
      const x = PAGE_MARGIN + column * (boxWidth + gap)
      const background = indicator.warning ? "#fff7ed" : "#f0fdf4"
      const foreground = indicator.warning ? "#9a3412" : "#166534"

      pdf.roundedRect(x, rowY, boxWidth, 42, 4).fill(background)
      pdf
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#64748b")
        .text(indicator.label, x + 10, rowY + 8, { width: boxWidth - 20 })
      pdf
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(foreground)
        .text(indicator.value, x + 10, rowY + 22, { width: boxWidth - 20 })
    }
    pdf.y = rowY + 50
  }
}
