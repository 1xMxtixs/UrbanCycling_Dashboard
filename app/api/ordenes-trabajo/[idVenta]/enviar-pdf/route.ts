import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { sendWorkOrderPdfEmail } from "@/lib/mailer"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import {
  WorkOrderNotFoundError,
} from "@/lib/work-order-document-data"
import { generateWorkOrderPdf } from "@/lib/work-order-pdf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/ordenes-trabajo/[idVenta]/enviar-pdf
 *
 * Envía el PDF de una orden al correo registrado de su cliente. Aunque el
 * segmento histórico se llama idVenta, recibe el ID de la orden de trabajo,
 * igual que GET /api/ordenes-trabajo/[idVenta]/pdf de T3-B08.
 *
 * Contrato para frontend:
 * - 200 PDF_ENVIADO: el correo se entregó a Resend.
 * - 400 ORDEN_TRABAJO_INVALIDA, 404 ORDEN_TRABAJO_NO_ENCONTRADA,
 *   422 CLIENTE_SIN_CORREO y 503 SERVICIO_CORREO_NO_DISPONIBLE.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  // El permiso de lectura de OT permite a Administrador y Asesor Técnico
  // compartir una orden que ya pueden consultar en el módulo.
  const { session, response } = await requirePermission(
    PERMISSIONS.WORK_ORDERS_READ
  )

  if (response || !session) {
    return response
  }

  const { idVenta: idSegmento } = await params
  const idOrdenDeTrabajo = Number(idSegmento)

  if (!Number.isSafeInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
    return NextResponse.json(
      {
        code: "ORDEN_TRABAJO_INVALIDA",
        message: "El identificador de la orden no es válido",
      },
      { status: 400 }
    )
  }

  // Esta consulta mínima solo obtiene el destinatario. La composición del PDF
  // continúa centralizada en T3-B08 para no duplicar sus datos ni su diseño.
  const orden = await db.ordenDeTrabajo.findUnique({
    where: { idOrdenDeTrabajo },
    select: {
      venta: {
        select: {
          cliente: {
            select: {
              correo: true,
            },
          },
        },
      },
    },
  })

  if (!orden) {
    return NextResponse.json(
      {
        code: "ORDEN_TRABAJO_NO_ENCONTRADA",
        message: "La orden de trabajo solicitada no existe",
      },
      { status: 404 }
    )
  }

  const correoCliente = orden.venta.cliente?.correo?.trim()

  if (!correoCliente) {
    return NextResponse.json(
      {
        code: "CLIENTE_SIN_CORREO",
        message: "La orden no tiene un correo de cliente para enviar el documento",
      },
      { status: 422 }
    )
  }

  let pdf: Buffer

  try {
    // El PDF se genera en memoria y se adjunta directamente: no se expone ni
    // persiste una URL pública con información de la orden de trabajo.
    pdf = await generateWorkOrderPdf(idOrdenDeTrabajo)
  } catch (error) {
    if (error instanceof WorkOrderNotFoundError) {
      return NextResponse.json(
        {
          code: "ORDEN_TRABAJO_NO_ENCONTRADA",
          message: "La orden de trabajo solicitada no existe",
        },
        { status: 404 }
      )
    }

    console.error("[WORK_ORDER_EMAIL_PDF_GENERATION]", error)

    return NextResponse.json(
      {
        code: "ERROR_GENERAR_PDF",
        message: "No fue posible generar el PDF de la orden de trabajo",
      },
      { status: 500 }
    )
  }

  try {
    await sendWorkOrderPdfEmail({
      to: correoCliente,
      workOrderId: idOrdenDeTrabajo,
      pdf,
    })
  } catch (error) {
    console.error("[WORK_ORDER_EMAIL_SEND]", error)

    return NextResponse.json(
      {
        code: "SERVICIO_CORREO_NO_DISPONIBLE",
        message: "No fue posible enviar el correo con la orden de trabajo",
      },
      { status: 503 }
    )
  }

  return NextResponse.json({
    code: "PDF_ENVIADO",
    message: "El PDF de la orden de trabajo fue enviado al correo del cliente",
  })
}
