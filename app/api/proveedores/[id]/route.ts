import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { actualizarProveedorSchema } from "@/lib/provider-validation"
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

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { response } = await requirePermission(PERMISSIONS.SUPPLIERS_UPDATE)

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

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          code: "JSON_INVALIDO",
          message: "El cuerpo de la solicitud no contiene un JSON válido",
        },
        { status: 400 },
      )
    }

    const validation = actualizarProveedorSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          code: "DATOS_PROVEEDOR_INVALIDOS",
          message: "Los datos del proveedor no son válidos",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    const { direcciones, telefonos, correos, ...datosProveedor } =
      validation.data

    const proveedor = await db.$transaction(async (transaction) => {
      const existente = await transaction.proveedor.findUnique({
        where: {
          idProveedor,
        },
        select: {
          idProveedor: true,
        },
      })

      if (!existente) {
        return null
      }

      return transaction.proveedor.update({
        where: {
          idProveedor,
        },
        data: {
          ...datosProveedor,
          ...(direcciones
            ? {
                direcciones: {
                  deleteMany: {},
                  create: direcciones.map((direccion) => ({
                    region: direccion.region,
                    ciudad: direccion.ciudad,
                    comuna: direccion.comuna,
                    calle: direccion.calle,
                    numero: direccion.numero,
                    unidad: direccion.unidad,
                    descripcion: direccion.descripcion ?? "",
                  })),
                },
              }
            : {}),
          ...(telefonos
            ? {
                telefonos: {
                  deleteMany: {},
                  create: telefonos.map((telefono) => ({
                    telefono: telefono.telefono,
                    descripcion: telefono.descripcion,
                  })),
                },
              }
            : {}),
          ...(correos
            ? {
                correos: {
                  deleteMany: {},
                  create: correos.map((correo) => ({
                    correo: correo.correo,
                    descripcion: correo.descripcion,
                  })),
                },
              }
            : {}),
        },
        include: {
          direcciones: true,
          telefonos: true,
          correos: true,
        },
      })
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
        code: "PROVEEDOR_ACTUALIZADO",
        message: "El proveedor fue actualizado correctamente",
        provider: proveedor,
      },
      { status: 200 },
    )
  } catch (error) {
    const databaseError = error as { code?: string }

    if (databaseError.code === "P2002") {
      return NextResponse.json(
        {
          code: "RUT_PROVEEDOR_DUPLICADO",
          message: "Ya existe otro proveedor registrado con ese RUT",
        },
        { status: 409 },
      )
    }

    if (databaseError.code === "P2025") {
      return NextResponse.json(
        {
          code: "PROVEEDOR_NO_ENCONTRADO",
          message: "El proveedor solicitado no existe",
        },
        { status: 404 },
      )
    }

    console.error("Error al actualizar proveedor:", error)

    return NextResponse.json(
      {
        code: "ERROR_ACTUALIZAR_PROVEEDOR",
        message: "No fue posible actualizar el proveedor",
      },
      { status: 500 },
    )
  }
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
