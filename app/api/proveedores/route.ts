import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

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
