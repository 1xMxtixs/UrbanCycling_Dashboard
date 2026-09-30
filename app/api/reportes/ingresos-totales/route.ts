import { NextResponse } from "next/server"
import * as mariadb from "mariadb"

import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

const FORMATO_FECHA = /^(\d{2})-(\d{2})-(\d{4})$/

type RangoFechas = {
  fechaInicio: string
  fechaFin: string
  fechaInicioSql: string
  fechaFinSql: string
}

type FilaIngresosOrdenes = {
  fecha: Date | string
  ingresosOrdenesTrabajo: number | string | bigint
}

type FilaIngresosOrdenesSql = {
  fecha: Date | string
  ingresos_ordenes_trabajo: number | string | bigint
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null
}

/**
 * Valida el rango ingresado por el formulario y entrega fechas DD-MM-YYYY
 * para el frontend y YYYY-MM-DD para la llamada DATE del procedimiento.
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
 * Abre una conexión puntual para procedimientos que devuelven varias filas.
 * El adaptador Prisma/MariaDB conserva solo la última fila de un CALL, mientras
 * que el cliente MariaDB entrega el conjunto completo que necesita el gráfico.
 */
function crearConexionReportes() {
  const rawUrl = process.env.DATABASE_URL

  if (!rawUrl) {
    throw new Error("DATABASE_URL no está configurada")
  }

  const url = new URL(rawUrl)
  const caCert = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n")
  const requiereSsl = /[?&]ssl-mode=required/i.test(rawUrl)

  return mariadb.createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: caCert ? { ca: caCert } : requiereSsl || undefined,
  })
}

/**
 * Prisma y el adaptador MariaDB pueden devolver CALL como una fila posicional:
 * { undefined: [fecha, ingresosMostrador, ingresosOT, totalDia] }.
 */
function normalizarFilaPosicional(
  valor: Record<string, unknown>
): FilaIngresosOrdenes | null {
  const [datos] = Object.values(valor)

  if (!Array.isArray(datos) || datos.length !== 4) {
    return null
  }

  const [fecha, , ingresosOrdenesTrabajo] = datos

  if (
    !(fecha instanceof Date || typeof fecha === "string") ||
    !esValorNumerico(ingresosOrdenesTrabajo)
  ) {
    return null
  }

  return { fecha, ingresosOrdenesTrabajo }
}

function esFilaIngresosOrdenes(
  valor: unknown
): valor is FilaIngresosOrdenesSql {
  return (
    esRegistro(valor) &&
    "fecha" in valor &&
    "ingresos_ordenes_trabajo" in valor &&
    (valor.fecha instanceof Date || typeof valor.fecha === "string") &&
    esValorNumerico(valor.ingresos_ordenes_trabajo)
  )
}

/** Descarta metadatos de CALL y extrae solo el ingreso diario de las OTs. */
function extraerFilasIngresos(resultado: unknown): FilaIngresosOrdenes[] {
  if (Array.isArray(resultado)) {
    return resultado.flatMap(extraerFilasIngresos)
  }

  if (esFilaIngresosOrdenes(resultado)) {
    return [
      {
        fecha: resultado.fecha,
        ingresosOrdenesTrabajo: resultado.ingresos_ordenes_trabajo,
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

  return mensaje.toLowerCase().includes("no existen ingresos en el rango")
}

/**
 * GET /api/reportes/ingresos-totales?fechaInicio=DD-MM-YYYY&fechaFin=DD-MM-YYYY
 *
 * Entrega el valor total de órdenes ENTREGADAS registradas en el período. El
 * cálculo proviene de la SP; las ventas de mostrador se descartan por tratarse
 * de un reporte exclusivo de órdenes de trabajo. El frontend recibe el total
 * acumulado en ingresosOrdenesTrabajo y una serie diaria para el gráfico.
 */
export async function GET(request: Request) {
  try {
    // El permiso restringe el reporte financiero al rol Administrador.
    const { response } = await requirePermission(PERMISSIONS.REPORTS_READ)

    if (response) {
      return response
    }

    const { searchParams } = new URL(request.url)
    const rango = crearRangoFechas(
      searchParams.get("fechaInicio"),
      searchParams.get("fechaFin")
    )

    // Un formulario incompleto, una fecha inválida o un rango invertido se
    // informa con 400 para que la vista muestre el mensaje junto al filtro.
    if (esErrorDeRango(rango)) {
      return NextResponse.json(rango, { status: 400 })
    }

    // La SP consolida ventas y OTs por fecha. Usamos el cliente MariaDB porque
    // Prisma descarta filas intermedias de CALL; así se conserva todo el
    // conjunto y se consume exclusivamente ingresos_ordenes_trabajo.
    const conexion = await crearConexionReportes()
    let resultado: unknown

    try {
      resultado = await conexion.query(
        "CALL sp_reporte_ingresos_totales(?, ?)",
        [rango.fechaInicioSql, rango.fechaFinSql]
      )
    } finally {
      await conexion.end()
    }
    const series = extraerFilasIngresos(resultado)
      .map((fila) => ({
        // fecha es YYYY-MM-DD para que componentes de gráficos la ordenen sin
        // reinterpretar el formato DD-MM-YYYY que usa el formulario.
        fecha: formatearFecha(fila.fecha),
        // El valor ya está agregado por día en la SP y corresponde solo a OTs.
        ingresosOrdenesTrabajo: Number(fila.ingresosOrdenesTrabajo),
      }))
      .filter((fila) => fila.ingresosOrdenesTrabajo > 0)

    // La SP puede encontrar ventas de mostrador. Si no existen ingresos de OT,
    // el CU informa que no hay resultados para el período seleccionado. La
    // vista debe mostrar este mensaje informativo, no una gráfica vacía.
    if (series.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message:
            "No existen ingresos de órdenes de trabajo en el período ingresado",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      // Se devuelven las fechas originales para conservar el filtro que el
      // usuario seleccionó, mientras series alimenta el gráfico por día.
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin,
      ingresosOrdenesTrabajo: series.reduce(
        (total, fila) => total + fila.ingresosOrdenesTrabajo,
        0
      ),
      series,
    })
  } catch (error) {
    // La SP señaliza períodos sin ingresos. Se traduce al mismo contrato 404
    // usado cuando el resultado no contiene filas de órdenes de trabajo.
    if (esErrorSinDatos(error)) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message:
            "No existen ingresos de órdenes de trabajo en el período ingresado",
        },
        { status: 404 }
      )
    }

    console.error("[REPORTES_INGRESOS_TOTALES_GET]", error)

    // Los errores de infraestructura o de la SP no exponen detalles internos
    // al navegador; el frontend puede usar este código para mostrar un error
    // general y conservar los filtros ingresados.
    return NextResponse.json(
      {
        code: "ERROR_REPORTE_INGRESOS",
        message: "No fue posible generar el reporte de ingresos",
      },
      { status: 500 }
    )
  }
}
