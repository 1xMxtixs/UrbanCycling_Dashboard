// Endpoint para consultar el catálogo de estados de órdenes de trabajo.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

export async function GET() {
  try {
    // El catálogo solo está disponible para usuarios que pueden consultar órdenes.
    const { response } = await requirePermission(PERMISSIONS.WORK_ORDERS_READ)

    if (response) {
      return response
    }

    // Se devuelve el catálogo en el orden definido por negocio. El código se usa
    // como valor estable y el nombre como etiqueta visible en los selectores.
    const estados = await db.estadoOrdenTrabajo.findMany({
      orderBy: {
        orden: "asc",
      },
      select: {
        codigo: true,
        nombre: true,
        orden: true,
        esFinal: true,
      },
    })

    // La respuesta es un arreglo para que el frontend pueda consumirlo directamente.
    return NextResponse.json(estados)
  } catch (error) {
    // Se registra el error en el servidor sin exponer detalles internos al cliente.
    console.log("[WORK_ORDER_STATUSES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
