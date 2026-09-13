import crypto from "crypto"
import { z } from "zod"

import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"

const requestSchema = z
  .object({
    token: z.string().trim().min(1),
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = requestSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { message: "Los datos ingresados no son válidos." },
        { status: 400 }
      )
    }

    const { token, password } = result.data

    // Mantiene la regla vigente del registro mientras no se centralice la política.
    if (password.length < 8) {
      return Response.json(
        { message: "La contrasena debe tener al menos 8 caracteres." },
        { status: 400 }
      )
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")
    const contrasenaHash = await hashPassword(password)

    // La condición del token permite que solo una solicitud pueda consumirlo.
    const updateResult = await db.usuario.updateMany({
      where: {
        tokenRecuperacion: tokenHash,
        tokenRecuperacionExpira: {
          gt: new Date(),
        },
      },
      data: {
        contrasenaHash,
        sessionVersion: {
          increment: 1,
        },
        tokenRecuperacion: null,
        tokenRecuperacionExpira: null,
      },
    })

    if (updateResult.count === 0) {
      return Response.json(
        { message: "El enlace de recuperación ya no es válido." },
        { status: 400 }
      )
    }

    return Response.json({
      message: "La contraseña fue actualizada correctamente.",
    })
  } catch (error) {
    console.error("[AUTH_RESET_PASSWORD]", error)

    return Response.json(
      { message: "No se pudo procesar la solicitud." },
      { status: 500 }
    )
  }
}
