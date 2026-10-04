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

/**
 * Contrato de salida de sp_reporte_diario_ventas. Cada fila representa una
 * asignación de pago aplicada a una venta directa o a una orden de trabajo.
 */
type FilaIngresoDiarioSql = {
  id_pago: number | bigint
  id_asignacion_pago: number | bigint
  id_venta: number | bigint
  hora_pago: string
  metodo_pago: string
  monto_ingresado: number | string | bigint
  tipo_operacion: string
  identificador_operacion: number | bigint
  cliente: string
  estado_pago_venta: string
  monto_total_operacion: number | string | bigint
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

function esFilaIngresoDiario(valor: unknown): valor is FilaIngresoDiarioSql {
  return (
    esRegistro(valor) &&
    "id_pago" in valor &&
    "id_asignacion_pago" in valor &&
    "id_venta" in valor &&
    "hora_pago" in valor &&
    "metodo_pago" in valor &&
    "monto_ingresado" in valor &&
    "tipo_operacion" in valor &&
    "identificador_operacion" in valor &&
    "cliente" in valor &&
    "estado_pago_venta" in valor &&
    "monto_total_operacion" in valor &&
    esValorNumerico(valor.id_pago) &&
    esValorNumerico(valor.id_asignacion_pago) &&
    esValorNumerico(valor.id_venta) &&
    typeof valor.hora_pago === "string" &&
    typeof valor.metodo_pago === "string" &&
    esValorNumerico(valor.monto_ingresado) &&
    typeof valor.tipo_operacion === "string" &&
    esValorNumerico(valor.identificador_operacion) &&
    typeof valor.cliente === "string" &&
    typeof valor.estado_pago_venta === "string" &&
    esValorNumerico(valor.monto_total_operacion)
  )
}

/** El driver adjunta metadatos a CALL; solo se retienen las filas de ingresos. */
function extraerIngresos(resultado: unknown): FilaIngresoDiarioSql[] {
  if (Array.isArray(resultado)) {
    return resultado.flatMap(extraerIngresos)
  }

  return esFilaIngresoDiario(resultado) ? [resultado] : []
}

function esErrorSinIngresos(error: unknown) {
  const mensaje = error instanceof Error ? error.message : String(error)
  const mensajeNormalizado = mensaje.toLowerCase()

  // Se mantiene el literal histórico mientras la base local termine de migrar.
  return (
    mensajeNormalizado.includes("no se registraron ingresos") ||
    mensajeNormalizado.includes("no se registraron ventas")
  )
}

/**
 * GET /api/ventas/reporte-diario?fecha=DD-MM-YYYY
 *
 * Devuelve el detalle auditable de cada pago aplicado a ventas directas y OTs.
 * El total se calcula con montoIngresado para no repetir el total de una misma
 * operación cuando recibe abonos o pagos en cuotas.
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

    const ingresos = extraerIngresos(resultado).map((ingreso) => ({
      idPago: Number(ingreso.id_pago),
      idAsignacionPago: Number(ingreso.id_asignacion_pago),
      idVenta: Number(ingreso.id_venta),
      horaPago: ingreso.hora_pago,
      metodoPago: ingreso.metodo_pago,
      montoIngresado: Number(ingreso.monto_ingresado),
      tipoOperacion: ingreso.tipo_operacion,
      identificadorOperacion: Number(ingreso.identificador_operacion),
      cliente: ingreso.cliente,
      estadoPago: ingreso.estado_pago_venta,
      montoTotalOperacion: Number(ingreso.monto_total_operacion),
      // Aliases de transición para el dashboard existente: el monto mostrado
      // ahora es el ingreso registrado durante la jornada, no el total histórico.
      horaRegistro: ingreso.hora_pago,
      montoTotalVenta: Number(ingreso.monto_ingresado),
    }))

    if (ingresos.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message: "No se registraron ingresos en la jornada seleccionada",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      fecha: fecha.fecha,
      totalIngresos: ingresos.reduce(
        (total, ingreso) => total + ingreso.montoIngresado,
        0
      ),
      cantidadIngresos: ingresos.length,
      // Conservado para clientes que ya consumen este indicador.
      cantidadVentas: new Set(ingresos.map((ingreso) => ingreso.idVenta)).size,
      ventas: ingresos,
    })
  } catch (error) {
    if (esErrorSinIngresos(error)) {
      return NextResponse.json(
        {
          code: "SIN_DATOS_REPORTE",
          message: "No se registraron ingresos en la jornada seleccionada",
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
