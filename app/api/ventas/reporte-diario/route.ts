import { NextResponse } from "next/server"
import * as mariadb from "mariadb"

import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

const FORMATO_DD_MM_YYYY = /^(\d{2})-(\d{2})-(\d{4})$/
const FORMATO_YYYY_MM_DD = /^(\d{4})-(\d{2})-(\d{2})$/

type FechaReporte = {
  fecha: string
  fechaSql: string
}

type FilaVentaDiariaSql = {
  id_venta: number | bigint
  hora_registro: string
  tipo_operacion: string
  identificador_operacion: number | bigint
  cliente: string
  estado_pago: string
  monto_total_venta: number | string | bigint
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

function fechaActual() {
  const fecha = new Date()
  return `${String(fecha.getDate()).padStart(2, "0")}-${String(
    fecha.getMonth() + 1
  ).padStart(2, "0")}-${fecha.getFullYear()}`
}

/**
 * Acepta DD-MM-YYYY para los formularios nuevos y YYYY-MM-DD para no romper
 * consumidores del endpoint anterior. La respuesta siempre conserva DD-MM-YYYY.
 */
function obtenerFecha(
  fecha: string | null
): FechaReporte | { message: string } {
  const valor = fecha ?? fechaActual()
  const partes = FORMATO_DD_MM_YYYY.exec(valor)
  const partesIso = FORMATO_YYYY_MM_DD.exec(valor)
  const dia = Number(partes?.[1] ?? partesIso?.[3])
  const mes = Number(partes?.[2] ?? partesIso?.[2])
  const anio = Number(partes?.[3] ?? partesIso?.[1])

  if (!partes && !partesIso) {
    return { message: "La fecha debe tener formato DD-MM-YYYY" }
  }

  const fechaValidada = new Date(Date.UTC(anio, mes - 1, dia))

  if (
    anio < 1000 ||
    fechaValidada.getUTCFullYear() !== anio ||
    fechaValidada.getUTCMonth() !== mes - 1 ||
    fechaValidada.getUTCDate() !== dia
  ) {
    return { message: "Debe ingresar una fecha válida en formato DD-MM-YYYY" }
  }

  const diaFormateado = String(dia).padStart(2, "0")
  const mesFormateado = String(mes).padStart(2, "0")

  return {
    fecha: `${diaFormateado}-${mesFormateado}-${anio}`,
    fechaSql: `${anio}-${mesFormateado}-${diaFormateado}`,
  }
}

function esErrorFecha(
  fecha: FechaReporte | { message: string }
): fecha is { message: string } {
  return "message" in fecha
}

/** Ejecuta la SP detallada y conserva cada venta que devuelve el procedimiento. */
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

function esFilaVentaDiaria(valor: unknown): valor is FilaVentaDiariaSql {
  return (
    esRegistro(valor) &&
    "id_venta" in valor &&
    "hora_registro" in valor &&
    "tipo_operacion" in valor &&
    "identificador_operacion" in valor &&
    "cliente" in valor &&
    "estado_pago" in valor &&
    "monto_total_venta" in valor &&
    esValorNumerico(valor.id_venta) &&
    typeof valor.hora_registro === "string" &&
    typeof valor.tipo_operacion === "string" &&
    esValorNumerico(valor.identificador_operacion) &&
    typeof valor.cliente === "string" &&
    typeof valor.estado_pago === "string" &&
    esValorNumerico(valor.monto_total_venta)
  )
}

/** El driver adjunta metadatos a CALL; solo se retienen filas de ventas. */
function extraerVentas(resultado: unknown): FilaVentaDiariaSql[] {
  if (Array.isArray(resultado)) {
    return resultado.flatMap(extraerVentas)
  }

  return esFilaVentaDiaria(resultado) ? [resultado] : []
}

function esErrorSinVentas(error: unknown) {
  const mensaje = error instanceof Error ? error.message : String(error)

  return mensaje.toLowerCase().includes("no se registraron ventas")
}

/**
 * GET /api/ventas/reporte-diario?fecha=DD-MM-YYYY
 *
 * Devuelve el detalle auditable de las ventas y OTs entregadas del día. ventas
 * alimenta la tabla; totalIngresos y cantidadVentas alimentan los indicadores.
 */
export async function GET(request: Request) {
  try {
    // Solo Administradores con reports:read pueden revisar el cierre diario.
    const { response } = await requirePermission(PERMISSIONS.REPORTS_READ)

    if (response) {
      return response
    }

    const { searchParams } = new URL(request.url)
    const fecha = obtenerFecha(searchParams.get("fecha"))

    if (esErrorFecha(fecha)) {
      return NextResponse.json(
        { code: "FECHA_INVALIDA", message: fecha.message },
        { status: 400 }
      )
    }

    const conexion = await crearConexionReportes()
    let resultado: unknown

    try {
      resultado = await conexion.query("CALL sp_reporte_diario_ventas(?)", [
        fecha.fechaSql,
      ])
    } finally {
      await conexion.end()
    }

    const ventas = extraerVentas(resultado).map((venta) => ({
      idVenta: Number(venta.id_venta),
      horaRegistro: venta.hora_registro,
      // Permite que la vista diferencie una venta directa de una OT entregada.
      tipoOperacion: venta.tipo_operacion,
      identificadorOperacion: Number(venta.identificador_operacion),
      cliente: venta.cliente,
      estadoPago: venta.estado_pago,
      montoTotalVenta: Number(venta.monto_total_venta),
    }))

    if (ventas.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message: "No se registraron ventas en la jornada seleccionada",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      fecha: fecha.fecha,
      totalIngresos: ventas.reduce(
        (total, venta) => total + venta.montoTotalVenta,
        0
      ),
      cantidadVentas: ventas.length,
      ventas,
    })
  } catch (error) {
    if (esErrorSinVentas(error)) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message: "No se registraron ventas en la jornada seleccionada",
        },
        { status: 404 }
      )
    }

    console.error("[VENTAS_REPORTE_DIARIO_GET]", error)

    // No se exponen detalles de la conexión o de la SP al navegador.
    return NextResponse.json(
      {
        code: "ERROR_REPORTE_DIARIO",
        message: "No fue posible generar el reporte diario de ingresos",
      },
      { status: 500 }
    )
  }
}
