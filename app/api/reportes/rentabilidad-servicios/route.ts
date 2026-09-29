import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

const FORMATO_FECHA = /^(\d{2})-(\d{2})-(\d{4})$/

type RangoFechas = {
  fechaInicio: string
  fechaFin: string
  fechaInicioSql: string
  fechaFinSql: string
}

type FilaReporteRentabilidad = {
  fecha: Date | string
  total_ingresos_ot: number | string | null
  total_costo_repuestos: number | string | null
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null
}

/** Identifica las filas del SELECT que devuelve la SP, sin sus metadatos. */
function esFilaReporteRentabilidad(
  valor: unknown
): valor is FilaReporteRentabilidad {
  if (!esRegistro(valor)) {
    return false
  }

  return (
    "fecha" in valor &&
    "total_ingresos_ot" in valor &&
    "total_costo_repuestos" in valor
  )
}

/**
 * Prisma y el adaptador MariaDB entregan CALL sin etiquetas de columnas: cada
 * fila llega como { undefined: [fecha, ingresos, costos] }. Se normaliza ese
 * formato al mismo contrato que tendría un SELECT etiquetado.
 */
function normalizarFilaPosicional(
  valor: Record<string, unknown>
): FilaReporteRentabilidad | null {
  const [datos] = Object.values(valor)

  if (!Array.isArray(datos) || datos.length !== 3) {
    return null
  }

  const [fecha, ingresos, costos] = datos

  if (
    !(fecha instanceof Date || typeof fecha === "string") ||
    !(typeof ingresos === "number" || typeof ingresos === "string") ||
    !(typeof costos === "number" || typeof costos === "string")
  ) {
    return null
  }

  return {
    fecha,
    total_ingresos_ot: ingresos,
    total_costo_repuestos: costos,
  }
}

/**
 * MySQL puede devolver el conjunto de resultados de CALL junto a metadatos o
 * anidarlo en arreglos. Se conservan únicamente las filas del SELECT esperado.
 */
function extraerFilasReporte(resultado: unknown): FilaReporteRentabilidad[] {
  if (Array.isArray(resultado)) {
    return resultado.flatMap(extraerFilasReporte)
  }

  if (esFilaReporteRentabilidad(resultado)) {
    return [resultado]
  }

  if (esRegistro(resultado)) {
    const fila = normalizarFilaPosicional(resultado)
    return fila ? [fila] : []
  }

  return []
}

/**
 * Valida las fechas ingresadas por el formulario y conserva una representación
 * DD-MM-YYYY para la respuesta y otra ISO para enviarla a la SP como DATE.
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

    return {
      fecha,
      fechaSql: `${partes[3]}-${partes[2]}-${partes[1]}`,
    }
  }

  const inicio = construirFecha(inicioPartes)
  const fin = construirFecha(finPartes)

  if (!inicio || !fin) {
    return {
      code: "FECHA_INVALIDA",
      message: "Debe ingresar fechas válidas en formato DD-MM-YYYY",
    }
  }

  if (inicio.fecha > fin.fecha) {
    return {
      code: "RANGO_FECHAS_INVALIDO",
      message: "La fecha de inicio no puede ser posterior a la fecha de fin",
    }
  }

  return {
    fechaInicio,
    fechaFin,
    fechaInicioSql: inicio.fechaSql,
    fechaFinSql: fin.fechaSql,
  }
}

function esErrorDeRango(
  rango: RangoFechas | { code: string; message: string }
): rango is { code: string; message: string } {
  return "code" in rango
}

/** Normaliza DECIMAL y otros valores numéricos recibidos desde MySQL. */
function comoNumero(valor: number | string | null) {
  return Number(valor ?? 0)
}

/** Conserva la fecha de cada fila en un formato estable para el gráfico. */
function formatearFecha(fecha: Date | string) {
  if (fecha instanceof Date) {
    return fecha.toISOString().slice(0, 10)
  }

  return fecha.slice(0, 10)
}

function esErrorSinDatos(error: unknown) {
  const mensaje = error instanceof Error ? error.message : String(error)

  return mensaje
    .toLowerCase()
    .includes("no hay datos suficientes para generar el gráfico")
}

/**
 * GET /api/reportes/rentabilidad-servicios?fechaInicio=DD-MM-YYYY&fechaFin=DD-MM-YYYY
 *
 * Entrega el comparativo diario de ingresos de órdenes de trabajo y costos de
 * repuestos. La agregación vive en la SP para no transferir ni recorrer las
 * líneas de cada OT en el controlador.
 */
export async function GET(request: Request) {
  try {
    // reports:read está asignado al Administrador y bloquea la consulta de
    // información financiera antes de ejecutar la SP.
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

    // La SP filtra OTs ENTREGADAS por fecha_entrega_real y devuelve una fila
    // agregada por día, manteniendo la misma fuente de datos para todo el KPI.
    const resultado = await db.$queryRaw<unknown>`
      CALL sp_reporte_ingresos_ot_vs_repuestos_utilizados(
        ${rango.fechaInicioSql},
        ${rango.fechaFinSql}
      )
    `
    const filas = extraerFilasReporte(resultado)

    if (filas.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message:
            "No hay datos suficientes para generar el gráfico en este periodo",
        },
        { status: 404 }
      )
    }

    const ingresosOrdenesTrabajo = filas.reduce(
      (total, fila) => total + comoNumero(fila.total_ingresos_ot),
      0
    )
    const costosRepuestos = filas.reduce(
      (total, fila) => total + comoNumero(fila.total_costo_repuestos),
      0
    )

    return NextResponse.json({
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin,
      ingresosOrdenesTrabajo,
      costosRepuestos,
      utilidadBruta: ingresosOrdenesTrabajo - costosRepuestos,
      // El frontend recibe datos ya consolidados para dibujar la evolución
      // diaria sin conocer tablas, líneas ni reglas contables internas.
      series: filas.map((fila) => ({
        fecha: formatearFecha(fila.fecha),
        ingresosOrdenesTrabajo: comoNumero(fila.total_ingresos_ot),
        costosRepuestos: comoNumero(fila.total_costo_repuestos),
      })),
    })
  } catch (error) {
    if (esErrorSinDatos(error)) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message:
            "No hay datos suficientes para generar el gráfico en este periodo",
        },
        { status: 404 }
      )
    }

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
