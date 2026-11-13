// Helper para exigir permisos en rutas API protegidas.
import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/require-auth"
import type { PermissionCode } from "@/lib/permissions"

export async function requirePermission(permission: PermissionCode) {
  const { session, response } = await requireAuth()

  if (response || !session) {
    return { session: null, response }
  }

  if (!session.user.permisos.includes(permission)) {
    return {
      session: null,
      response: new NextResponse("Sin permisos", { status: 403 }),
    }
  }

  return { session, response: null }
}

/**
 * Autoriza la solicitud cuando el usuario posee al menos uno de los permisos
 * indicados. Se utiliza en recursos compartidos por flujos de crear y editar.
 */
export async function requireAnyPermission(permissions: PermissionCode[]) {
  const { session, response } = await requireAuth()

  if (response || !session) {
    return { session: null, response }
  }

  if (
    !permissions.some((permission) =>
      session.user.permisos.includes(permission)
    )
  ) {
    return {
      session: null,
      response: new NextResponse("Sin permisos", { status: 403 }),
    }
  }

  return { session, response: null }
}
