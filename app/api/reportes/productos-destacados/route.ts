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

type FilaProductoDestacadoSql = {
  id_producto: number | bigint
  nombre_producto: string
  tipo_producto: string
  unidades_en_mostrador: number | string | bigint
  unidades_en_taller: number | string | bigint
  total_unidades_despachadas: number | string | bigint
  frecuencia_operaciones: number | string | bigint
  total_recaudado: number | string | bigint
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null
}

function esValorNumerico(valor: unknown): valor is number | string | bigint {
  return (
    typeof valor === "number" ||
    typeof valor === "string" ||
    typeof valor === "bigint"
  )
}

/**
 * Valida los filtros del ranking y prepara las fechas ISO que recibe la SP.
 * La respuesta conserva DD-MM-YYYY para que la vista muestre el mismo período.
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

/** El cliente MariaDB preserva todas las filas que devuelve la SP de ranking. */
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
    allowPublicKeyRetrieval: true,
    ssl: caCert ? { ca: caCert } : requiereSsl || undefined,
  })
}

function esFilaProductoDestacado(
  valor: unknown
): valor is FilaProductoDestacadoSql {
  return (
    esRegistro(valor) &&
    "id_producto" in valor &&
    "nombre_producto" in valor &&
    "tipo_producto" in valor &&
    "unidades_en_mostrador" in valor &&
    "unidades_en_taller" in valor &&
    "total_unidades_despachadas" in valor &&
    "frecuencia_operaciones" in valor &&
    "total_recaudado" in valor &&
    esValorNumerico(valor.id_producto) &&
    typeof valor.nombre_producto === "string" &&
    typeof valor.tipo_producto === "string" &&
    esValorNumerico(valor.unidades_en_mostrador) &&
    esValorNumerico(valor.unidades_en_taller) &&
    esValorNumerico(valor.total_unidades_despachadas) &&
    esValorNumerico(valor.frecuencia_operaciones) &&
    esValorNumerico(valor.total_recaudado)
  )
}

/** Descarta los metadatos de CALL y conserva el ranking ordenado de productos. */
function extraerProductos(resultado: unknown): FilaProductoDestacadoSql[] {
  if (Array.isArray(resultado)) {
    return resultado.flatMap(extraerProductos)
  }

  return esFilaProductoDestacado(resultado) ? [resultado] : []
}

function esErrorSinDatos(error: unknown) {
  const mensaje = error instanceof Error ? error.message : String(error)

  return mensaje
    .toLowerCase()
    .includes("no existen datos suficientes para el análisis")
}

/**
 * GET /api/reportes/productos-destacados?fechaInicio=DD-MM-YYYY&fechaFin=DD-MM-YYYY
 *
 * Entrega un ranking de productos vendidos en mostrador o utilizados en el
 * taller. productos sirve para una tabla o gráfico de demanda de insumos.
 */
export async function GET(request: Request) {
  try {
    // El análisis de demanda y compras está limitado al Administrador.
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

    const conexion = await crearConexionReportes()
    let resultado: unknown

    try {
      resultado = await conexion.query(
        "CALL sp_reporte_productos_destacados(?, ?)",
        [rango.fechaInicioSql, rango.fechaFinSql]
      )
    } finally {
      await conexion.end()
    }

    const productos = extraerProductos(resultado).map((producto) => ({
      idProducto: Number(producto.id_producto),
      nombreProducto: producto.nombre_producto,
      tipoProducto: producto.tipo_producto,
      // Distinguen demanda de venta directa y consumo interno del taller.
      unidadesEnMostrador: Number(producto.unidades_en_mostrador),
      unidadesEnTaller: Number(producto.unidades_en_taller),
      // La SP ya ordena esta métrica para que el primer elemento sea el líder.
      totalUnidadesDespachadas: Number(producto.total_unidades_despachadas),
      frecuenciaOperaciones: Number(producto.frecuencia_operaciones),
      totalRecaudado: Number(producto.total_recaudado),
    }))

    if (productos.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message:
            "No existen datos suficientes para el análisis en el período ingresado",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin,
      totalProductos: productos.length,
      productos,
    })
  } catch (error) {
    if (esErrorSinDatos(error)) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message:
            "No existen datos suficientes para el análisis en el período ingresado",
        },
        { status: 404 }
      )
    }

    console.error("[REPORTES_PRODUCTOS_DESTACADOS_GET]", error)

    // La vista recibe un código estable sin detalles internos de la base de datos.
    return NextResponse.json(
      {
        code: "ERROR_REPORTE_PRODUCTOS_DESTACADOS",
        message: "No fue posible generar el reporte de productos destacados",
      },
      { status: 500 }
    )
  }
}
