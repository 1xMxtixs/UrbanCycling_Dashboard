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

type FilaMetodoPagoSql = {
  codigo_metodo_pago: string
  nombre_metodo_pago: string
  cantidad_transacciones: number | string | bigint
  monto_total_recaudado: number | string | bigint
}

function esRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null
}

/**
 * Mantiene DD-MM-YYYY para los filtros visuales y prepara YYYY-MM-DD para la
 * SP, validando fechas reales y el orden cronológico del período solicitado.
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
 * Ejecuta la consulta agrupada del reporte. Se usa el cliente MariaDB para
 * consultar asignaciones y evitar mezclar pagos de compras con pagos de ventas.
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

function esFilaMetodoPago(valor: unknown): valor is FilaMetodoPagoSql {
  return (
    esRegistro(valor) &&
    "codigo_metodo_pago" in valor &&
    "nombre_metodo_pago" in valor &&
    "cantidad_transacciones" in valor &&
    "monto_total_recaudado" in valor &&
    typeof valor.codigo_metodo_pago === "string" &&
    typeof valor.nombre_metodo_pago === "string" &&
    esValorNumerico(valor.cantidad_transacciones) &&
    esValorNumerico(valor.monto_total_recaudado)
  )
}

/** Conserva las filas estadísticas devueltas por la consulta agrupada. */
function extraerFilasMetodos(resultado: unknown): FilaMetodoPagoSql[] {
  if (Array.isArray(resultado)) {
    return resultado.flatMap(extraerFilasMetodos)
  }

  return esFilaMetodoPago(resultado) ? [resultado] : []
}
/**
 * GET /api/reportes/metodos-pago?fechaInicio=DD-MM-YYYY&fechaFin=DD-MM-YYYY
 *
 * Entrega el monto y porcentaje de pagos asignados a ventas. metodos alimenta
 * gráficos circulares o de barras; los totales alimentan indicadores de la vista.
 */
export async function GET(request: Request) {
  try {
    // El reporte financiero se limita a Administradores con reports:read.
    const { response } = await requirePermission(PERMISSIONS.REPORTS_READ)

    if (response) {
      return response
    }

    const { searchParams } = new URL(request.url)
    const rango = crearRangoFechas(
      searchParams.get("fechaInicio"),
      searchParams.get("fechaFin")
    )

    // La interfaz puede mostrar el código y mensaje 400 junto a los filtros.
    if (esErrorDeRango(rango)) {
      return NextResponse.json(rango, { status: 400 })
    }

    const conexion = await crearConexionReportes()
    let resultado: unknown

    try {
      // Un pago puede estar asociado a una venta o a una orden de compra. Se
      // filtran asignaciones con id_venta para que el gráfico represente solo
      // ingresos por ventas, sin alterar la SP compartida de métodos de pago.
      resultado = await conexion.query(
        `
          SELECT
            mp.codigo AS codigo_metodo_pago,
            mp.nombre AS nombre_metodo_pago,
            COUNT(DISTINCT p.id_pago) AS cantidad_transacciones,
            SUM(ap.monto_asociado) AS monto_total_recaudado
          FROM pagos p
          INNER JOIN asignaciones_pago ap ON ap.id_pago = p.id_pago
          INNER JOIN ventas v ON v.id_venta = ap.id_venta
          INNER JOIN metodos_pago mp ON mp.codigo = p.metodo_pago
          WHERE p.estado = 'COMPLETADO'
            AND ap.id_venta IS NOT NULL
            AND ap.id_orden_de_compra IS NULL
            AND p.fecha_registro >= ?
            AND p.fecha_registro < DATE_ADD(?, INTERVAL 1 DAY)
          GROUP BY mp.codigo, mp.nombre
          ORDER BY monto_total_recaudado DESC
        `,
        [rango.fechaInicioSql, rango.fechaFinSql]
      )
    } finally {
      await conexion.end()
    }

    const metodosSinPorcentaje = extraerFilasMetodos(resultado).map((fila) => ({
      // El código es estable para colores, filtros o claves de cada segmento.
      codigoMetodoPago: fila.codigo_metodo_pago,
      nombreMetodoPago: fila.nombre_metodo_pago,
      cantidadTransacciones: Number(fila.cantidad_transacciones),
      montoTotalRecaudado: Number(fila.monto_total_recaudado),
    }))

    if (metodosSinPorcentaje.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message: "No existen pagos registrados en el rango especificado",
        },
        { status: 404 }
      )
    }

    const totalRecaudado = metodosSinPorcentaje.reduce(
      (total, metodo) => total + metodo.montoTotalRecaudado,
      0
    )
    const metodos = metodosSinPorcentaje.map((metodo) => ({
      ...metodo,
      // El porcentaje se calcula con el mismo total que recibe el gráfico,
      // evitando redondeos o pagos de compras que no pertenecen al reporte.
      porcentajeDelTotal: Number(
        ((metodo.montoTotalRecaudado / totalRecaudado) * 100).toFixed(2)
      ),
    }))

    return NextResponse.json({
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin,
      totalRecaudado,
      totalTransacciones: metodosSinPorcentaje.reduce(
        (total, metodo) => total + metodo.cantidadTransacciones,
        0
      ),
      metodos,
    })
  } catch (error) {
    console.error("[REPORTES_METODOS_PAGO_GET]", error)

    // No se filtran detalles internos al navegador ante una falla inesperada.
    return NextResponse.json(
      {
        code: "ERROR_REPORTE_METODOS_PAGO",
        message: "No fue posible generar el reporte por métodos de pago",
      },
      { status: 500 }
    )
  }
}
