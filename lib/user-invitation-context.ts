import { EstadoRegistro } from "@/generated/prisma"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import type { InvitationPayload } from "@/lib/user-invitation-token"

/**
 * Consulta el estado vigente del rol, el administrador emisor y el correo de
 * una invitación. Estas comprobaciones permiten invalidarla si cambian los
 * privilegios originales, aunque el token firmado todavía no haya expirado.
 */
export async function getInvitationContext(invitation: InvitationPayload) {
  const [role, inviter, existingUser] = await Promise.all([
    db.rol.findUnique({
      where: {
        idRol: invitation.idRol,
      },
      select: {
        idRol: true,
        nombre: true,
        estado: true,
      },
    }),
    db.usuario.findUnique({
      where: {
        idUsuario: invitation.invitedBy,
      },
      select: {
        idUsuario: true,
        estado: true,
        rol: {
          select: {
            nombre: true,
            estado: true,
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
    }),
    db.usuario.findFirst({
      where: {
        correo: invitation.email,
      },
      select: {
        idUsuario: true,
      },
    }),
  ])

  const isRoleAssignable =
    role?.estado === EstadoRegistro.ACTIVO && role.nombre !== "Sin Rol"
  const isInviterAuthorized =
    inviter?.estado === EstadoRegistro.ACTIVO &&
    inviter.rol?.estado === EstadoRegistro.ACTIVO &&
    inviter.rol.nombre === "Administrador" &&
    inviter.rol.permisosRol.some(
      ({ permiso }) => permiso.codigo === PERMISSIONS.USERS_CREATE
    )

  return {
    role,
    inviter,
    existingUser,
    isRoleAssignable,
    isInviterAuthorized,
  }
}
