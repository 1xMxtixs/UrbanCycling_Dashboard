import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { eliminarProductoOrden } from "@/lib/remove-work-order-product"
import {
  InventoryStockError,
  WorkOrderTotalsError,
} from "@/lib/stored-procedures"
import { WorkOrderProductError } from "@/lib/work-order-products"

type RouteContext = {
  params: Promise<{
    idVenta: string
    idLinea: string
  }>
}

/** Convierte un parametro de ruta en un identificador entero positivo. */
function parsePositiveId(value: string) {
  const parsed = Number(value)

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

/**
 * DELETE /api/ordenes-trabajo/:idVenta/productos/:idLinea
 * Elimina una linea directa de producto, restituye su stock y recalcula la ODT.
 */
export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.WORK_ORDERS_UPDATE,
    )

    if (response || !session) {
      return response
    }

    const { idVenta, idLinea } = await params
    const idOrdenDeTrabajo = parsePositiveId(idVenta)
    const idLineaDeOrdenDeTrabajo = parsePositiveId(idLinea)

    if (!idOrdenDeTrabajo || !idLineaDeOrdenDeTrabajo) {
      throw new WorkOrderProductError(
        "ID_INVALIDO",
        "La orden o linea indicada no es valida",
      )
    }

    // La transaccion evita eliminaciones parciales si falla stock, total o auditoria.
    const resultado = await db.$transaction((tx) =>
      eliminarProductoOrden(tx, {
        idOrdenDeTrabajo,
        idLineaDeOrdenDeTrabajo,
        idUsuario: session.user.idUsuario,
      }),
    )

    return NextResponse.json({
      code: "PRODUCTO_ORDEN_ELIMINADO",
      message: "Producto eliminado y stock restituido correctamente",
      ...resultado,
    })
  } catch (error) {
    if (error instanceof WorkOrderProductError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      )
    }

    if (error instanceof InventoryStockError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.code === "PRODUCTO_NO_EXISTE" ? 404 : 409 },
      )
    }

    if (error instanceof WorkOrderTotalsError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: 409 },
      )
    }

    console.error("[ELIMINAR_PRODUCTO_ORDEN]", error)

    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message: "No se pudo eliminar el producto de la orden",
      },
      { status: 500 },
    )
  }
}
