// Endpoint de registro de usuarios adaptado al schema actual de autenticacion.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { hashPassword } from "@/lib/password"

const DEFAULT_REGISTER_ROLE = "Sin Rol"

function normalizeRut(rut: string) {
  const cleaned = rut
    .trim()
    .toUpperCase()
    .replace(/[^0-9K]/g, "")
    .slice(0, 9)

  if (cleaned.length <= 1) {
    return cleaned
  }

  const body = cleaned.slice(0, -1)
  const checkDigit = cleaned.slice(-1)
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `${formattedBody}-${checkDigit}`
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function splitNames(value: string) {
  const parts = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)

  return {
    primerNombre: parts[0] ?? "",
    segundoNombre: parts.slice(1).join(" ") || null,
  }
}

function splitSurnames(value: string) {
  const parts = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean)

  return {
    apellidoPaterno: parts[0] ?? "",
    apellidoMaterno: parts.slice(1).join(" "),
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const nameParts = splitNames(String(data.nombre ?? data.nombres ?? ""))
    const surnameParts = splitSurnames(String(data.apellidos ?? ""))
    const primerNombre = String(
      data.primerNombre ?? nameParts.primerNombre
    ).trim()
    const segundoNombre = data.segundoNombre
      ? String(data.segundoNombre).trim()
      : nameParts.segundoNombre
    const apellidoPaterno = String(
      data.apellidoPaterno ?? surnameParts.apellidoPaterno
    ).trim()
    const apellidoMaterno = String(
      data.apellidoMaterno ?? surnameParts.apellidoMaterno
    ).trim()
    const rut = normalizeRut(String(data.rut ?? ""))
    const correoElectronico = normalizeEmail(String(data.correoElectronico ?? ""))
    const contrasena = String(data.contrasena ?? "")
    const idRol = data.idRol ? Number(data.idRol) : null
    const estado = String(data.estado ?? "activo").trim().toLowerCase()

    if (
      !primerNombre ||
      !apellidoPaterno ||
      !rut ||
      !correoElectronico ||
      !contrasena
    ) {
      return new NextResponse("Faltan campos obligatorios", { status: 400 })
    }

    if (contrasena.length < 8) {
      return new NextResponse("La contrasena debe tener al menos 8 caracteres", {
        status: 400,
      })
    }

    const existingUser = await db.usuario.findFirst({
      where: {
        OR: [{ rut }, { correo: correoElectronico }],
      },
    })

    if (existingUser) {
      return new NextResponse("Ya existe un usuario con ese RUT o correo", {
        status: 409,
      })
    }

    const role = idRol
      ? await db.rol.findUnique({
          where: {
            idRol,
          },
        })
      : await db.rol.findUnique({
          where: {
            nombre: DEFAULT_REGISTER_ROLE,
          },
        })

    if (!role) {
      return new NextResponse(
        `No existe el rol predeterminado ${DEFAULT_REGISTER_ROLE}`,
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(contrasena)

    const user = await db.usuario.create({
      data: {
        idRol: role.idRol,
        primerNombre,
        segundoNombre,
        apellidoPaterno,
        apellidoMaterno,
        rut,
        correo: correoElectronico,
        contrasenaHash: hashedPassword,
        estado,
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
        estado: true,
        fechaRegistro: true,
      },
    })

    return NextResponse.json(
      {
        ...user,
        correoElectronico: user.correo,
        fechaCreacion: user.fechaRegistro,
      },
      { status: 201 }
    )
  } catch (error) {
    console.log("[AUTH_REGISTER_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
