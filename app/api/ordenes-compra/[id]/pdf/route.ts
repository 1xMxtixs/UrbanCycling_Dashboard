import { NextResponse } from "next/server"

import { PERMISSIONS } from "@/lib/permissions"
import { PurchaseOrderNotFoundError } from "@/lib/purchase-order-document-data"
import { generatePurchaseOrderPdf } from "@/lib/purchase-order-pdf"
import { requirePermission } from "@/lib/require-permission"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Genera el reporte interno descargable de una orden de compra en cualquier estado. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, response } = await requirePermission(
    PERMISSIONS.PURCHASE_ORDERS_READ,
  )

  if (response || !session) {
    return response
  }

  const { id } = await params

  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      {
        code: "ORDEN_COMPRA_INVALIDA",
        message: "El identificador de la orden de compra no es válido.",
      },
      { status: 400 },
    )
  }

  const idOrdenDeCompra = Number(id)

  if (!Number.isSafeInteger(idOrdenDeCompra) || idOrdenDeCompra <= 0) {
    return NextResponse.json(
      {
        code: "ORDEN_COMPRA_INVALIDA",
        message: "El identificador de la orden de compra no es válido.",
      },
      { status: 400 },
    )
  }

  try {
    const generatedAt = new Date()
    const generatedBy =
      session.user.name ??
      session.user.email ??
      `Usuario #${session.user.idUsuario}`
    const pdf = await generatePurchaseOrderPdf(idOrdenDeCompra, {
      generatedAt,
      generatedBy,
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="reporte-orden-compra-${idOrdenDeCompra}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    })
  } catch (error) {
    if (error instanceof PurchaseOrderNotFoundError) {
      return NextResponse.json(
        {
          code: "ORDEN_COMPRA_NO_ENCONTRADA",
          message: "La orden de compra solicitada no existe.",
        },
        { status: 404 },
      )
    }

    console.error("[PURCHASE_ORDER_PDF_GET]", error)

    return NextResponse.json(
      {
        code: "ERROR_GENERAR_PDF",
        message: "No fue posible generar el reporte de la orden de compra.",
      },
      { status: 500 },
    )
  }
}
