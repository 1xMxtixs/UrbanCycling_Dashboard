// Endpoint para consultar y actualizar el perfil del usuario autenticado.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/require-auth"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[+\d\s-]{7,20}$/

type ProfileUser = {
  idUsuario: number
  primerNombre: string
  segundoNombre: string | null
  apellidoPaterno: string
  apellidoMaterno: string | null
  rut: string
  correo: string | null
  telefono: string | null
  estado: string
  rol: {
    idRol: number
    nombre: string
    descripcion: string | null
  } | null
}

function normalizeRequiredText(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

function buildProfileResponse(user: ProfileUser) {
  return {
    idUsuario: user.idUsuario,
    primerNombre: user.primerNombre,
    segundoNombre: user.segundoNombre,
    apellidoPaterno: user.apellidoPaterno,
    apellidoMaterno: user.apellidoMaterno,
    rut: user.rut,
    correo: user.correo,
    telefono: user.telefono,
    estado: user.estado,
    rol: user.rol ?? {
      idRol: 0,
      nombre: "Sin Rol",
      descripcion: null,
    },
  }
}

export async function GET() {
  try {
    const { session, response } = await requireAuth()

    if (response || !session) {
      return response
    }

    const user = await db.usuario.findUnique({
      where: {
        idUsuario: session.user.idUsuario,
      },
      select: {
        idUsuario: true,
        primerNombre: true,
        segundoNombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        rut: true,
        correo: true,
        telefono: true,
        estado: true,
        rol: {
          select: {
            idRol: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    })

    if (!user) {
      return new NextResponse("Usuario no encontrado", { status: 404 })
    }

    return NextResponse.json(buildProfileResponse(user))
  } catch (error) {
    console.log("[PERFIL_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

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

    const primerNombre = normalizeRequiredText(data.primerNombre)
    const segundoNombre = normalizeOptionalText(data.segundoNombre)
    const apellidoPaterno = normalizeRequiredText(data.apellidoPaterno)
    const apellidoMaterno = normalizeOptionalText(data.apellidoMaterno)
    const correo = normalizeRequiredText(data.correo).toLowerCase()
    const telefono = normalizeOptionalText(data.telefono)

    if (!primerNombre || !apellidoPaterno || !correo) {
      return new NextResponse("Debe completar los campos obligatorios", {
        status: 400,
      })
    }

    if (primerNombre.length > 50) {
      return new NextResponse(
        "El primer nombre no puede superar 50 caracteres",
        { status: 400 },
      )
    }

    if (segundoNombre && segundoNombre.length > 50) {
      return new NextResponse(
        "El segundo nombre no puede superar 50 caracteres",
        { status: 400 },
      )
    }

    if (apellidoPaterno.length > 50) {
      return new NextResponse(
        "El apellido paterno no puede superar 50 caracteres",
        { status: 400 },
      )
    }

    if (apellidoMaterno && apellidoMaterno.length > 50) {
      return new NextResponse(
        "El apellido materno no puede superar 50 caracteres",
        { status: 400 },
      )
    }

    if (correo.length > 255 || !EMAIL_REGEX.test(correo)) {
      return new NextResponse("El correo ingresado no tiene un formato valido", {
        status: 400,
      })
    }

    if (telefono && !PHONE_REGEX.test(telefono)) {
      return new NextResponse(
        "El telefono ingresado no tiene un formato valido",
        { status: 400 },
      )
    }

    const user = await db.usuario.findUnique({
      where: {
        idUsuario: session.user.idUsuario,
      },
      select: {
        idUsuario: true,
      },
    })

    if (!user) {
      return new NextResponse("Usuario no encontrado", { status: 404 })
    }

    const existingEmailUser = await db.usuario.findFirst({
      where: {
        correo,
        NOT: {
          idUsuario: session.user.idUsuario,
        },
      },
      select: {
        idUsuario: true,
      },
    })

    if (existingEmailUser) {
      return new NextResponse("El correo ingresado ya esta registrado", {
        status: 409,
      })
    }

    const updatedUser = await db.usuario.update({
      where: {
        idUsuario: session.user.idUsuario,
      },
      data: {
        primerNombre,
        segundoNombre,
        apellidoPaterno,
        apellidoMaterno,
        correo,
        telefono,
      },
      select: {
        idUsuario: true,
        primerNombre: true,
        segundoNombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        rut: true,
        correo: true,
        telefono: true,
        estado: true,
        rol: {
          select: {
            idRol: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    })

    return NextResponse.json(buildProfileResponse(updatedUser))
  } catch (error) {
    console.log("[PERFIL_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
