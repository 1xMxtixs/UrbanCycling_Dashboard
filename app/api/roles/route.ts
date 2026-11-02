// Endpoint de roles disponibles para la gestión de usuarios.
import { NextResponse } from "next/server"

import { EstadoRegistro } from "@/generated/prisma"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

/**
 * GET /api/roles
 *
 * Devuelve los roles visibles para el usuario autenticado. Cuando recibe
 * assignable=true, limita la respuesta a roles activos que pueden asignarse a
 * una cuenta desde los formularios administrativos.
 */
export async function GET(request: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.ROLES_READ)

    if (response) {
      return response
    }

    const url = new URL(request.url)
    const onlyAssignable = url.searchParams.get("assignable") === "true"

    const roles = await db.rol.findMany({
      where: onlyAssignable
        ? {
            estado: EstadoRegistro.ACTIVO,
            NOT: {
              nombre: "Sin Rol",
            },
          }
        : undefined,
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
    console.error("[ROLES_GET]", error)

    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message: "No fue posible obtener los roles.",
      },
      { status: 500 }
    )
  }
}
