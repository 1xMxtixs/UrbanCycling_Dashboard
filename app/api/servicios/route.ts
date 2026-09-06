import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type ServicioRow = {
  idServicio: number | bigint
  codigo: string
  nombre: string
  descripcion: string | null
  precioVenta: number | string
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
    const servicios = estado
      ? await db.$queryRaw<ServicioRow[]>`
          SELECT
            id_servicio AS idServicio,
            codigo,
            nombre,
            descripcion,
            precio_venta AS precioVenta,
            estado
          FROM servicios
          WHERE estado = ${estado}
          ORDER BY nombre ASC
        `
      : await db.$queryRaw<ServicioRow[]>`
          SELECT
            id_servicio AS idServicio,
            codigo,
            nombre,
            descripcion,
            precio_venta AS precioVenta,
            estado
          FROM servicios
          ORDER BY nombre ASC
        `

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
    const existentes = await db.$queryRaw<{ idServicio: number }[]>`
      SELECT id_servicio AS idServicio
      FROM servicios
      WHERE codigo = ${data.codigo} OR nombre = ${data.nombre}
      LIMIT 1
    `

    if (existentes.length > 0) {
      return NextResponse.json(
        {
          code: "SERVICIO_DUPLICADO",
          message: "Ya existe un servicio con ese codigo o nombre",
        },
        { status: 409 }
      )
    }

    await db.$executeRaw`
      INSERT INTO servicios (codigo, nombre, descripcion, precio_venta, estado)
      VALUES (
        ${data.codigo},
        ${data.nombre},
        ${data.descripcion ?? null},
        ${data.precioVenta},
        ${data.estado}
      )
    `

    const [servicio] = await db.$queryRaw<ServicioRow[]>`
      SELECT
        id_servicio AS idServicio,
        codigo,
        nombre,
        descripcion,
        precio_venta AS precioVenta,
        estado
      FROM servicios
      WHERE codigo = ${data.codigo}
      LIMIT 1
    `

    return NextResponse.json(normalizarServicio(servicio), { status: 201 })
  } catch (error) {
    console.log("[SERVICIOS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
