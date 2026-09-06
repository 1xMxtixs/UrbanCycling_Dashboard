// Endpoint para cargar las categorías disponibles para filtrar el inventario.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_READ)

    if (response) {
      return response
    }

    const categories = await db.categoria.findMany({
      where: { estado: "activo" },
      select: {
        idCategoria: true,
        nombre: true,
        descripcion: true,
      },
      orderBy: { nombre: "asc" },
    })

    if (categories.length === 0) {
      return NextResponse.json(
        {
          code: "CATEGORIAS_NO_DISPONIBLES",
          message: "No hay categorías disponibles para realizar el filtrado.",
          categories: [],
        },
        { status: 404 },
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
      { status: 500 },
    )
  }
}
