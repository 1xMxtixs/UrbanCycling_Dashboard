// Endpoint para cambiar la contrasena del usuario autenticado.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { hashPassword, verifyPassword } from "@/lib/password"
import { requireAuth } from "@/lib/require-auth"

const MIN_PASSWORD_LENGTH = 8
const CONTROL_CHARACTERS_REGEX = /[\u0000-\u001F\u007F]/

export async function PATCH(request: Request) {
  try {
    const { session, response } = await requireAuth()

    if (response || !session) {
      return response
    }

    let data: Record<string, unknown>

    try {
      data = await request.json()
    } catch {
      return new NextResponse("El cuerpo de la solicitud no es valido", {
        status: 400,
      })
    }

    const contrasenaActual =
      typeof data.contrasenaActual === "string" ? data.contrasenaActual : ""
    const contrasenaNueva =
      typeof data.contrasenaNueva === "string" ? data.contrasenaNueva : ""

    if (!contrasenaActual || !contrasenaNueva) {
      return new NextResponse(
        "Debe ingresar la contrasena actual y la nueva contrasena",
        { status: 400 },
      )
    }

    const user = await db.usuario.findUnique({
      where: {
        idUsuario: session.user.idUsuario,
      },
      select: {
        idUsuario: true,
        contrasenaHash: true,
      },
    })

    if (!user) {
      return new NextResponse("Usuario no encontrado", { status: 404 })
    }

    const currentPasswordIsValid = await verifyPassword(
      contrasenaActual,
      user.contrasenaHash,
    )

    if (!currentPasswordIsValid) {
      return new NextResponse("La contrasena actual es incorrecta", {
        status: 400,
      })
    }

    if (contrasenaNueva.length < MIN_PASSWORD_LENGTH) {
      return new NextResponse(
        "La nueva contrasena debe tener al menos 8 caracteres",
        { status: 400 },
      )
    }

    if (CONTROL_CHARACTERS_REGEX.test(contrasenaNueva)) {
      return new NextResponse(
        "La nueva contrasena contiene caracteres invalidos",
        { status: 400 },
      )
    }

    const newPasswordIsCurrentPassword = await verifyPassword(
      contrasenaNueva,
      user.contrasenaHash,
    )

    if (newPasswordIsCurrentPassword) {
      return new NextResponse(
        "La nueva contrasena debe ser diferente de la actual",
        { status: 400 },
      )
    }

    const newPasswordHash = await hashPassword(contrasenaNueva)

    await db.usuario.update({
      where: {
        idUsuario: user.idUsuario,
      },
      data: {
        contrasenaHash: newPasswordHash,
      },
    })

    return NextResponse.json({
      message: "Contrasena actualizada correctamente",
    })
  } catch (error) {
    console.log("[PERFIL_CONTRASENA_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
