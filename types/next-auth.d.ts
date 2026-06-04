import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    idUsuario: number
    idRol: number
    rol: string
  }

  interface Session {
    user: {
      id: string
      idUsuario: number
      idRol: number
      rol: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    idUsuario: number
    idRol: number
    rol: string
  }
}
