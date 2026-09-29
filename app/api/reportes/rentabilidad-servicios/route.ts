import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

const FORMATO_FECHA = /^(\d{2})-(\d{2})-(\d{4})$/

type RangoFechas = {
  inicio: Date
  finExclusivo: Date
  fechaInicio: string
  fechaFin: string
}

/**
 * Convierte una fecha enviada por el formulario (DD-MM-YYYY) en límites UTC
 * inclusivo/exclusivo. Así el rango siempre incluye el día final completo.
 */
function crearRangoFechas(
  fechaInicio: string | null,
  fechaFin: string | null
): RangoFechas | { code: string; message: string } {
  if (!fechaInicio || !fechaFin) {
    return {
      code: "FECHAS_REQUERIDAS",
      message: "Debe ingresar la fecha de inicio y la fecha de fin",
    }
  }

  const inicioPartes = FORMATO_FECHA.exec(fechaInicio)
  const finPartes = FORMATO_FECHA.exec(fechaFin)

  if (!inicioPartes || !finPartes) {
    return {
      code: "FECHA_INVALIDA",
      message: "Las fechas deben tener formato DD-MM-YYYY",
    }
  }

  const construirFecha = (partes: RegExpExecArray) => {
    const dia = Number(partes[1])
    const mes = Number(partes[2])
    const anio = Number(partes[3])
    const fecha = new Date(Date.UTC(anio, mes - 1, dia))

    if (
      anio < 1000 ||
      fecha.getUTCFullYear() !== anio ||
      fecha.getUTCMonth() !== mes - 1 ||
      fecha.getUTCDate() !== dia
    ) {
      return null
    }

    return fecha
  }

  const inicio = construirFecha(inicioPartes)
  const fin = construirFecha(finPartes)

  if (!inicio || !fin) {
    return {
      code: "FECHA_INVALIDA",
      message: "Debe ingresar fechas válidas en formato DD-MM-YYYY",
    }
  }

  if (inicio > fin) {
    return {
      code: "RANGO_FECHAS_INVALIDO",
      message: "La fecha de inicio no puede ser posterior a la fecha de fin",
    }
  }

  const finExclusivo = new Date(fin)
  finExclusivo.setUTCDate(finExclusivo.getUTCDate() + 1)

  return { inicio, finExclusivo, fechaInicio, fechaFin }
}

function esErrorDeRango(
  rango: RangoFechas | { code: string; message: string }
): rango is { code: string; message: string } {
  return "code" in rango
}

/**
 * GET /api/reportes/rentabilidad-servicios?fechaInicio=DD-MM-YYYY&fechaFin=DD-MM-YYYY
 *
 * Entrega las series que consume el gráfico de CU59. Cada valor usa el precio,
 * descuento y costo guardados en la línea de OT, evitando recalcular con el
 * catálogo actual y preservando el valor histórico de la reparación.
 */
export async function GET(request: Request) {
  try {
    // reports:read está asignado al Administrador; el control responde 403
    // antes de consultar información financiera para cualquier otro usuario.
    const { response } = await requirePermission(PERMISSIONS.REPORTS_READ)

    if (response) {
      return response
    }

    const { searchParams } = new URL(request.url)
    const rango = crearRangoFechas(
      searchParams.get("fechaInicio"),
      searchParams.get("fechaFin")
    )

    if (esErrorDeRango(rango)) {
      return NextResponse.json(rango, { status: 400 })
    }

    // La fecha real de entrega representa cuándo la reparación se completó y
    // es la única referencia temporal del CU, sin depender del literal usado
    // para el estado de la OT antes o después de su estandarización.
    const ordenes = await db.ordenDeTrabajo.findMany({
      where: {
        fechaEntregaReal: {
          gte: rango.inicio,
          lt: rango.finExclusivo,
        },
        lineasDeOrdenDeTrabajo: {
          some: {
            idProducto: { not: null },
          },
        },
      },
      select: {
        idOrdenDeTrabajo: true,
        lineasDeOrdenDeTrabajo: {
          select: {
            idServicio: true,
            idProducto: true,
            cantidad: true,
            precioUnitario: true,
            descuentoUnitario: true,
            costoUnitario: true,
          },
        },
      },
    })

    let ingresosManoObra = 0
    let ingresosRepuestos = 0
    let costosRepuestos = 0

    for (const orden of ordenes) {
      for (const linea of orden.lineasDeOrdenDeTrabajo) {
        const cantidad = linea.cantidad
        const precioNetoUnitario = Math.max(
          0,
          Number(linea.precioUnitario) - Number(linea.descuentoUnitario)
        )

        if (linea.idServicio !== null) {
          ingresosManoObra += cantidad * precioNetoUnitario
        }

        if (linea.idProducto !== null) {
          ingresosRepuestos += cantidad * precioNetoUnitario
          costosRepuestos += cantidad * Number(linea.costoUnitario)
        }
      }
    }

    if (ordenes.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message:
            "No hay datos suficientes para generar el gráfico en este periodo",
        },
        { status: 404 }
      )
    }

    const utilidadBruta =
      ingresosManoObra + ingresosRepuestos - costosRepuestos

    // series permite al frontend renderizar el gráfico sin transformar ni
    // inferir métricas; utilidadBruta queda disponible para un KPI adicional.
    return NextResponse.json({
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin,
      ordenesConsideradas: ordenes.length,
      ingresosManoObra,
      ingresosRepuestos,
      costosRepuestos,
      utilidadBruta,
      series: [
        {
          categoria: "Mano de obra",
          ingresos: ingresosManoObra,
          costos: 0,
        },
        {
          categoria: "Repuestos",
          ingresos: ingresosRepuestos,
          costos: costosRepuestos,
        },
      ],
    })
  } catch (error) {
    console.error("[REPORTES_RENTABILIDAD_SERVICIOS_GET]", error)

    return NextResponse.json(
      {
        code: "ERROR_REPORTE_RENTABILIDAD",
        message: "No fue posible generar el reporte de rentabilidad",
      },
      { status: 500 }
    )
  }
}
