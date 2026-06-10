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
