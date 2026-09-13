import { NextResponse } from "next/server"

import { getValidSession } from "@/lib/get-valid-session"

export async function requireAuth() {
  const session = await getValidSession()

  if (!session) {
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
