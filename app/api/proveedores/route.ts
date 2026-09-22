import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { crearProveedorSchema } from "@/lib/provider-validation"
import { requirePermission } from "@/lib/require-permission"

export async function POST(request: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.SUPPLIERS_CREATE)

    if (response) {
      return response
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

    const validation = crearProveedorSchema.safeParse(body)

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

    const proveedor = await db.proveedor.create({
      data: {
        ...datosProveedor,
        estado: "activo",
        telefonos: {
          create: telefonos.map((telefono) => ({
            telefono: telefono.telefono,
            descripcion: telefono.descripcion,
          })),
        },
        correos: {
          create: correos.map((correo) => ({
            correo: correo.correo,
            descripcion: correo.descripcion,
          })),
        },
        direcciones: {
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
      },
      include: {
        direcciones: true,
        telefonos: true,
        correos: true,
      },
    })

    return NextResponse.json(
      {
        code: "PROVEEDOR_CREADO",
        message: "El proveedor fue registrado correctamente",
        provider: proveedor,
      },
      { status: 201 },
    )
  } catch (error) {
    const databaseError = error as { code?: string }

    if (databaseError.code === "P2002") {
      return NextResponse.json(
        {
          code: "RUT_PROVEEDOR_DUPLICADO",
          message: "Ya existe un proveedor registrado con ese RUT",
        },
        { status: 409 },
      )
    }

    console.error("Error al crear proveedor:", error)

    return NextResponse.json(
      {
        code: "ERROR_CREAR_PROVEEDOR",
        message: "No fue posible registrar el proveedor",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.SUPPLIERS_READ)

    if (response) {
      return response
    }

    const proveedores = await db.proveedor.findMany({
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
      },
      orderBy: [
        {
          razonSocial: "asc",
        },
        {
          idProveedor: "asc",
        },
      ],
    })

    return NextResponse.json(
      {
        code: "PROVEEDORES_CARGADOS",
        providers: proveedores,
        count: proveedores.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error al cargar proveedores:", error)

    return NextResponse.json(
      {
        code: "ERROR_CARGAR_PROVEEDORES",
        message: "No fue posible cargar los proveedores",
      },
      { status: 500 },
    )
  }
}
