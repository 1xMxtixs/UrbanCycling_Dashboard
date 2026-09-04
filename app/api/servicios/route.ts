import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type ServicioRow = {
  idServicio: number
  codigo: string
  nombre: string
  descripcion: string | null
  precioVenta: unknown
  estado: string
}

const servicioSchema = z.object({
  codigo: z.string().trim().min(1).max(50),
  nombre: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().max(500).optional().nullable(),
  precioVenta: z.coerce.number().min(0),
  estado: z.string().trim().min(1).max(20).default("activo"),
})

function normalizarServicio(servicio: ServicioRow) {
  return {
    ...servicio,
    idServicio: Number(servicio.idServicio),
    precioVenta: Number(servicio.precioVenta),
  }
}

function obtenerEstadoFiltro(req: Request) {
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get("estado")

  return estado?.trim() || null
}

export async function GET(req: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_READ)

    if (response) {
      return response
    }

    const estado = obtenerEstadoFiltro(req)
    const servicios = await db.servicio.findMany({
      where: estado
        ? {
            estado,
          }
        : undefined,
      orderBy: {
        nombre: "asc",
      },
    })

    return NextResponse.json(servicios.map(normalizarServicio))
  } catch (error) {
    console.log("[SERVICIOS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_CREATE)

    if (response) {
      return response
    }

    const validation = servicioSchema.safeParse(await req.json())

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
    const existente = await db.servicio.findFirst({
      where: {
        OR: [
          {
            codigo: data.codigo,
          },
          {
            nombre: data.nombre,
          },
        ],
      },
      select: {
        idServicio: true,
      },
    })

    if (existente) {
      return NextResponse.json(
        {
          code: "SERVICIO_DUPLICADO",
          message: "Ya existe un servicio con ese codigo o nombre",
        },
        { status: 409 }
      )
    }

    const servicio = await db.servicio.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        precioVenta: data.precioVenta,
        estado: data.estado,
      },
    })

    return NextResponse.json(normalizarServicio(servicio), { status: 201 })
  } catch (error) {
    console.log("[SERVICIOS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
