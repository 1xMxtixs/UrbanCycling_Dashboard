// Controlador para obtener proveedores disponibles al crear una orden de compra.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.SALES_CREATE)

    if (response) {
      return response
    }

    const providers = await db.proveedor.findMany({
      where: { estado: "activo" },
      select: {
        idProveedor: true,
        razonSocial: true,
        nombreFantasia: true,
        rut: true,
        condicionesDePago: true,
      },
      orderBy: { razonSocial: "asc" },
    })

    if (providers.length === 0) {
      return NextResponse.json(
        {
          code: "PROVEEDORES_NO_REGISTRADOS",
          message:
            "Debe registrar al menos un proveedor activo antes de crear una orden de compra.",
          providers: [],
        },
        { status: 422 },
      )
    }

    return NextResponse.json({
      code: "PROVEEDORES_CARGADOS",
      providers,
      count: providers.length,
    })
  } catch (error) {
    console.log("[PURCHASE_ORDER_PROVIDERS_GET]", error)
    return NextResponse.json(
      {
        code: "ERROR_CARGA_PROVEEDORES",
        message: "No fue posible cargar los proveedores disponibles.",
      },
      { status: 500 },
    )
  }
}
