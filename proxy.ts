import { withAuth } from "next-auth/middleware"
import { NextRequest } from "next/server"

const authMiddleware = withAuth({
  pages: {
    signIn: "/sign-in",
  },
})

export default function proxy(req: NextRequest, event: any) {
  return (authMiddleware as any)(req, event)
}

export const config = {
  matcher: [
    "/",
    "/clientes/:path*",
    "/inventory/:path*",
    "/ordenes-trabajo/:path*",
    "/bicicletas/:path*",
  ],
}

