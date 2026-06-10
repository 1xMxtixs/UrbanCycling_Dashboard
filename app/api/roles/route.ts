// Endpoint de roles disponibles para la gestion de usuarios.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.ROLES_READ)

    if (response) {
      return response
    }

    const roles = await db.rol.findMany({
      orderBy: {
        nombre: "asc",
      },
      select: {
        idRol: true,
        nombre: true,
        descripcion: true,
      },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.log("[ROLES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
