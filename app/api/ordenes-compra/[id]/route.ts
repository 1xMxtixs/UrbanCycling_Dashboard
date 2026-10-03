// Controlador para consultar el detalle de una orden de compra.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * Convierte el identificador de ruta en un entero positivo seguro.
 * Devuelve null cuando el parámetro no es un ID válido.
 */
function parsePurchaseOrderId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/**
 * GET /api/ordenes-compra/:id
 * Obtiene proveedor, líneas, estados y pagos asociados para mostrar el detalle.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.PURCHASE_ORDERS_READ)

    if (response) {
      return response
    }

    const { id } = await context.params
    const idOrdenDeCompra = parsePurchaseOrderId(id)

    if (!idOrdenDeCompra) {
      return NextResponse.json(
        {
          code: "ID_ORDEN_COMPRA_INVALIDO",
          message: "El identificador de la orden de compra no es válido.",
        },
        { status: 400 },
      )
    }

    const purchaseOrder = await db.ordenDeCompra.findUnique({
      where: { idOrdenDeCompra },
      include: {
        proveedor: {
          select: {
            idProveedor: true,
            razonSocial: true,
            nombreFantasia: true,
            rut: true,
          },
        },
        lineas: {
          include: {
            producto: {
              select: { idProducto: true, nombre: true },
            },
          },
          orderBy: { idLineaDeOrdenDeCompra: "asc" },
        },
        asignacionesPago: {
          orderBy: { idAsignacionPago: "asc" },
          include: {
            pago: {
              select: {
                idPago: true,
                fechaRegistro: true,
                estado: true,
                metodoPago: true,
                monto: true,
              },
            },
          },
        },
      },
    })

    if (!purchaseOrder) {
      return NextResponse.json(
        {
          code: "ORDEN_COMPRA_NO_ENCONTRADA",
          message: "No existe una orden de compra con el ID indicado.",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      code: "ORDEN_COMPRA_CARGADA",
      purchaseOrder,
    })
  } catch (error) {
    console.error("[PURCHASE_ORDER_DETAIL_GET]", error)
    return NextResponse.json(
      {
        code: "ERROR_CARGA_ORDEN_COMPRA",
        message: "No fue posible cargar el detalle de la orden de compra.",
      },
      { status: 500 },
    )
  }
}
