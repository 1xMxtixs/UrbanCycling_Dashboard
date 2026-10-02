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

type FilaConteoOrdenes = {
  fecha: Date | string
  cantidadOrdenes: number | string | bigint | null
}

type FilaConteoOrdenesSql = {
  fecha: Date | string
  cantidad_ordenes: number | string | bigint
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null
}

/**
 * Valida las fechas del formulario y las deja disponibles tanto para la
 * respuesta (DD-MM-YYYY) como para la llamada DATE de la SP (YYYY-MM-DD).
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

function esValorNumerico(valor: unknown): valor is number | string | bigint {
  return (
    typeof valor === "number" ||
    typeof valor === "string" ||
    typeof valor === "bigint"
  )
}

/**
 * Convierte las filas posicionales que retorna CALL con Prisma/MariaDB al
 * contrato que consume el frontend: { fecha, cantidadOrdenes }.
 */
function normalizarFilaPosicional(
  valor: Record<string, unknown>
): FilaConteoOrdenes | null {
  const [datos] = Object.values(valor)

  if (!Array.isArray(datos) || datos.length !== 2) {
    return null
  }

  const [fecha, cantidadOrdenes] = datos

  if (
    !(fecha instanceof Date || typeof fecha === "string") ||
    !esValorNumerico(cantidadOrdenes)
  ) {
    return null
  }

  return { fecha, cantidadOrdenes }
}

function esFilaConteo(valor: unknown): valor is FilaConteoOrdenesSql {
  return (
    esRegistro(valor) &&
    "fecha" in valor &&
    "cantidad_ordenes" in valor &&
    (valor.fecha instanceof Date || typeof valor.fecha === "string") &&
    esValorNumerico(valor.cantidad_ordenes)
  )
}

/** Descarta metadatos de CALL y conserva las filas de su SELECT. */
function extraerFilasConteo(resultado: unknown): FilaConteoOrdenes[] {
  if (Array.isArray(resultado)) {
    return resultado.flatMap(extraerFilasConteo)
  }

  if (esFilaConteo(resultado)) {
    return [
      {
        fecha: resultado.fecha,
        cantidadOrdenes: resultado.cantidad_ordenes,
      },
    ]
  }

  if (esRegistro(resultado)) {
    const fila = normalizarFilaPosicional(resultado)
    return fila ? [fila] : []
  }

  return []
}

function formatearFecha(fecha: Date | string) {
  return fecha instanceof Date
    ? fecha.toISOString().slice(0, 10)
    : fecha.slice(0, 10)
}

function esErrorSinDatos(error: unknown) {
  const mensaje = error instanceof Error ? error.message : String(error)

  return mensaje.toLowerCase().includes("no existen órdenes de trabajo")
}

/**
 * GET /api/reportes/ordenes-trabajo?fechaInicio=DD-MM-YYYY&fechaFin=DD-MM-YYYY
 *
 * Cuenta órdenes ENTREGADAS por fecha de entrega real para que el frontend
 * muestre la productividad total y su evolución diaria sin consultar tablas.
 */
export async function GET(request: Request) {
  try {
    // Solo Administradores con reports:read pueden consultar productividad.
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

    // La SP agrupa OTs entregadas por día. Puede incluir el día siguiente por
    // su implementación actual, por lo que el filtro posterior preserva el
    // rango solicitado sin modificar el procedimiento almacenado.
    const resultado = await db.$queryRaw<unknown>`
      CALL sp_reporte_conteo_ordenes_trabajo(
        ${rango.fechaInicioSql},
        ${rango.fechaFinSql}
      )
    `
    const filas = extraerFilasConteo(resultado)
      .map((fila) => ({
        fecha: formatearFecha(fila.fecha),
        cantidadOrdenes: Number(fila.cantidadOrdenes ?? 0),
      }))
      .filter(
        (fila) =>
          fila.fecha >= rango.fechaInicioSql && fila.fecha <= rango.fechaFinSql
      )

    if (filas.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message: "No existen órdenes de trabajo en el período ingresado",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin,
      totalOrdenes: filas.reduce(
        (total, fila) => total + fila.cantidadOrdenes,
        0
      ),
      series: filas,
    })
  } catch (error) {
    if (esErrorSinDatos(error)) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message: "No existen órdenes de trabajo en el período ingresado",
        },
        { status: 404 }
      )
    }

    console.error("[REPORTES_CONTEO_ORDENES_GET]", error)

    return NextResponse.json(
      {
        code: "ERROR_REPORTE_ORDENES",
        message: "No fue posible generar el reporte de órdenes de trabajo",
      },
      { status: 500 }
    )
  }
}
