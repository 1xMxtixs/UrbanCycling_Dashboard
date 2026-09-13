// Endpoint para consultar y actualizar el perfil del usuario autenticado.
import { NextResponse } from "next/server"

import { Prisma } from "@/generated/prisma"
import { db } from "@/lib/db"
import { verifyPassword } from "@/lib/password"
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

function validateText(
  value: unknown,
  maxLength: number,
  required = false,
): { valid: boolean; value: string | null } {
  if (value === null && !required) {
    return { valid: true, value: null }
  }

  if (typeof value !== "string") {
    return { valid: false, value: null }
  }

  const text = value.trim()

  if (text.length === 0) {
    return required
      ? { valid: false, value: null }
      : { valid: true, value: null }
  }

  return text.length <= maxLength
    ? { valid: true, value: text }
    : { valid: false, value: null }
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  fields?: string[],
) {
  return NextResponse.json(
    {
      code,
      message,
      ...(fields ? { fields } : {}),
    },
    { status },
  )
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

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return errorResponse(
        "DATOS_INVALIDOS",
        "El cuerpo de la solicitud debe contener JSON válido.",
        400,
      )
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return errorResponse(
        "DATOS_INVALIDOS",
        "El cuerpo de la solicitud debe ser un objeto JSON válido.",
        400,
      )
    }

    const data = body as Record<string, unknown>
    const updateData: Prisma.UsuarioUpdateInput = {}
    const invalidFields: string[] = []
    let correoActualizado: string | null = null
    let correoPropuesto: string | undefined
    let telefonoPropuesto: string | null | undefined
    const hasField = (field: string) =>
      Object.prototype.hasOwnProperty.call(data, field)

    if (hasField("primerNombre")) {
      const result = validateText(data.primerNombre, 50, true)
      if (result.valid && result.value) updateData.primerNombre = result.value
      else invalidFields.push("primerNombre")
    }

    if (hasField("segundoNombre")) {
      const result = validateText(data.segundoNombre, 50)
      if (result.valid) updateData.segundoNombre = result.value
      else invalidFields.push("segundoNombre")
    }

    if (hasField("apellidoPaterno")) {
      const result = validateText(data.apellidoPaterno, 50, true)
      if (result.valid && result.value) updateData.apellidoPaterno = result.value
      else invalidFields.push("apellidoPaterno")
    }

    if (hasField("apellidoMaterno")) {
      const result = validateText(data.apellidoMaterno, 50)
      if (result.valid) updateData.apellidoMaterno = result.value
      else invalidFields.push("apellidoMaterno")
    }

    if (hasField("correo")) {
      const result = validateText(data.correo, 255, true)
      const correo = result.value?.toLowerCase()

      if (result.valid && correo && EMAIL_REGEX.test(correo)) {
        updateData.correo = correo
        correoActualizado = correo
        correoPropuesto = correo
      } else {
        invalidFields.push("correo")
      }
    }

    if (hasField("telefono")) {
      const result = validateText(data.telefono, 20)

      if (result.valid && (!result.value || PHONE_REGEX.test(result.value))) {
        updateData.telefono = result.value
        telefonoPropuesto = result.value
      } else {
        invalidFields.push("telefono")
      }
    }

    if (invalidFields.length > 0) {
      return errorResponse(
        "CAMPOS_INVALIDOS",
        "Corrija los campos inválidos antes de guardar el perfil.",
        400,
        invalidFields,
      )
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse(
        "SIN_CAMBIOS",
        "Debe indicar al menos un dato personal o de contacto para actualizar.",
        400,
      )
    }

    const user = await db.usuario.findUnique({
      where: {
        idUsuario: session.user.idUsuario,
      },
      select: {
        idUsuario: true,
        correo: true,
        telefono: true,
        contrasenaHash: true,
      },
    })

    if (!user) {
      return errorResponse("USUARIO_NO_ENCONTRADO", "Usuario no encontrado.", 404)
    }

    const hasSensitiveChange =
      (correoPropuesto !== undefined && correoPropuesto !== user.correo) ||
      (telefonoPropuesto !== undefined && telefonoPropuesto !== user.telefono)

    if (hasSensitiveChange) {
      const contrasenaActual =
        typeof data.contrasenaActual === "string" ? data.contrasenaActual : ""

      if (!contrasenaActual) {
        return errorResponse(
          "CLAVE_REQUERIDA",
          "Debe ingresar su clave actual para modificar los datos de contacto.",
          400,
          ["contrasenaActual"],
        )
      }

      const currentPasswordIsValid = await verifyPassword(
        contrasenaActual,
        user.contrasenaHash,
      )

      if (!currentPasswordIsValid) {
        return errorResponse(
          "CLAVE_INCORRECTA",
          "La clave actual ingresada es incorrecta.",
          400,
          ["contrasenaActual"],
        )
      }
    }

    if (correoActualizado) {
      const existingEmailUser = await db.usuario.findFirst({
        where: {
          correo: correoActualizado,
          NOT: {
            idUsuario: session.user.idUsuario,
          },
        },
        select: {
          idUsuario: true,
        },
      })

      if (existingEmailUser) {
        return errorResponse(
          "CORREO_EN_USO",
          "El correo ingresado ya está registrado.",
          409,
          ["correo"],
        )
      }
    }

    const updatedUser = await db.usuario.update({
      where: {
        idUsuario: session.user.idUsuario,
      },
      data: updateData,
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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse(
        "CORREO_EN_USO",
        "El correo ingresado ya está registrado.",
        409,
        ["correo"],
      )
    }

    console.log("[PERFIL_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
