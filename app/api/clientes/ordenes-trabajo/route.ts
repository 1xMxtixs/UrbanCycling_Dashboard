import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

export const dynamic = "force-dynamic"

type RutValidationResult =
  | {
      valid: true
      formatted: string
      compact: string
    }
  | { valid: false; error: string }

function validarYFormatearRut(value: string): RutValidationResult {
  const rutIngresado = value.trim().toUpperCase()

  if (!rutIngresado) {
    return {
      valid: false,
      error: "Debe indicar un RUT",
    }
  }

  if (!/^[0-9.\-\sK]+$/.test(rutIngresado)) {
    return {
      valid: false,
      error: "El RUT contiene caracteres no permitidos",
    }
  }

  const rutLimpio = rutIngresado.replace(/[.\-\s]/g, "")

  if (!/^\d{7,8}[0-9K]$/.test(rutLimpio)) {
    return {
      valid: false,
      error: "El RUT debe contener entre 7 y 8 dígitos más su dígito verificador",
    }
  }

  const cuerpo = rutLimpio.slice(0, -1)
  const digitoVerificador = rutLimpio.slice(-1)
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return {
    valid: true,
    formatted: `${cuerpoFormateado}-${digitoVerificador}`,
    compact: `${cuerpo}-${digitoVerificador}`,
  }
}

function obtenerNombreCliente(cliente: {
  primerNombre: string | null
  segundoNombre: string | null
  apellidoPaterno: string | null
  apellidoMaterno: string | null
  razonSocial: string | null
}) {
  if (cliente.razonSocial) {
    return cliente.razonSocial
  }

  return [
    cliente.primerNombre,
    cliente.segundoNombre,
    cliente.apellidoPaterno,
    cliente.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ")
}

export async function GET(request: NextRequest) {
  try {
    const { response } = await requirePermission(
      PERMISSIONS.WORK_ORDERS_READ
    )

    if (response) {
      return response
    }

    const rutParametro = request.nextUrl.searchParams.get("rut")
    const resultadoRut = validarYFormatearRut(rutParametro ?? "")

    if (!resultadoRut.valid) {
      return NextResponse.json(
        {
          code: "RUT_INVALIDO",
          message: resultadoRut.error,
        },
        { status: 400 }
      )
    }

    const cliente = await db.cliente.findFirst({
      where: {
        OR: [
          { rut: resultadoRut.formatted },
          { rut: resultadoRut.compact },
        ],
      },
      select: {
        idCliente: true,
        rut: true,
        primerNombre: true,
        segundoNombre: true,
        apellidoPaterno: true,
        apellidoMaterno: true,
        razonSocial: true,
        ventas: {
          where: {
            ordenDeTrabajo: {
              isNot: null,
            },
          },
          orderBy: {
            fechaRegistro: "desc",
          },
          select: {
            idVenta: true,
            idUsuario: true,
            idCliente: true,
            fechaRegistro: true,
            ordenDeTrabajo: {
              select: {
                idOrdenDeTrabajo: true,
                estado: true,
                estadoPago: true,
                fechaEntregaEstimada: true,
                fechaEntregaReal: true,
                observacionesIngreso: true,
                montoTotal: true,
                descuentoGlobal: true,
              },
            },
          },
        },
      },
    })

    if (!cliente) {
      return NextResponse.json(
        {
          code: "CLIENTE_NO_ENCONTRADO",
          message: "No existe un cliente registrado con el RUT indicado",
        },
        { status: 404 }
      )
    }

    const ordenesDeTrabajo = cliente.ventas
      .filter((venta) => venta.ordenDeTrabajo !== null)
      .map((venta) => {
        const orden = venta.ordenDeTrabajo!

        return {
          idOrdenDeTrabajo: orden.idOrdenDeTrabajo,
          idVenta: venta.idVenta,
          idUsuario: venta.idUsuario,
          idCliente: venta.idCliente,
          fechaRecepcion: venta.fechaRegistro,
          fechaEntregaEstimada: orden.fechaEntregaEstimada,
          fechaEntregaReal: orden.fechaEntregaReal,
          observacionesIngreso: orden.observacionesIngreso,
          total: orden.montoTotal,
          descuento: orden.descuentoGlobal,
          estadoPago: orden.estadoPago,
          estadoOrden: orden.estado,
          fechaCreacion: venta.fechaRegistro,
        }
      })

    return NextResponse.json({
      cliente: {
        idCliente: cliente.idCliente,
        rut: cliente.rut,
        nombre: obtenerNombreCliente(cliente),
      },
      ordenesDeTrabajo,
    })
  } catch (error) {
    console.error("[CLIENTE_ORDENES_TRABAJO_GET]", error)

    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message: "No fue posible obtener las órdenes de trabajo del cliente",
      },
      { status: 500 }
    )
  }
}
