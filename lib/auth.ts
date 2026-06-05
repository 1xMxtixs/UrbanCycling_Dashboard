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

        const user = await db.usuario.findUnique({
          where: {
            correoElectronico: email,
          },
          include: {
            rol: true,
          },
        })

        if (!user || user.estado.toLowerCase() !== "activo") {
          return null
        }

        const isPasswordValid = await verifyPassword(password, user.contrasena)

        if (!isPasswordValid) {
          return null
        }

        await db.usuario.update({
          where: {
            idUsuario: user.idUsuario,
          },
          data: {
            ultimoAcceso: new Date(),
          },
        })

        return {
          id: String(user.idUsuario),
          email: user.correoElectronico,
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
          rol: user.rol.nombre,
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
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.idUsuario)
        session.user.idUsuario = token.idUsuario
        session.user.idRol = token.idRol
        session.user.rol = token.rol
      }

      return session
    },
  },
}
