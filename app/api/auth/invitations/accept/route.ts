import { NextResponse } from "next/server"

import { EstadoRegistro, Prisma } from "@/generated/prisma"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { getInvitationContext } from "@/lib/user-invitation-context"
import {
  InvitationTokenError,
  verifyInvitationToken,
} from "@/lib/user-invitation-token"
import { acceptUserInvitationSchema } from "@/lib/user-registration"

/**
 * Construye respuestas estables para que el futuro formulario pueda asociar
 * los errores del backend con campos concretos.
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
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  )
}

/**
 * Elimina separadores para comparar RUT almacenados con formatos distintos,
 * manteniendo la validación estructural utilizada por el resto del proyecto.
 */
function getComparableRut(rut: string) {
  return rut.replace(/[.\-\s]/g, "").toUpperCase()
}

/**
 * POST /api/auth/invitations/accept
 *
 * Crea una cuenta activa a partir de una invitación vigente. Correo y rol se
 * obtienen exclusivamente del token; la creación y su auditoría se ejecutan
 * juntas para impedir usuarios sin trazabilidad.
 */
export async function POST(request: Request) {
  try {
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

    const validation = acceptUserInvitationSchema.safeParse(body)

    if (!validation.success) {
      const fields = [
        ...new Set(
          validation.error.issues.flatMap((issue) => {
            const field = issue.path[0]

            return typeof field === "string" ? [field] : []
          })
        ),
      ]
      const passwordConfirmationError = validation.error.issues.some(
        (issue) => issue.path[0] === "confirmacionContrasena"
      )

      return errorResponse(
        passwordConfirmationError
          ? "CONTRASENAS_NO_COINCIDEN"
          : "DATOS_INVALIDOS",
        passwordConfirmationError
          ? "Las contraseñas no coinciden."
          : "Revise los datos ingresados.",
        400,
        fields
      )
    }

    const userData = validation.data
    const invitation = verifyInvitationToken(userData.token)
    const rutWithoutDots = userData.rut.replace(/\./g, "")
    const comparableRut = getComparableRut(userData.rut)
    const [context, existingRut] = await Promise.all([
      getInvitationContext(invitation),
      db.usuario.findFirst({
        where: {
          OR: [{ rut: userData.rut }, { rut: rutWithoutDots }],
        },
        select: {
          rut: true,
        },
      }),
    ])

    if (context.existingUser) {
      return errorResponse(
        "INVITACION_UTILIZADA",
        "Esta invitación ya fue utilizada.",
        409
      )
    }

    if (
      !context.isRoleAssignable ||
      !context.isInviterAuthorized ||
      !context.role ||
      !context.inviter
    ) {
      return errorResponse(
        "INVITACION_INVALIDA",
        "La invitación ya no se encuentra habilitada.",
        400
      )
    }

    if (existingRut && getComparableRut(existingRut.rut) === comparableRut) {
      return errorResponse(
        "RUT_EN_USO",
        "Ya existe un usuario con el RUT ingresado.",
        409,
        ["rut"]
      )
    }

    const inviterId = context.inviter.idUsuario
    const contrasenaHash = await hashPassword(userData.contrasena)
    const createdUser = await db.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          primerNombre: userData.primerNombre,
          segundoNombre: userData.segundoNombre,
          apellidoPaterno: userData.apellidoPaterno,
          apellidoMaterno: userData.apellidoMaterno,
          rut: userData.rut,
          correo: invitation.email,
          telefono: userData.telefono,
          idRol: invitation.idRol,
          contrasenaHash,
          estado: EstadoRegistro.ACTIVO,
        },
        select: {
          idUsuario: true,
          idRol: true,
          primerNombre: true,
          segundoNombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          rut: true,
          correo: true,
          telefono: true,
          estado: true,
          fechaRegistro: true,
          rol: {
            select: {
              idRol: true,
              nombre: true,
              descripcion: true,
            },
          },
        },
      })

      await tx.auditoria.create({
        data: {
          idUsuario: inviterId,
          tipoOperacion: "CREAR_USUARIO_INVITACION",
          nombreTablaAfectada: "usuarios",
          registroAfectado: user.idUsuario,
          valorNuevo: {
            idUsuario: user.idUsuario,
            rut: user.rut,
            correo: user.correo,
            idRol: user.idRol,
            rol: user.rol?.nombre ?? null,
            estado: user.estado,
            invitationId: invitation.invitationId,
          },
          detalleCambio:
            "Usuario registrado mediante una invitación administrativa.",
        },
      })

      return user
    })

    return NextResponse.json(
      {
        message: "La cuenta fue creada correctamente.",
        data: {
          ...createdUser,
          correoElectronico: createdUser.correo,
          fechaCreacion: createdUser.fechaRegistro,
        },
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  } catch (error) {
    if (error instanceof InvitationTokenError) {
      return errorResponse(
        error.code,
        error.code === "INVITACION_EXPIRADA"
          ? "La invitación ha expirado."
          : "La invitación no es válida.",
        error.code === "INVITACION_EXPIRADA" ? 410 : 400
      )
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = String(error.meta?.target ?? "").toLowerCase()

      if (target.includes("rut")) {
        return errorResponse(
          "RUT_EN_USO",
          "Ya existe un usuario con el RUT ingresado.",
          409,
          ["rut"]
        )
      }

      return errorResponse(
        "INVITACION_UTILIZADA",
        "Esta invitación ya fue utilizada.",
        409
      )
    }

    console.error("[USER_INVITATION_ACCEPT]", error)

    return errorResponse(
      "ERROR_INTERNO",
      "No fue posible completar el registro.",
      500
    )
  }
}
