import crypto from "crypto"
import { z } from "zod"

import { db } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/mailer"

const requestSchema = z.object({
  email: z.string().trim().email(),
})

const GENERIC_MESSAGE =
  "Si el correo es válido, recibirá las instrucciones en breve."

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = requestSchema.safeParse(body)

    if (!result.success) {
      return Response.json(
        { message: "El correo electrónico no es válido." },
        { status: 400 }
      )
    }

    const email = result.data.email.toLowerCase()
    const user = await db.usuario.findFirst({
      where: {
        correo: email,
      },
    })

    if (!user || user.estado?.toLowerCase() !== "activo") {
      return Response.json({ message: GENERIC_MESSAGE })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
    const appUrl = process.env.NEXTAUTH_URL?.trim()

    if (!appUrl) {
      throw new Error("NEXTAUTH_URL no está configurada")
    }

    const resetUrl = `${appUrl}/reset-password?token=${encodeURIComponent(token)}`

    await db.usuario.update({
      where: {
        idUsuario: user.idUsuario,
      },
      data: {
        tokenRecuperacion: tokenHash,
        tokenRecuperacionExpira: expiresAt,
      },
    })

    try {
      await sendPasswordResetEmail({
        to: email,
        resetUrl,
        expiresInMinutes: 30,
      })
    } catch {
      await db.usuario.update({
        where: {
          idUsuario: user.idUsuario,
        },
        data: {
          tokenRecuperacion: null,
          tokenRecuperacionExpira: null,
        },
      })

      return Response.json(
        {
          message:
            "El servicio de recuperación no está disponible. Intente más tarde.",
        },
        { status: 503 }
      )
    }

    return Response.json({ message: GENERIC_MESSAGE })
  } catch (error) {
    console.error("[AUTH_FORGOT_PASSWORD]", error)

    return Response.json(
      { message: "No se pudo procesar la solicitud." },
      { status: 500 }
    )
  }
}
