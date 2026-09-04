import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type ServicioRow = {
  idServicio: number
  codigo: string
  nombre: string
  descripcion: string | null
  precioVenta: unknown
  estado: string
}

const servicioUpdateSchema = z.object({
  codigo: z.string().trim().min(1).max(50).optional(),
  nombre: z.string().trim().min(1).max(100).optional(),
  descripcion: z.string().trim().max(500).optional().nullable(),
  precioVenta: z.coerce.number().min(0).optional(),
  estado: z.string().trim().min(1).max(20).optional(),
})

function parseServiceId(id: string) {
  const serviceId = Number(id)

  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    return Number.NaN
  }

  return serviceId
}

function normalizarServicio(servicio: ServicioRow) {
  return {
    ...servicio,
    idServicio: Number(servicio.idServicio),
    precioVenta: Number(servicio.precioVenta),
  }
}

async function obtenerServicio(serviceId: number) {
  return db.servicio.findUnique({
    where: {
      idServicio: serviceId,
    },
  })
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_READ)

    if (response) {
      return response
    }

    const { id } = await context.params
    const serviceId = parseServiceId(id)

    if (Number.isNaN(serviceId)) {
      return new NextResponse("Invalid service id", { status: 400 })
    }

    const servicio = await obtenerServicio(serviceId)

    if (!servicio) {
      return new NextResponse("Service not found", { status: 404 })
    }

    return NextResponse.json(normalizarServicio(servicio))
  } catch (error) {
    console.log("[SERVICIOS_ID_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_UPDATE)

    if (response) {
      return response
    }

    const { id } = await context.params
    const serviceId = parseServiceId(id)

    if (Number.isNaN(serviceId)) {
      return new NextResponse("Invalid service id", { status: 400 })
    }

    const servicioActual = await obtenerServicio(serviceId)

    if (!servicioActual) {
      return new NextResponse("Service not found", { status: 404 })
    }

    const validation = servicioUpdateSchema.safeParse(await req.json())

    if (!validation.success) {
      return NextResponse.json(
        {
          code: "SERVICIO_INVALIDO",
          message: validation.error.issues[0]?.message ?? "Datos invalidos",
        },
        { status: 400 }
      )
    }

    const data = validation.data
    const codigo = data.codigo ?? servicioActual.codigo
    const nombre = data.nombre ?? servicioActual.nombre
    const descripcion =
      "descripcion" in data ? data.descripcion ?? null : servicioActual.descripcion
    const precioVenta = data.precioVenta ?? Number(servicioActual.precioVenta)
    const estado = data.estado ?? servicioActual.estado

    const duplicado = await db.servicio.findFirst({
      where: {
        AND: [
          {
            OR: [
              {
                codigo,
              },
              {
                nombre,
              },
            ],
          },
          {
            idServicio: {
              not: serviceId,
            },
          },
        ],
      },
      select: {
        idServicio: true,
      },
    })

    if (duplicado) {
      return NextResponse.json(
        {
          code: "SERVICIO_DUPLICADO",
          message: "Ya existe otro servicio con ese codigo o nombre",
        },
        { status: 409 }
      )
    }

    const servicio = await db.servicio.update({
      where: {
        idServicio: serviceId,
      },
      data: {
        codigo,
        nombre,
        descripcion,
        precioVenta,
        estado,
      },
    })

    return NextResponse.json(normalizarServicio(servicio))
  } catch (error) {
    console.log("[SERVICIOS_ID_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_DELETE)

    if (response) {
      return response
    }

    const { id } = await context.params
    const serviceId = parseServiceId(id)

    if (Number.isNaN(serviceId)) {
      return new NextResponse("Invalid service id", { status: 400 })
    }

    const servicio = await obtenerServicio(serviceId)

    if (!servicio) {
      return new NextResponse("Service not found", { status: 404 })
    }

    const [totalLineas, totalProductosServicio] = await Promise.all([
      db.lineaDeOrdenDeTrabajo.count({
        where: {
          idServicio: serviceId,
        },
      }),
      db.productoServicio.count({
        where: {
          idServicio: serviceId,
        },
      }),
    ])

    if (totalLineas > 0 || totalProductosServicio > 0) {
      const servicioInactivo = await db.servicio.update({
        where: {
          idServicio: serviceId,
        },
        data: {
          estado: "inactivo",
        },
      })

      return NextResponse.json(normalizarServicio(servicioInactivo))
    }

    await db.servicio.delete({
      where: {
        idServicio: serviceId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log("[SERVICIOS_ID_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
