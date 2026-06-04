import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

import { authOptions } from "@/lib/auth"

export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.idUsuario) {
    return {
      session: null,
      response: new NextResponse("No autorizado", { status: 401 }),
    }
  }

  return {
    session,
    response: null,
  }
}
