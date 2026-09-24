import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function parseProveedorId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const id = Number(value)

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null
  }

  return id
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { response } = await requirePermission(PERMISSIONS.SUPPLIERS_READ)

    if (response) {
      return response
    }

    const { id } = await context.params
    const idProveedor = parseProveedorId(id)

    if (!idProveedor) {
      return NextResponse.json(
        {
          code: "ID_PROVEEDOR_INVALIDO",
          message: "El identificador del proveedor no es válido",
        },
        { status: 400 },
      )
    }

    const proveedor = await db.proveedor.findUnique({
      where: {
        idProveedor,
      },
      select: {
        idProveedor: true,
        razonSocial: true,
        nombreFantasia: true,
        rut: true,
        giro: true,
        condicionesDePago: true,
        nombreContacto: true,
        fechaRegistro: true,
        estado: true,
        telefonos: {
          select: {
            idTelefonoProveedor: true,
            telefono: true,
            descripcion: true,
          },
          orderBy: {
            idTelefonoProveedor: "asc",
          },
        },
        correos: {
          select: {
            idCorreoProveedor: true,
            correo: true,
            descripcion: true,
          },
          orderBy: {
            idCorreoProveedor: "asc",
          },
        },
        direcciones: {
          select: {
            idDireccionProveedor: true,
            region: true,
            ciudad: true,
            comuna: true,
            calle: true,
            numero: true,
            unidad: true,
            descripcion: true,
          },
          orderBy: {
            idDireccionProveedor: "asc",
          },
        },
      },
    })

    if (!proveedor) {
      return NextResponse.json(
        {
          code: "PROVEEDOR_NO_ENCONTRADO",
          message: "El proveedor solicitado no existe",
        },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        code: "PROVEEDOR_CARGADO",
        provider: proveedor,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al cargar proveedor:", error)

    return NextResponse.json(
      {
        code: "ERROR_CARGAR_PROVEEDOR",
        message: "No fue posible cargar el proveedor",
      },
      { status: 500 },
    )
  }
}
