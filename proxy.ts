export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/",
    "/clientes/:path*",
    "/inventory/:path*",
    "/ordenes-trabajo/:path*",
    "/bicicletas/:path*",
  ],
}
