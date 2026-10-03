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

/** Abre una conexión exclusiva para las consultas de reportes. */
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

/** La consulta devuelve filas tipadas de operaciones con pagos del día. */
function extraerVentas(resultado: unknown): FilaVentaDiariaSql[] {
  if (Array.isArray(resultado)) {
    return resultado.flatMap(extraerVentas)
  }

  return esFilaVentaDiaria(resultado) ? [resultado] : []
}

const CONSULTA_INGRESOS_DIARIOS = `
  SELECT
    v.id_venta,
    TIME(MIN(p.fecha_registro)) AS hora_registro,
    CASE
      WHEN vm.id_venta_en_mostrador IS NOT NULL THEN 'Venta Mostrador'
      WHEN ot.id_orden_de_trabajo IS NOT NULL THEN 'Orden de Trabajo'
      ELSE 'Otro'
    END AS tipo_operacion,
    COALESCE(ot.id_orden_de_trabajo, vm.id_venta_en_mostrador) AS identificador_operacion,
    COALESCE(CONCAT(c.primer_nombre, ' ', c.apellido_paterno), c.razon_social, 'Cliente General') AS cliente,
    v.estado_pago,
    SUM(ap.monto_asociado) AS monto_total_venta
  FROM pagos p
  INNER JOIN asignaciones_pago ap ON ap.id_pago = p.id_pago
  INNER JOIN ventas v ON v.id_venta = ap.id_venta
  LEFT JOIN ventas_en_mostrador vm ON vm.id_venta = v.id_venta
  LEFT JOIN ordenes_de_trabajo ot ON ot.id_venta = v.id_venta
  LEFT JOIN clientes c ON c.id_cliente = v.id_cliente
  WHERE p.estado = 'COMPLETADO'
    AND p.fecha_registro >= ?
    AND p.fecha_registro < DATE_ADD(?, INTERVAL 1 DAY)
    AND (
      (vm.id_venta_en_mostrador IS NOT NULL AND vm.estado = 'COMPLETADA')
      OR
      (ot.id_orden_de_trabajo IS NOT NULL AND ot.estado = 'ENTREGADO')
    )
  GROUP BY
    v.id_venta,
    vm.id_venta_en_mostrador,
    ot.id_orden_de_trabajo,
    c.primer_nombre,
    c.apellido_paterno,
    c.razon_social,
    v.estado_pago
  ORDER BY MIN(p.fecha_registro) ASC
`

/**
 * GET /api/ventas/reporte-diario?fecha=DD-MM-YYYY
 *
 * Devuelve el detalle auditable de los pagos recibidos en ventas directas y OTs
 * entregadas. La fecha y el monto provienen del pago, no de la creación de la
 * venta, para incluir OTs creadas en jornadas anteriores y pagadas hoy.
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
      resultado = await conexion.query(CONSULTA_INGRESOS_DIARIOS, [
        fecha.fechaSql,
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
