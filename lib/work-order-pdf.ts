import PDFDocument from "pdfkit"
import {
  getWorkOrderDocumentData,
  type WorkOrderDocumentData,
} from "@/lib/work-order-document-data"

const PAGE_MARGIN = 36
const PAGE_HEIGHT = 792
const CONTENT_WIDTH = 612 - PAGE_MARGIN * 2
// Reserva espacio dentro del área imprimible para que el contenido no invada el pie.
const CONTENT_BOTTOM = PAGE_HEIGHT - PAGE_MARGIN - 24
const FOOTER_Y = PAGE_HEIGHT - PAGE_MARGIN - 12

const moneyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
})

function money(value: number) {
  return moneyFormatter.format(value)
}

function date(value: Date | null, timeZone?: "UTC") {
  return value
    ? new Intl.DateTimeFormat("es-CL", {
        dateStyle: "short",
        ...(timeZone ? { timeZone } : {}),
      }).format(value)
    : "-"
}

/** Convierte códigos internos como PAGO_TOTAL en etiquetas legibles para el PDF. */
function readableLabel(value: string) {
  const normalized = value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-CL")

  return normalized
    ? normalized.charAt(0).toLocaleUpperCase("es-CL") + normalized.slice(1)
    : "-"
}

function nombreCliente(order: WorkOrderDocumentData) {
  const cliente = order.cliente

  if (!cliente) return "Cliente Particular"
  if (cliente.razonSocial) return cliente.razonSocial

  const nombre = [
    cliente.primerNombre,
    cliente.segundoNombre,
    cliente.apellidoPaterno,
    cliente.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ")

  return nombre || "Cliente Particular"
}

/** Genera el PDF en memoria para que la ruta lo descargue o futuros servicios lo reutilicen. */
export async function generateWorkOrderPdf(
  idOrdenDeTrabajo: number
): Promise<Buffer> {
  const order = await getWorkOrderDocumentData(idOrdenDeTrabajo)

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
        Title: `Orden de trabajo #${order.idOrdenDeTrabajo}`,
        Author: "Urban Cycling",
      },
    })

    const chunks: Buffer[] = []
    pdf.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
    pdf.once("error", reject)
    pdf.once("end", () => resolve(Buffer.concat(chunks)))

    try {
      // También cubre páginas creadas automáticamente por PDFKit.
      pdf.on("pageAdded", () => drawPageHeader(pdf, order))
      drawPageHeader(pdf, order)
      drawOrderDetails(pdf, order)
      drawBicycles(pdf, order)
      drawLines(pdf, order)
      drawTotals(pdf, order)
      drawPayments(pdf, order)
      drawPageNumbers(pdf)
      pdf.end()
    } catch (error) {
      reject(error)
    }
  })
}

