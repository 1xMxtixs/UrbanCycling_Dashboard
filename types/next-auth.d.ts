// Extension de tipos de NextAuth con datos de usuario, rol y permisos.
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    idUsuario: number
    idRol: number | null
    rol: string
    permisos: string[]
    sessionVersion: number
  }

  interface Session {
    user: {
      id: string
      idUsuario: number
      idRol: number | null
      rol: string
      permisos: string[]
      sessionVersion: number
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    idUsuario: number
    idRol: number | null
    rol: string
    permisos: string[]
    sessionVersion: number
  }
}
