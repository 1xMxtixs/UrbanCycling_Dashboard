import { getServerSession } from "next-auth"
import type { Session } from "next-auth"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function getValidSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.idUsuario) {
    return null
  }

  const user = await db.usuario.findUnique({
    where: {
      idUsuario: session.user.idUsuario,
    },
    select: {
      sessionVersion: true,
    },
  })

  const sessionVersion = session.user.sessionVersion ?? 0

  if (!user || user.sessionVersion !== sessionVersion) {
    return null
  }

  return session
}
