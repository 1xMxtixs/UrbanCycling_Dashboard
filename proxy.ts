import { withAuth } from "next-auth/middleware"
import { NextFetchEvent, NextRequest } from "next/server"

export default withAuth({
  pages: {
    signIn: "/sign-in",
  },
})

export const config = {
  matcher: [
    "/",
    "/clientes/:path*",
    "/inventory/:path*",
    "/bicicletas/:path*",
    "/usuarios/:path*",
    "/punto-ventas/:path*",
    "/historial-boletas/:path*",
  ],
}

