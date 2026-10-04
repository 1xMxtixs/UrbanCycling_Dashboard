import { NextResponse } from "next/server"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import {
  WorkOrderNotFoundError,
} from "@/lib/work-order-document-data"
import { generateWorkOrderPdf } from "@/lib/work-order-pdf"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Genera y devuelve como descarga el PDF de una OT que el usuario puede consultar. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  const { session, response } = await requirePermission(
    PERMISSIONS.WORK_ORDERS_READ
  )

  if (response || !session) {
    return response
  }

  // El segmento heredado se llama idVenta, pero las rutas de OT reciben el ID de la OT.
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

  try {
    const pdf = await generateWorkOrderPdf(idOrdenDeTrabajo)

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="orden-trabajo-${idOrdenDeTrabajo}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    })
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

    console.error("[WORK_ORDER_PDF_GET]", error)

    return NextResponse.json(
      {
        code: "ERROR_GENERAR_PDF",
        message: "No fue posible generar el PDF",
      },
      { status: 500 }
    )
  }
}