function drawPageHeader(pdf: PDFKit.PDFDocument, order: WorkOrderDocumentData) {
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
    .text("Taller de servicio y gestión", PAGE_MARGIN, pdf.y + 2)

  pdf
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#004D70")
    .text(
      `ORDEN DE TRABAJO #${order.idOrdenDeTrabajo}`,
      PAGE_MARGIN,
      PAGE_MARGIN,
      { width: CONTENT_WIDTH, align: "right" }
    )

  pdf
    .font("Helvetica")
    .fontSize(9)
    .fillColor("#475569")
    .text(`Emitida: ${date(new Date())}`, PAGE_MARGIN, PAGE_MARGIN + 21, {
      width: CONTENT_WIDTH,
      align: "right",
    })

  pdf
    .moveTo(PAGE_MARGIN, PAGE_MARGIN + 44)
    .lineTo(612 - PAGE_MARGIN, PAGE_MARGIN + 44)
    .lineWidth(1.5)
    .strokeColor("#004D70")
    .stroke()

  pdf.y = PAGE_MARGIN + 56
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

function ensureSpace(
  pdf: PDFKit.PDFDocument,
  height: number
) {
  if (pdf.y + height > CONTENT_BOTTOM) {
    addPage(pdf)
    return true
  }

  return false
}

function drawSectionTitle(
  pdf: PDFKit.PDFDocument,
  title: string
) {
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

function drawKeyValue(
  pdf: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) {
  pdf.font("Helvetica-Bold").fontSize(9).fillColor("#64748b")
  pdf.text(`${label}:`, x, y, { width: 76 })
  pdf.font("Helvetica").fontSize(9).fillColor("#0f172a")
  pdf.text(value || "—", x + 78, y, { width: width - 78 })
}

function drawOrderDetails(pdf: PDFKit.PDFDocument, order: WorkOrderDocumentData) {
  drawSectionTitle(pdf, "Cliente y orden")

  const startY = pdf.y
  const half = CONTENT_WIDTH / 2 - 8
  const client = order.cliente

  drawKeyValue(pdf, "Cliente", nombreCliente(order), PAGE_MARGIN, startY, half)
  drawKeyValue(
    pdf,
    "RUT",
    client?.rut ?? "-",
    PAGE_MARGIN,
    startY + 15,
    half
  )
  drawKeyValue(
    pdf,
    "Recepción",
    date(order.fechaRecepcion),
    PAGE_MARGIN,
    startY + 30,
    half
  )

  const rightX = PAGE_MARGIN + CONTENT_WIDTH / 2
  drawKeyValue(
    pdf,
    "Estado",
    order.estado.nombre,
    rightX,
    startY,
    half
  )
  drawKeyValue(
    pdf,
    "Pago",
    String(order.estadoPago),
    rightX,
    startY + 15,
    half
  )
  drawKeyValue(
    pdf,
    "Entrega estimada",
    date(order.fechaEntregaEstimada, "UTC"),
    rightX,
    startY + 30,
    half
  )

  pdf.y = startY + 48

  if (order.fechaEntregaReal) {
    drawKeyValue(
      pdf,
      "Entrega real",
      date(order.fechaEntregaReal),
      PAGE_MARGIN,
      pdf.y,
      CONTENT_WIDTH
    )
    pdf.moveDown(1.2)
  }

  if (order.observacionesIngreso) {
    ensureSpace(pdf, 42)
    pdf.font("Helvetica-Bold").fontSize(9).fillColor("#92400e")
    pdf.text("Observaciones de ingreso", PAGE_MARGIN, pdf.y)
    pdf.font("Helvetica").fontSize(9).fillColor("#451a03")
    pdf.text(order.observacionesIngreso, PAGE_MARGIN, pdf.y + 13, {
      width: CONTENT_WIDTH,
    })
    pdf.moveDown(0.7)
  }
}

function drawBicycles(pdf: PDFKit.PDFDocument, order: WorkOrderDocumentData) {
  if (order.bicicletas.length === 0) return

  drawSectionTitle(pdf, "Bicicleta(s)")

  order.bicicletas.forEach((bike) => {
    ensureSpace(pdf, 20)
    const details = [bike.tipo, bike.marca, bike.modelo, bike.color]
      .filter(Boolean)
      .join(" · ")
    pdf.font("Helvetica-Bold").fontSize(9).fillColor("#0f172a")
    pdf.text(details || `Bicicleta #${bike.idBicicleta}`, PAGE_MARGIN, pdf.y, {
      width: CONTENT_WIDTH,
    })
    if (bike.descripcionAdicional) {
      pdf.font("Helvetica").fontSize(8).fillColor("#475569")
      pdf.text(bike.descripcionAdicional, PAGE_MARGIN, pdf.y + 2, {
        width: CONTENT_WIDTH,
      })
    }
    pdf.moveDown(0.6)
  })
}

const LINE_COLUMNS = [170, 55, 35, 90, 90, 100]

function drawLineTableHeader(pdf: PDFKit.PDFDocument) {
  const labels = ["Descripción", "Tipo", "Cant.", "P. unitario", "Desc. línea", "Total"]
  let x = PAGE_MARGIN
  const y = pdf.y

  pdf.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 22).fill("#eaf0f4")
  pdf.font("Helvetica-Bold").fontSize(7.5).fillColor("#334155")

  labels.forEach((label, index) => {
    const align = index < 2 ? "left" : "right"
    pdf.text(label, x + 4, y + 6, {
      width: LINE_COLUMNS[index] - 8,
      align,
    })
    x += LINE_COLUMNS[index]
  })

  pdf.y = y + 22
}

function drawLines(pdf: PDFKit.PDFDocument, order: WorkOrderDocumentData) {
  drawSectionTitle(pdf, "Servicios e insumos")
  drawLineTableHeader(pdf)

  if (order.lineas.length === 0) {
    pdf.font("Helvetica").fontSize(9).fillColor("#64748b")
    pdf.text("Sin líneas registradas", PAGE_MARGIN, pdf.y + 8)
    pdf.moveDown(1.5)
    return
  }

  for (const line of order.lineas) {
    pdf.font("Helvetica").fontSize(8)
    const descHeight = pdf.heightOfString(line.descripcion, {
      width: LINE_COLUMNS[0] - 8,
    })
    const rowHeight = Math.max(24, descHeight + 10)

    if (ensureSpace(pdf, rowHeight)) {
      drawLineTableHeader(pdf)
    }

    const cells = [
      line.descripcion,
      line.tipo,
      String(line.cantidad),
      money(line.precioUnitario),
      money(line.descuentoTotal),
      money(line.total),
    ]
    let x = PAGE_MARGIN
    const rowY = pdf.y

    pdf.font("Helvetica").fontSize(8).fillColor("#0f172a")
    cells.forEach((value, index) => {
      pdf.text(value, x + 4, rowY + 5, {
        width: LINE_COLUMNS[index] - 8,
        height: rowHeight - 8,
        align: index < 2 ? "left" : "right",
        lineBreak: index < 2,
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

function drawTotals(pdf: PDFKit.PDFDocument, order: WorkOrderDocumentData) {
  drawSectionTitle(pdf, "Resumen de montos")

  const rows: Array<[string, number]> = [
    ["Subtotal", order.montos.subtotal],
    ["Descuentos por líneas", order.montos.descuentoLineas],
    ["Descuento global", order.montos.descuentoGlobal],
    ["Neto", order.montos.neto],
    ["IVA", order.montos.iva],
    ["Total orden", order.montos.total],
    ["Total pagado", order.montos.totalPagado],
    [
      "Saldo pendiente",
      Math.max(0, order.montos.total - order.montos.totalPagado),
    ],
  ]

  const labelWidth = 190
  rows.forEach(([label, value], index) => {
    ensureSpace(pdf, 18)
    const strong = label === "Total orden" || label === "Saldo pendiente"
    const rowY = pdf.y
    pdf
      .font(strong ? "Helvetica-Bold" : "Helvetica")
      .fontSize(strong ? 10 : 9)
      .fillColor(strong ? "#004D70" : "#334155")
      .text(label, PAGE_MARGIN + CONTENT_WIDTH - 260, rowY, {
        width: labelWidth,
      })
      .text(money(value), PAGE_MARGIN + CONTENT_WIDTH - 70, rowY, {
        width: 70,
        align: "right",
      })
    pdf.moveDown(index === 2 || index === 5 ? 0.7 : 0.2)
  })
}

function drawPayments(pdf: PDFKit.PDFDocument, order: WorkOrderDocumentData) {
  if (order.pagos.length === 0) return

  drawSectionTitle(pdf, "Historial de pagos")

  order.pagos.forEach((pago) => {
    ensureSpace(pdf, 20)
    const label = [
      date(pago.fechaRegistro),
      readableLabel(pago.metodoPago),
      readableLabel(pago.tipoAbono),
      readableLabel(pago.estado),
    ].join(" · ")
    const rowY = pdf.y
    pdf.font("Helvetica").fontSize(8).fillColor("#334155")
    pdf.text(label, PAGE_MARGIN, rowY, {
      width: CONTENT_WIDTH - 100,
    })
    pdf.text(money(pago.monto), PAGE_MARGIN + CONTENT_WIDTH - 95, rowY, {
      width: 95,
      align: "right",
      lineBreak: false,
    })
    pdf.y = rowY + 16
  })
}

function drawPageNumbers(pdf: PDFKit.PDFDocument) {
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
