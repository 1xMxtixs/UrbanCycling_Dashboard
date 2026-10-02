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

type FilaConsumoInsumosSql = {
  id_producto: number | bigint
  nombre_producto: string
  tipo_producto: string
  cantidad_total_utilizada: number | string | bigint
  total_ordenes_asociadas: number | string | bigint
  ordenes_asociadas: string | null
  costo_total_consumo: number | string | bigint
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null
}

/**
 * Valida las fechas del filtro. La SP recibe ISO, mientras el frontend mantiene
 * DD-MM-YYYY para mostrar exactamente el período seleccionado por el usuario.
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

    return { fecha, fechaSql: `${partes[3]}-${partes[2]}-${partes[1]}` }
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
 * Ejecuta SPs que devuelven varias filas. El adaptador Prisma/MariaDB conserva
 * solo la última fila de un CALL, mientras este cliente entrega el informe completo.
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

function esFilaConsumo(valor: unknown): valor is FilaConsumoInsumosSql {
  return (
    esRegistro(valor) &&
    "id_producto" in valor &&
    "nombre_producto" in valor &&
    "tipo_producto" in valor &&
    "cantidad_total_utilizada" in valor &&
    "total_ordenes_asociadas" in valor &&
    "ordenes_asociadas" in valor &&
    "costo_total_consumo" in valor &&
    esValorNumerico(valor.id_producto) &&
    typeof valor.nombre_producto === "string" &&
    typeof valor.tipo_producto === "string" &&
    esValorNumerico(valor.cantidad_total_utilizada) &&
    esValorNumerico(valor.total_ordenes_asociadas) &&
    (typeof valor.ordenes_asociadas === "string" ||
      valor.ordenes_asociadas === null) &&
    esValorNumerico(valor.costo_total_consumo)
  )
}

/** Descarta metadatos de CALL y conserva solamente las filas del informe. */
function extraerFilasConsumo(resultado: unknown): FilaConsumoInsumosSql[] {
  if (Array.isArray(resultado)) {
    return resultado.flatMap(extraerFilasConsumo)
  }

  return esFilaConsumo(resultado) ? [resultado] : []
}

/** Convierte el GROUP_CONCAT de la SP en IDs listos para enlaces de detalle. */
function convertirOrdenesAsociadas(ordenes: string | null) {
  if (!ordenes) {
    return []
  }

  return ordenes
    .split(",")
    .map((orden) => Number(orden.trim()))
    .filter(Number.isInteger)
}

function esErrorSinDatos(error: unknown) {
  const mensaje = error instanceof Error ? error.message : String(error)

  return mensaje.toLowerCase().includes("no existen registros de consumo")
}

/**
 * GET /api/reportes/consumo-insumos?fechaInicio=DD-MM-YYYY&fechaFin=DD-MM-YYYY
 *
 * Devuelve los productos usados en OTs ENTREGADAS dentro del rango de fecha de
 * entrega real. insumos sirve para la tabla; costoTotalConsumo para el KPI.
 */
export async function GET(request: Request) {
  try {
    // Solo Administradores con reports:read pueden consultar este informe.
    const { response } = await requirePermission(PERMISSIONS.REPORTS_READ)

    if (response) {
      return response
    }

    const { searchParams } = new URL(request.url)
    const rango = crearRangoFechas(
      searchParams.get("fechaInicio"),
      searchParams.get("fechaFin")
    )

    // La vista puede asociar este 400 directamente a sus campos de fechas.
    if (esErrorDeRango(rango)) {
      return NextResponse.json(rango, { status: 400 })
    }

    const conexion = await crearConexionReportes()
    let resultado: unknown

    try {
      resultado = await conexion.query(
        "CALL sp_reporte_consumo_insumos(?, ?)",
        [rango.fechaInicioSql, rango.fechaFinSql]
      )
    } finally {
      await conexion.end()
    }

    const insumos = extraerFilasConsumo(resultado).map((fila) => ({
      idProducto: Number(fila.id_producto),
      nombreProducto: fila.nombre_producto,
      tipoProducto: fila.tipo_producto,
      cantidadTotalUtilizada: Number(fila.cantidad_total_utilizada),
      totalOrdenesAsociadas: Number(fila.total_ordenes_asociadas),
      ordenesAsociadas: convertirOrdenesAsociadas(fila.ordenes_asociadas),
      costoTotalConsumo: Number(fila.costo_total_consumo),
    }))

    // La SP también informa esta situación mediante SIGNAL; esta protección
    // mantiene el contrato si el procedimiento devolviera una lista vacía.
    if (insumos.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message:
            "No existen registros de consumo de insumos en el período especificado",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin,
      totalProductosConsumidos: insumos.length,
      costoTotalConsumo: insumos.reduce(
        (total, insumo) => total + insumo.costoTotalConsumo,
        0
      ),
      insumos,
    })
  } catch (error) {
    if (esErrorSinDatos(error)) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message:
            "No existen registros de consumo de insumos en el período especificado",
        },
        { status: 404 }
      )
    }

    console.error("[REPORTES_CONSUMO_INSUMOS_GET]", error)

    // El frontend recibe un código estable sin exponer detalles del servidor.
    return NextResponse.json(
      {
        code: "ERROR_REPORTE_CONSUMO",
        message: "No fue posible generar el reporte de consumo de insumos",
      },
      { status: 500 }
    )
  }
}
