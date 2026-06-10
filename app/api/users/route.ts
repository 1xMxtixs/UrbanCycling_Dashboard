// Endpoint de usuarios para listar cuentas registradas y sus roles.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.USERS_READ)

    if (response) {
      return response
    }

    const users = await db.usuario.findMany({
      orderBy: {
        idUsuario: "desc",
      },
      select: {
        idUsuario: true,
        idRol: true,
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

    return NextResponse.json(
      users.map((user) => ({
        ...user,
        correoElectronico: user.correo,
        idRol: user.idRol ?? user.rol?.idRol ?? 0,
        rol: user.rol ?? {
          idRol: 0,
          nombre: "Sin Rol",
          descripcion: null,
        },
        fechaCreacion: user.fechaRegistro,
        ultimoAcceso: user.fechaUltimoAcceso,
      }))
    )
  } catch (error) {
    console.log("[USERS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
