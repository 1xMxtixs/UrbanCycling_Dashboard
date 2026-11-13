import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { agregarProductoOrden } from "@/lib/add-work-order-product"
import { InventoryStockError, WorkOrderTotalsError } from "@/lib/stored-procedures"
import { validarCantidadProducto, WorkOrderProductError } from "@/lib/work-order-products"

export async function POST(req: Request, { params }: { params: Promise<{ idVenta: string }> }) {
  try {
    const { session, response } = await requirePermission(PERMISSIONS.WORK_ORDERS_UPDATE)
    if (response || !session) return response
    const { idVenta } = await params
    const idOrdenDeTrabajo = Number(idVenta)
    if (!Number.isSafeInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
      throw new WorkOrderProductError("ID_INVALIDO", "El ID de la orden no es válido")
    }
    const data: unknown = await req.json().catch(() => null)
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new WorkOrderProductError("JSON_INVALIDO", "Debe enviar un objeto JSON válido")
    }
    const body = data as Record<string, unknown>
    const idProducto = body.idProducto
    const cantidad = body.cantidad
    if (typeof idProducto !== "number" || !Number.isSafeInteger(idProducto) || idProducto <= 0) {
      throw new WorkOrderProductError("PRODUCTO_INVALIDO", "Debe seleccionar un producto válido")
    }
    if (typeof cantidad !== "number") {
      throw new WorkOrderProductError("CANTIDAD_INVALIDA", "La cantidad debe ser un entero positivo")
    }
    validarCantidadProducto(cantidad)
    const resultado = await db.$transaction((tx) => agregarProductoOrden(tx, {
      idOrdenDeTrabajo, idProducto, cantidad, idUsuario: session.user.idUsuario,
    }))
    return NextResponse.json(resultado, { status: resultado.acumulado ? 200 : 201 })
  } catch (error) {
    if (error instanceof WorkOrderProductError) {
      return NextResponse.json({ code: error.code, message: error.message }, { status: error.status })
    }
    if (error instanceof InventoryStockError || error instanceof WorkOrderTotalsError) {
      return NextResponse.json({ code: error.code, message: error.message }, {
        status: error.code === "PRODUCTO_NO_EXISTE" ? 404 : 409,
      })
    }
    console.error("[AGREGAR_PRODUCTO_ORDEN]", error)
    return NextResponse.json({ code: "ERROR_INTERNO", message: "No se pudo agregar el producto" }, { status: 500 })
  }
}
