// Configuracion central de NextAuth para credenciales, roles y permisos.
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo electronico", type: "email" },
        password: { label: "Contrasena", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase()
        const password = credentials?.password

        if (!email || !password) {
          return null
        }

        const user = await db.usuario.findFirst({
          where: {
            correo: email,
          },
          include: {
            rol: {
              include: {
                permisosRol: {
                  select: {
                    permiso: {
                      select: {
                        codigo: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })

        if (!user || user.estado?.toLowerCase() !== "activo") {
          return null
        }

        const isPasswordValid = await verifyPassword(password, user.contrasenaHash)

        if (!isPasswordValid) {
          return null
        }

        await db.usuario.update({
          where: {
            idUsuario: user.idUsuario,
          },
          data: {
            fechaUltimoAcceso: new Date(),
          },
        })

        const roleName = user.rol?.nombre ?? "Sin Rol"
        const permissions =
          user.rol?.permisosRol.map((rolPermiso) => rolPermiso.permiso.codigo) ??
          []

        return {
          id: String(user.idUsuario),
          email: user.correo ?? user.rut,
          name: [
            user.primerNombre,
            user.segundoNombre,
            user.apellidoPaterno,
            user.apellidoMaterno,
          ]
            .filter(Boolean)
            .join(" "),
          idUsuario: user.idUsuario,
          idRol: user.idRol,
          rol: roleName,
          permisos: permissions,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.idUsuario = user.idUsuario
        token.idRol = user.idRol
        token.rol = user.rol
        token.permisos = user.permisos ?? []
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.idUsuario)
        session.user.idUsuario = token.idUsuario
        session.user.idRol = token.idRol
        session.user.rol = token.rol
        session.user.permisos = token.permisos ?? []
      }

      return session
    },
  },
}
