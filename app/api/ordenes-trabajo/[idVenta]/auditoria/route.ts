import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { NextResponse } from "next/server"

function parseIdOrden(idVenta: string) {
  const idOrdenDeTrabajo = Number(idVenta)

  if (!Number.isInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
    return Number.NaN
  }

  return idOrdenDeTrabajo
}

function serializarAuditoria(data: unknown) {
  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      if (typeof value === "bigint") {
        return value.toString()
      }

      return value
    })
  )
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.WORK_ORDERS_READ
    )

    if (response || !session) {
      return response
    }

    if (session.user.rol !== "Administrador") {
      return new NextResponse("Sin permisos", { status: 403 })
    }

    const { idVenta } = await params
    const idOrdenDeTrabajo = parseIdOrden(idVenta)

    if (Number.isNaN(idOrdenDeTrabajo)) {
      return NextResponse.json(
        {
          code: "ID_INVALIDO",
          message: "El ID de la orden no es valido",
        },
        { status: 400 }
      )
    }

    const historial = await db.auditoria.findMany({
      where: {
        nombreTablaAfectada: "ordenes_de_trabajo",
        registroAfectado: idOrdenDeTrabajo,
      },
      orderBy: {
        fechaRegistro: "desc",
      },
      include: {
        usuario: {
          select: {
            idUsuario: true,
            primerNombre: true,
            segundoNombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            correo: true,
          },
        },
      },
    })

    return NextResponse.json(
      serializarAuditoria({
        code: "HISTORIAL_AUDITORIA_ORDEN",
        idOrdenDeTrabajo,
        historial,
      })
    )
  } catch (error) {
    console.log("[AUDITORIA_ORDEN_GET]", error)

    return NextResponse.json(
      {
        code: "ERROR_CARGA_AUDITORIA",
        message:
          "No se pudieron cargar los datos. Debe consultar personalmente",
      },
      { status: 500 }
    )
  }
}
