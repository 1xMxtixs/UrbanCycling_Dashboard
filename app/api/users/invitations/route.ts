import { NextResponse } from "next/server"

import { EstadoRegistro } from "@/generated/prisma"
import { db } from "@/lib/db"
import { sendUserInvitationEmail } from "@/lib/mailer"
import { PERMISSIONS } from "@/lib/permissions"
import { requireAdministrator } from "@/lib/require-administrator"
import { createInvitationToken } from "@/lib/user-invitation-token"
import { sendUserInvitationSchema } from "@/lib/user-registration"

/**
 * Construye una respuesta uniforme para errores ocurridos durante la emisión
 * administrativa de una invitación.
 */
function errorResponse(
  code: string,
  message: string,
  status: number,
  fields?: string[]
) {
  return NextResponse.json(
    {
      code,
      message,
      ...(fields?.length ? { fields } : {}),
    },
    { status }
  )
}

/**
 * POST /api/users/invitations
 *
 * Autoriza a un administrador a enviar una invitación a un correo que todavía
 * no pertenece a ningún usuario. El rol y el correo quedan fijados dentro del
 * token firmado; en esta etapa no se crea una fila en la tabla usuarios.
 */
export async function POST(request: Request) {
  try {
    const { actor, response } = await requireAdministrator(
      PERMISSIONS.USERS_CREATE
    )

    if (response || !actor) {
      return response
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return errorResponse(
        "DATOS_INVALIDOS",
        "El cuerpo de la solicitud debe contener JSON válido.",
        400
      )
    }

    const validation = sendUserInvitationSchema.safeParse(body)

    if (!validation.success) {
      const fields = [
        ...new Set(
          validation.error.issues.flatMap((issue) => {
            const field = issue.path[0]

            return typeof field === "string" ? [field] : []
          })
        ),
      ]

      return errorResponse(
        "DATOS_INVALIDOS",
        "Revise el correo y el rol seleccionados.",
        400,
        fields
      )
    }

    const { correo, idRol } = validation.data
    const [existingUser, role] = await Promise.all([
      db.usuario.findFirst({
        where: {
          correo,
        },
        select: {
          idUsuario: true,
        },
      }),
      db.rol.findUnique({
        where: {
          idRol,
        },
        select: {
          idRol: true,
          nombre: true,
          estado: true,
        },
      }),
    ])

    if (existingUser) {
      return errorResponse(
        "CORREO_EN_USO",
        "Ya existe un usuario registrado con ese correo.",
        409,
        ["correo"]
      )
    }

    if (!role) {
      return errorResponse(
        "ROL_NO_ENCONTRADO",
        "El rol seleccionado no existe.",
        404,
        ["idRol"]
      )
    }

    if (role.estado !== EstadoRegistro.ACTIVO || role.nombre === "Sin Rol") {
      return errorResponse(
        "ROL_NO_ASIGNABLE",
        "El rol seleccionado no se encuentra disponible.",
        400,
        ["idRol"]
      )
    }

    const appUrl = process.env.NEXTAUTH_URL?.trim()

    if (!appUrl) {
      throw new Error("NEXTAUTH_URL no está configurada.")
    }

    const invitation = createInvitationToken({
      email: correo,
      idRol: role.idRol,
      invitedBy: actor.idUsuario,
    })
    const invitationUrl = new URL("/accept-invitation", appUrl)

    invitationUrl.searchParams.set("token", invitation.token)

    await sendUserInvitationEmail({
      to: correo,
      invitationUrl: invitationUrl.toString(),
      expiresInHours: 48,
    })

    return NextResponse.json({
      message: "La invitación fue enviada correctamente.",
      expiresAt: invitation.expiresAt,
    })
  } catch (error) {
    console.error("[USER_INVITATION_POST]", error)

    return errorResponse(
      "INVITACION_NO_ENVIADA",
      "No fue posible enviar la invitación.",
      500
    )
  }
}
