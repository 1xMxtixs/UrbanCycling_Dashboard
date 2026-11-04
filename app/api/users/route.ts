// Endpoints administrativos para listar y registrar cuentas de usuario.
import { NextResponse } from "next/server"

import { EstadoRegistro, Prisma } from "@/generated/prisma"
import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"
import { PERMISSIONS } from "@/lib/permissions"
import { requireAdministrator } from "@/lib/require-administrator"
import { requirePermission } from "@/lib/require-permission"
import { createUserSchema } from "@/lib/user-registration"

/**
 * Construye respuestas de error JSON con un contrato estable para que el
 * frontend pueda asociar errores de validación a campos concretos.
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
 * Elimina los separadores de un RUT para comparar registros que pueden estar
 * almacenados con o sin puntos y guion.
 */
function getComparableRut(rut: string) {
  return rut.replace(/[.\-\s]/g, "").toUpperCase()
}

/**
 * GET /api/users
 *
 * Lista las cuentas registradas y sus roles para usuarios que posean el permiso
 * de lectura del módulo. La respuesta conserva los aliases utilizados por la
 * interfaz actual y nunca incluye credenciales ni tokens.
 */
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
        telefono: true,
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

/**
 * POST /api/users
 *
 * Registra directamente una cuenta activa a solicitud de un administrador.
 * Valida los privilegios actuales del actor, normaliza los datos, comprueba la
 * unicidad de RUT y correo, y crea el usuario junto con su auditoría dentro de
 * una misma transacción. La contraseña solo se utiliza para generar su hash.
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

    const validation = createUserSchema.safeParse(body)

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

    const role = await db.rol.findUnique({
      where: {
        idRol: userData.idRol,
      },
      select: {
        idRol: true,
        nombre: true,
        estado: true,
      },
    })

    if (!role) {
      return errorResponse(
        "ROL_NO_ENCONTRADO",
        "El rol seleccionado no existe.",
        404,
        ["idRol"]
      )
    }

    if (role.estado !== EstadoRegistro.ACTIVO) {
      return errorResponse(
        "ROL_INACTIVO",
        "El rol seleccionado no se encuentra activo.",
        409,
        ["idRol"]
      )
    }

    if (role.nombre === "Sin Rol") {
      return errorResponse(
        "ROL_NO_ASIGNABLE",
        "Debe seleccionar un rol asignable.",
        400,
        ["idRol"]
      )
    }

    const rutWithoutDots = userData.rut.replace(/\./g, "")
    const comparableRut = getComparableRut(userData.rut)
    const existingUser = await db.usuario.findFirst({
      where: {
        OR: [
          { rut: userData.rut },
          { rut: rutWithoutDots },
          { correo: userData.correo },
        ],
      },
      select: {
        rut: true,
        correo: true,
      },
    })

    if (existingUser && getComparableRut(existingUser.rut) === comparableRut) {
      return errorResponse(
        "RUT_EN_USO",
        "Ya existe un usuario con el RUT ingresado.",
        409,
        ["rut"]
      )
    }

    if (existingUser?.correo === userData.correo) {
      return errorResponse(
        "CORREO_EN_USO",
        "Ya existe un usuario con el correo ingresado.",
        409,
        ["correo"]
      )
    }

    const contrasenaHash = await hashPassword(userData.contrasena)

    const createdUser = await db.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          primerNombre: userData.primerNombre,
          segundoNombre: userData.segundoNombre,
          apellidoPaterno: userData.apellidoPaterno,
          apellidoMaterno: userData.apellidoMaterno,
          rut: userData.rut,
          correo: userData.correo,
          telefono: userData.telefono,
          idRol: role.idRol,
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

      await tx.auditoria.create({
        data: {
          idUsuario: actor.idUsuario,
          tipoOperacion: "CREAR_USUARIO_DIRECTO",
          nombreTablaAfectada: "usuarios",
          registroAfectado: user.idUsuario,
          valorNuevo: {
            idUsuario: user.idUsuario,
            rut: user.rut,
            correo: user.correo,
            idRol: user.idRol,
            rol: user.rol?.nombre ?? null,
            estado: user.estado,
          },
          detalleCambio: "Usuario creado directamente por un administrador.",
        },
      })

      return user
    })

    return NextResponse.json(
      {
        data: {
          ...createdUser,
          correoElectronico: createdUser.correo,
          fechaCreacion: createdUser.fechaRegistro,
          ultimoAcceso: createdUser.fechaUltimoAcceso,
        },
      },
      { status: 201 }
    )
  } catch (error) {
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

      if (target.includes("correo")) {
        return errorResponse(
          "CORREO_EN_USO",
          "Ya existe un usuario con el correo ingresado.",
          409,
          ["correo"]
        )
      }

      return errorResponse(
        "USUARIO_DUPLICADO",
        "Ya existe un usuario con esos datos.",
        409
      )
    }

    console.error("[USERS_POST]", error)

    return errorResponse(
      "ERROR_INTERNO",
      "No fue posible registrar el usuario.",
      500
    )
  }
}
