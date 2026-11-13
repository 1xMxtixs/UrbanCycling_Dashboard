// Endpoint para cargar las categorías disponibles para filtrar el inventario.
import { NextResponse } from "next/server"

import { EstadoRegistro } from "@/generated/prisma"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { crearCategoria } from "@/lib/inventory-categories"
import { inventoryCategoryErrorResponse } from "@/app/api/_lib/inventory-category-response"

/**
 * GET /api/inventory/categories
 * Devuelve únicamente categorías activas, ordenadas por nombre, para filtros
 * y selectores de creación o edición de productos.
 */
export async function GET(req: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_READ)

    if (response) {
      return response
    }

    const includeInactive =
      new URL(req.url).searchParams.get("includeInactive") === "true"
    const rows = await db.categoria.findMany({
      where: includeInactive ? {} : { estado: EstadoRegistro.ACTIVO },
      select: {
        idCategoria: true,
        nombre: true,
        descripcion: true,
        estado: true,
        categoriasproducto: { select: { idProducto: true } },
      },
      orderBy: { nombre: "asc" },
    })
    const categories = rows.map(({ categoriasproducto, ...category }) => ({
      ...category,
      productosAsociados: new Set(
        categoriasproducto.map((item) => item.idProducto)
      ).size,
    }))

    if (categories.length === 0 && !includeInactive) {
      return NextResponse.json(
        {
          code: "CATEGORIAS_NO_DISPONIBLES",
          message: "No hay categorías disponibles para realizar el filtrado.",
          categories: [],
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      code: "CATEGORIAS_CARGADAS",
      categories,
      count: categories.length,
    })
  } catch (error) {
    console.log("[INVENTORY_CATEGORIES_GET]", error)
    return NextResponse.json(
      {
        code: "ERROR_CARGA_CATEGORIAS",
        message: "No fue posible cargar las categorías disponibles.",
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_CREATE)
    if (response) return response
    const body: unknown = await req.json().catch(() => null)
    const category = await db.$transaction((tx) => crearCategoria(tx, body))
    return NextResponse.json(
      { category, message: "Categoría creada correctamente." },
      { status: 201 }
    )
  } catch (error) {
    const response = inventoryCategoryErrorResponse(error)
    if (response) return response
    console.error("[INVENTORY_CATEGORY_CREATE]", error)
    return NextResponse.json(
      { message: "No fue posible crear la categoría." },
      { status: 500 }
    )
  }
}
