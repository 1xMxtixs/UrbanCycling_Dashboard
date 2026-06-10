// Endpoint de usuarios para actualizar el rol asignado a un usuario.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

const PENDING_ROLE_NAME = "Sin Rol"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function parseUserId(id: string): number {
  const userId = Number(id)

  if (!Number.isInteger(userId) || userId <= 0) {
    return Number.NaN
  }

  return userId
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.ROLES_ASSIGN)

    if (response) {
      return response
    }

    const { id } = await context.params
    const userId = parseUserId(id)

    if (Number.isNaN(userId)) {
      return new NextResponse("Id de usuario invalido", { status: 400 })
    }

    const data = await request.json()
    const roleId = Number(data.idRol)

    if (!Number.isInteger(roleId) || roleId <= 0) {
      return new NextResponse("Id de rol invalido", { status: 400 })
    }

    const user = await db.usuario.findUnique({
      where: {
        idUsuario: userId,
      },
      select: {
        idUsuario: true,
        idRol: true,
      },
    })

    if (!user) {
      return new NextResponse("Usuario no encontrado", { status: 404 })
    }

    const role = await db.rol.findUnique({
      where: {
        idRol: roleId,
      },
      select: {
        idRol: true,
      },
    })

    if (!role) {
      return new NextResponse("Rol no encontrado", { status: 404 })
    }

    if (user.idRol === roleId) {
      return new NextResponse("El usuario ya posee este rol", { status: 409 })
    }

    const updatedUser = await db.usuario.update({
      where: {
        idUsuario: userId,
      },
      data: {
        idRol: roleId,
      },
      select: {
        idUsuario: true,
        rut: true,
        primerNombre: true,
        segundoNombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        estado: true,
        fechaRegistro: true,
        fechaUltimoAcceso: true,
        rol: {
          select: {
            idRol: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...updatedUser,
      correoElectronico: updatedUser.correo,
      fechaCreacion: updatedUser.fechaRegistro,
      ultimoAcceso: updatedUser.fechaUltimoAcceso,
    })
  } catch (error) {
    console.log("[USER_ROLE_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.ROLES_REMOVE)

    if (response) {
      return response
    }

    const { id } = await context.params
    const userId = parseUserId(id)

    if (Number.isNaN(userId)) {
      return new NextResponse("Id de usuario invalido", { status: 400 })
    }

    const pendingRole = await db.rol.findUnique({
      where: {
        nombre: PENDING_ROLE_NAME,
      },
      select: {
        idRol: true,
      },
    })

    if (!pendingRole) {
      return new NextResponse("Rol Sin Rol no encontrado", {
        status: 500,
      })
    }

    const user = await db.usuario.findUnique({
      where: {
        idUsuario: userId,
      },
      select: {
        idUsuario: true,
        idRol: true,
      },
    })

    if (!user) {
      return new NextResponse("Usuario no encontrado", { status: 404 })
    }

    if (user.idRol === pendingRole.idRol) {
      return new NextResponse(
        "El usuario ya se encuentra sin rol asignado",
        { status: 409 },
      )
    }

    const updatedUser = await db.usuario.update({
      where: {
        idUsuario: userId,
      },
      data: {
        idRol: pendingRole.idRol,
      },
      select: {
        idUsuario: true,
        rut: true,
        primerNombre: true,
        segundoNombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        correo: true,
        estado: true,
        fechaRegistro: true,
        fechaUltimoAcceso: true,
        rol: {
          select: {
            idRol: true,
            nombre: true,
            descripcion: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...updatedUser,
      correoElectronico: updatedUser.correo,
      fechaCreacion: updatedUser.fechaRegistro,
      ultimoAcceso: updatedUser.fechaUltimoAcceso,
    })
  } catch (error) {
    console.log("[USER_ROLE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
