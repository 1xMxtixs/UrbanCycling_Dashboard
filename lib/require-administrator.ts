import { NextResponse } from "next/server"

import { EstadoRegistro } from "@/generated/prisma"
import { db } from "@/lib/db"
import type { PermissionCode } from "@/lib/permissions"
import { requireAuth } from "@/lib/require-auth"

/**
 * Construye una respuesta JSON uniforme para los rechazos de autorización.
 * Mantiene fuera de la respuesta cualquier detalle interno de la sesión o del
 * usuario consultado en la base de datos.
 */
function authorizationError(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status })
}

/**
 * Exige que la solicitud pertenezca a un administrador activo y que su rol
 * actual conserve el permiso solicitado.
 *
 * La comprobación se realiza contra la base de datos y no solo contra el JWT,
 * de modo que un cambio reciente de rol, estado o permisos tenga efecto antes
 * de que expire la sesión existente.
 */
export async function requireAdministrator(requiredPermission: PermissionCode) {
  const { session } = await requireAuth()

  if (!session) {
    return {
      session: null,
      actor: null,
      response: authorizationError(
        "NO_AUTORIZADO",
        "Debe iniciar sesión para realizar esta operación.",
        401
      ),
    }
  }

  const actor = await db.usuario.findUnique({
    where: {
      idUsuario: session.user.idUsuario,
    },
    select: {
      idUsuario: true,
      estado: true,
      rol: {
        select: {
          nombre: true,
          estado: true,
          permisosRol: {
            select: {
              permiso: {
                select: {
                  codigo: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const isActive =
    actor?.estado === EstadoRegistro.ACTIVO &&
    actor.rol?.estado === EstadoRegistro.ACTIVO
  const isAdministrator = actor?.rol?.nombre === "Administrador"
  const hasPermission =
    actor?.rol?.permisosRol.some(
      ({ permiso }) => permiso.codigo === requiredPermission
    ) ?? false

  if (!actor || !isActive) {
    return {
      session: null,
      actor: null,
      response: authorizationError(
        "NO_AUTORIZADO",
        "La cuenta no se encuentra habilitada.",
        401
      ),
    }
  }

  if (!isAdministrator || !hasPermission) {
    return {
      session: null,
      actor: null,
      response: authorizationError(
        "SOLO_ADMINISTRADOR",
        "Solo un administrador puede registrar usuarios.",
        403
      ),
    }
  }

  return {
    session,
    actor,
    response: null,
  }
}
