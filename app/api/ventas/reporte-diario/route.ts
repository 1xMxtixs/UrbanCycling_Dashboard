// Reporte diario de ingresos por ventas directas.
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { NextResponse } from "next/server"

function formatearFecha(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function parseFecha(fecha: string | null) {
  const fechaReporte = fecha ?? formatearFecha(new Date())

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaReporte)) {
    return {
      error: "La fecha debe tener formato YYYY-MM-DD",
      fechaReporte,
      inicioDia: null,
      finDia: null,
    }
  }

  const inicioDia = new Date(`${fechaReporte}T00:00:00`)
  const finDia = new Date(inicioDia)
  finDia.setDate(finDia.getDate() + 1)

  if (Number.isNaN(inicioDia.getTime())) {
    return {
      error: "La fecha ingresada no es válida",
      fechaReporte,
      inicioDia: null,
      finDia: null,
    }
  }

  return {
    error: null,
    fechaReporte,
    inicioDia,
    finDia,
  }
}

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

function adaptarVenta(venta: Awaited<ReturnType<typeof db.venta.findMany>>[number] & {
  ventaEnMostrador?: {
    estado: string
    estadoPago: string
    montoTotal: unknown
    descuentoGlobal: unknown
    lineasDeVenta?: unknown[]
  } | null
}) {
  return {
    ...venta,
    fechaCreacion: venta.fechaRegistro,
    total: venta.ventaEnMostrador?.montoTotal ?? 0,
    descuento: venta.ventaEnMostrador?.descuentoGlobal ?? 0,
    estadoPago: venta.ventaEnMostrador?.estadoPago ?? null,
    estadoVenta: venta.ventaEnMostrador?.estado ?? null,
    lineasDeVenta: venta.ventaEnMostrador?.lineasDeVenta ?? [],
  }
}

export async function GET(req: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.REPORTS_READ)

    if (response) {
      return response
    }

    const { searchParams } = new URL(req.url)
    const { error, fechaReporte, inicioDia, finDia } = parseFecha(
      searchParams.get("fecha")
    )

    if (error || !inicioDia || !finDia) {
      return NextResponse.json(
        {
          code: "FECHA_INVALIDA",
          message: error,
        },
        { status: 400 }
      )
    }

    const ventas = await db.venta.findMany({
      where: {
        fechaRegistro: {
          gte: inicioDia,
          lt: finDia,
        },
      },
      orderBy: {
        fechaRegistro: "asc",
      },
      include: {
        cliente: true,
        usuario: true,
        ventaEnMostrador: {
          include: {
            lineasDeVenta: {
              include: {
                producto: true,
              },
            },
          },
        },
      },
    })

    const totalIngresos = ventas.reduce(
      (total, venta) => total + toNumber(venta.ventaEnMostrador?.montoTotal),
      0
    )

    return NextResponse.json({
      fecha: fechaReporte,
      total_ingresos: totalIngresos,
      totalIngresos,
      cantidad_ventas: ventas.length,
      cantidadVentas: ventas.length,
      ventas: ventas.map(adaptarVenta),
    })
  } catch (error) {
    console.log("[VENTAS_REPORTE_DIARIO_GET]", error)

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
