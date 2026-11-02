import { NextResponse } from "next/server"
import { z } from "zod"

import { getInvitationContext } from "@/lib/user-invitation-context"
import {
  InvitationTokenError,
  verifyInvitationToken,
} from "@/lib/user-invitation-token"

const requestSchema = z
  .object({
    token: z.string().trim().min(1).max(2048),
  })
  .strict()

/**
 * Devuelve una respuesta pública sin detallar qué comprobación interna dejó de
 * cumplirse, para no revelar estados del administrador o del rol.
 */
function invalidInvitationResponse(code = "INVITACION_INVALIDA", status = 400) {
  return NextResponse.json(
    {
      code,
      message:
        code === "INVITACION_EXPIRADA"
          ? "La invitación ha expirado."
          : "La invitación no existe, fue utilizada o ya no está habilitada.",
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}

/**
 * POST /api/auth/invitations/validate
 *
 * Valida el token antes de mostrar el formulario de autorregistro y confirma
 * que el correo siga libre, el rol continúe activo y el administrador emisor
 * conserve sus privilegios.
 */
export async function POST(request: Request) {
  try {
    let body: unknown

    try {
      body = await request.json()
    } catch {
      return invalidInvitationResponse()
    }

    const validation = requestSchema.safeParse(body)

    if (!validation.success) {
      return invalidInvitationResponse()
    }

    const invitation = verifyInvitationToken(validation.data.token)
    const context = await getInvitationContext(invitation)

    if (
      context.existingUser ||
      !context.isRoleAssignable ||
      !context.isInviterAuthorized ||
      !context.role
    ) {
      return invalidInvitationResponse()
    }

    return NextResponse.json(
      {
        data: {
          correo: invitation.email,
          rol: {
            idRol: context.role.idRol,
            nombre: context.role.nombre,
          },
          expiresAt: new Date(invitation.expiresAt * 1000),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    if (error instanceof InvitationTokenError) {
      return invalidInvitationResponse(
        error.code,
        error.code === "INVITACION_EXPIRADA" ? 410 : 400
      )
    }

    console.error("[USER_INVITATION_VALIDATE]", error)

    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message: "No fue posible validar la invitación.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }
}
