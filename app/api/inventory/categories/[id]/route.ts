import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import {
  editarCategoria,
  eliminarCategoria,
  parseCategoryId,
} from "@/lib/inventory-categories"
import { inventoryCategoryErrorResponse } from "@/app/api/_lib/inventory-category-response"

type Context = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, context: Context) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_UPDATE)
    if (response) return response
    const id = parseCategoryId((await context.params).id)
    const body: unknown = await req.json().catch(() => null)
    const category = await db.$transaction((tx) =>
      editarCategoria(tx, id, body)
    )
    return NextResponse.json({
      category,
      message: "Categoría actualizada correctamente.",
    })
  } catch (error) {
    const response = inventoryCategoryErrorResponse(error)
    if (response) return response
    console.error("[INVENTORY_CATEGORY_UPDATE]", error)
    return NextResponse.json(
      { message: "No fue posible actualizar la categoría." },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: Request, context: Context) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_DELETE)
    if (response) return response
    const id = parseCategoryId((await context.params).id)
    await db.$transaction((tx) => eliminarCategoria(tx, id))
    return NextResponse.json({ message: "Categoría eliminada correctamente." })
  } catch (error) {
    const response = inventoryCategoryErrorResponse(error)
    if (response) return response
    console.error("[INVENTORY_CATEGORY_DELETE]", error)
    return NextResponse.json(
      { message: "No fue posible eliminar la categoría." },
      { status: 500 }
    )
  }
}
