// Cambio de estado referencial para punto de venta.
// A falta de tabla punto_venta, actualiza estado de venta u orden segun el ID:
// - venta-12
// - orden-8
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { ESTADOS_OT_DISPONIBLES, estadoOrdenInclude, resolverEstadoOt, resolverEstadoPago, resolverEstadoVenta, respuestaInvalida } from "@/lib/point-of-sale-status"
import { requirePermission } from "@/lib/require-permission"
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit"
import { EstadoPago, EstadoPagoVenta, EstadoRegistro, Prisma } from "@/generated/prisma"
import { ESTADO_OT, ESTADOS_OT_CERRADOS, ESTADOS_OT_FINALIZADOS, TRANSICIONES_OT, type EstadoOt } from "@/lib/work-order-status"
import { NextResponse } from "next/server"

const prisma = db

function parseIdPuntoVenta(idPuntoVenta: string) {
  const [tipo, id] = idPuntoVenta.split("-")
  const parsedId = Number(id)

  if (
    !["venta", "orden"].includes(tipo) ||
    !Number.isInteger(parsedId) ||
    parsedId <= 0
  ) {
    return null
  }

  return {
    tipo,
    id: parsedId,
  }
}

function sanitizarUsuario(usuario: any) {
  if (!usuario) {
    return usuario
  }

  const {
    contrasena,
    contrasenaHash,
    contrasena_hash,
    password,
    ...usuarioSeguro
  } = usuario

  return usuarioSeguro
}

function sanitizarActores<T extends { usuario?: any; mecanico?: any }>(
  data: T
) {
  return {
    ...data,
    usuario: sanitizarUsuario(data.usuario),
    mecanico: sanitizarUsuario(data.mecanico),
  }
}

function adaptarVenta(venta: any) {
  const ventaSegura = sanitizarActores(venta)
  const ventaEnMostrador = ventaSegura.ventaEnMostrador ?? {}

  return {
    ...ventaSegura,
    ...ventaEnMostrador,
    idVenta: ventaSegura.idVenta,
    idUsuario: ventaSegura.idUsuario,
    idCliente: ventaSegura.idCliente,
    fechaCreacion: ventaSegura.fechaRegistro,
    total: ventaEnMostrador.montoTotal,
    descuento: ventaEnMostrador.descuentoGlobal,
    montoTotal: ventaEnMostrador.montoTotal,
    descuentoGlobal: ventaEnMostrador.descuentoGlobal,
    estadoVenta: ventaEnMostrador.estado,
    estadoPago: ventaSegura.estadoPago,
    fechaRegistro: ventaSegura.fechaRegistro,
  }
}

function adaptarOrdenTrabajo(ordenTrabajo: any) {
  const ordenTrabajoSegura = sanitizarActores(ordenTrabajo)

  return {
    ...ordenTrabajoSegura,
    total: ordenTrabajoSegura.montoTotal,
    descuento: ordenTrabajoSegura.descuentoGlobal,
    codigoEstadoOrden: ordenTrabajoSegura.estado,
    estadoOrden:
      ordenTrabajoSegura.estadoOrden?.nombre ?? ordenTrabajoSegura.estado,
    fechaCreacion: ordenTrabajoSegura.venta?.fechaRegistro,
    fechaRegistro: ordenTrabajoSegura.venta?.fechaRegistro,
    fechaRecepcion: ordenTrabajoSegura.venta?.fechaRegistro,
    usuario: sanitizarUsuario(ordenTrabajoSegura.venta?.usuario),
    cliente: ordenTrabajoSegura.venta?.cliente,
  }
}

/**
 * PATCH /api/punto-venta/:idPuntoVenta/estado
 * Ejecuta transiciones de estado de una venta u OT. Acepta IDs venta-N u
 * orden-N, valida la transición y actualiza el estado financiero en Venta.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ idPuntoVenta: string }> }
) {
  try {
    const { idPuntoVenta } = await params
    const parsed = parseIdPuntoVenta(idPuntoVenta)

    if (!parsed) {
      return NextResponse.json(
        {
          code: "ID_PUNTO_VENTA_INVALIDO",
          message: "Use un identificador referencial como venta-1 u orden-1",
        },
        { status: 400 }
      )
    }

    const requiredPermission =
      parsed.tipo === "venta"
        ? PERMISSIONS.SALES_CREATE
        : PERMISSIONS.WORK_ORDERS_UPDATE_STATUS
    const { session, response } = await requirePermission(requiredPermission)

    if (response || !session) {
      return response
    }

    const data = await req.json()
    const estadoPagoInput = data.estado_pago ?? data.estadoPago
    const estadoPago = estadoPagoInput
      ? resolverEstadoPago(estadoPagoInput)
      : null
    const metodoPagoInput = data.metodo_pago ?? data.metodoPago
    const metodoPago = metodoPagoInput
      ? String(metodoPagoInput).trim().toUpperCase()
      : null
    const montoPago = data.monto_pagado ?? data.montoPagado ?? data.monto

    if (estadoPagoInput && !estadoPago) {
      return respuestaInvalida("ESTADO_PAGO_INVALIDO", "Estado de pago inválido")
    }

    if (metodoPago) {
      // La FK de Pago utiliza el código de un método activo del catálogo.
      const metodoRegistrado = await prisma.metodoPago.findUnique({
        where: { codigo: metodoPago },
        select: { estado: true },
      })

      if (
        !metodoRegistrado ||
        metodoRegistrado.estado !== EstadoRegistro.ACTIVO
      ) {
        return respuestaInvalida("METODO_PAGO_INVALIDO", "Método de pago inválido")
      }
    }

    if (parsed.tipo === "venta") {
      const estadoVentaInput =
        data.estado_venta ?? data.estadoVenta ?? data.estado
      const estadoVenta = estadoVentaInput
        ? resolverEstadoVenta(estadoVentaInput)
        : null

      if (estadoVentaInput && !estadoVenta) {
        return respuestaInvalida("ESTADO_VENTA_INVALIDO", "Estado de venta inválido")
      }

      if (!estadoVenta && !estadoPago) {
        return NextResponse.json(
          {
            code: "FALTA_ESTADO",
            message: "Debe indicar estadoVenta o estadoPago",
          },
          { status: 400 }
        )
      }

      if (estadoPago === EstadoPagoVenta.PAGADA && metodoPago) {
        const resultado = await prisma.$transaction(
          async (tx: Prisma.TransactionClient) => {
            const ventaObj = await tx.venta.findUnique({
              where: { idVenta: parsed.id },
              include: {
                asignacionesPago: {
                  select: { montoAsociado: true },
                },
                ventaEnMostrador: true,
              },
            })

            if (!ventaObj?.ventaEnMostrador) {
              throw new Error("VENTA_NO_EXISTE")
            }

            const totalVenta = Number(ventaObj.ventaEnMostrador.montoTotal)
            const totalPagado = ventaObj.asignacionesPago.reduce(
              (total, asignacion) => total + Number(asignacion.montoAsociado),
              0
            )
            const saldoPendiente = Math.max(0, totalVenta - totalPagado)
            let nuevoPago: Awaited<ReturnType<typeof tx.pago.create>> | null =
              null

            if (saldoPendiente > 0) {
              nuevoPago = await tx.pago.create({
                data: {
                  idUsuario: ventaObj.idUsuario,
                  fechaRegistro: new Date(),
                  estado: EstadoPago.COMPLETADO,
                  metodoPago,
                  monto: saldoPendiente,
                },
              })

              // Toda asignación financiera referencia la Venta raíz.
              await tx.asignacionPago.create({
                data: {
                  idPago: nuevoPago.idPago,
                  idVenta: ventaObj.idVenta,
                  idOrdenDeCompra: null,
                  montoAsociado: saldoPendiente,
                  tipoAbono: "pago_total",
                },
              })
            }

            const ventaActualizada = await tx.venta.update({
              where: {
                idVenta: parsed.id,
              },
              data: {
                estadoPago: EstadoPagoVenta.PAGADA,
                ventaEnMostrador: {
                  update: {
                    estado: estadoVenta ?? undefined,
                  },
                },
              },
              include: {
                usuario: true,
                cliente: true,
                ventaEnMostrador: true,
              },
            })

            return { pago: nuevoPago, venta: ventaActualizada }
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        )

        return NextResponse.json({
          idPuntoVenta,
          tipoOperacion: "venta",
          venta: adaptarVenta(resultado.venta),
          pago: resultado.pago,
        })
      }

      const ventaActualizada = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          return tx.venta.update({
            where: {
              idVenta: parsed.id,
            },
            data: {
              // El subtipo conserva su estado operativo; Venta conserva el financiero.
              estadoPago: estadoPago ?? undefined,
              ventaEnMostrador: estadoVenta
                ? { update: { estado: estadoVenta } }
                : undefined,
            },
            include: {
              usuario: true,
              cliente: true,
              ventaEnMostrador: true,
            },
          })
        }
      )

      return NextResponse.json({
        idPuntoVenta,
        tipoOperacion: "venta",
        venta: adaptarVenta(ventaActualizada),
        pago: null,
      })
    }

    const estadoOrdenInput = data.estado_orden ?? data.estadoOrden ?? data.estado
    const estadoOrden = estadoOrdenInput
      ? resolverEstadoOt(estadoOrdenInput)
      : null

    if (estadoOrdenInput && !estadoOrden) {
      return respuestaInvalida(
        "ESTADO_ORDEN_INVALIDO",
        `Use uno de estos códigos: ${ESTADOS_OT_DISPONIBLES.join(", ")}`
      )
    }

    if (!estadoOrden && !estadoPago) {
      return NextResponse.json(
        {
          code: "FALTA_ESTADO",
          message: "Debe indicar estadoOrden o estadoPago",
        },
        { status: 400 }
      )
    }

    const ordenTrabajo = await prisma.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo: parsed.id,
      },
      include: {
        venta: {
          include: {
            asignacionesPago: true,
          },
        },
      },
    })

    if (!ordenTrabajo) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden no existe",
        },
        { status: 404 }
      )
    }

    if (estadoOrden) {
      // La anulación se permite desde cualquier estado abierto; el resto sigue la matriz común.
      if (estadoOrden === ESTADO_OT.ANULADA) {
        if (
          ESTADOS_OT_CERRADOS.some(
            (estadoCerrado) => estadoCerrado === ordenTrabajo.estado
          )
        ) {
          return NextResponse.json(
            {
              code: "ANULACION_NO_PERMITIDA",
              message: "La orden ya se encuentra Entregada o Anulada",
            },
            { status: 409 }
          )
        }
      } else {
        const estadosSiguientes =
          TRANSICIONES_OT[ordenTrabajo.estado as EstadoOt] ?? []

        if (!estadosSiguientes.some((estado) => estado === estadoOrden)) {
          return NextResponse.json(
            {
              code: "CAMBIO_ESTADO_NO_PERMITIDO",
              message: `No se puede cambiar una orden desde "${ordenTrabajo.estado}" a "${estadoOrden}"`,
            },
            { status: 409 }
          )
        }
      }
    }

    let finalEstadoPago = estadoPago
    const totalOrden = Number(ordenTrabajo.montoTotal)
    const totalPagadoPrev =
      ordenTrabajo.venta?.asignacionesPago?.reduce(
        (sum: number, ap: { montoAsociado: unknown }) =>
          sum + Number(ap.montoAsociado),
        0
      ) ?? 0
    const saldoPendiente = Math.max(0, totalOrden - totalPagadoPrev)
    const montoAPagar =
      montoPago !== undefined && montoPago !== null
        ? Number(montoPago)
        : saldoPendiente

    if (metodoPago && (!Number.isFinite(montoAPagar) || montoAPagar <= 0)) {
      return respuestaInvalida("MONTO_PAGO_INVALIDO", "Monto de pago inválido")
    }

    if (metodoPago) {
      finalEstadoPago =
        totalPagadoPrev + montoAPagar >= totalOrden
          ? EstadoPagoVenta.PAGADA
          : EstadoPagoVenta.PARCIAL
    }

    const resultado = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        let nuevoPago: Awaited<ReturnType<typeof tx.pago.create>> | null = null

        if (metodoPago && montoAPagar > 0) {
          nuevoPago = await tx.pago.create({
            data: {
              idUsuario: ordenTrabajo.venta.idUsuario,
              fechaRegistro: new Date(),
              estado: EstadoPago.COMPLETADO,
              metodoPago,
              monto: montoAPagar,
            },
          })

          const isFullPayment = totalPagadoPrev + montoAPagar >= totalOrden

          await tx.asignacionPago.create({
            data: {
              idPago: nuevoPago.idPago,
              idVenta: ordenTrabajo.venta.idVenta,
              idOrdenDeCompra: null,
              montoAsociado: montoAPagar,
              tipoAbono: isFullPayment ? "pago_total" : "abono",
            },
          })
        }

        if (finalEstadoPago) {
          // Venta es la única fuente del estado financiero de la operación.
          await tx.venta.update({
            where: { idVenta: ordenTrabajo.venta.idVenta },
            data: { estadoPago: finalEstadoPago },
          })
        }

        const ordenActualizada = await tx.ordenDeTrabajo.update({
          where: {
            idOrdenDeTrabajo: parsed.id,
          },
          data: {
            estado: estadoOrden ?? undefined,
            fechaEntregaReal:
              estadoOrden &&
              ESTADOS_OT_FINALIZADOS.some(
                (estadoFinalizado) => estadoFinalizado === estadoOrden
              )
                ? new Date()
                : undefined,
          },
          include: {
            venta: {
              include: {
                usuario: true,
                cliente: true,
                asignacionesPago: {
                  include: {
                    pago: true,
                  },
                },
              },
            },
            mecanico: true,
            estadoOrden: estadoOrdenInclude,
          },
        })

        if (estadoOrden) {
          await registrarAuditoriaOrdenTrabajo(tx, {
            idUsuario: session.user.idUsuario,
            tipoOperacion:
              estadoOrden === ESTADO_OT.ANULADA
                ? "anulacion_orden"
                : "cambio_estado",
            idOrdenDeTrabajo: parsed.id,
            valorAnterior: {
              estado: ordenTrabajo.estado,
              estadoPago: ordenTrabajo.venta.estadoPago,
              fechaEntregaReal: ordenTrabajo.fechaEntregaReal,
            },
            valorNuevo: {
              estado: ordenActualizada.estado,
              estadoPago: ordenActualizada.venta.estadoPago,
              fechaEntregaReal: ordenActualizada.fechaEntregaReal,
            },
            detalleCambio:
              estadoOrden === ESTADO_OT.ANULADA
                ? "Anulacion de orden de trabajo"
                : `Cambio de estado de orden a ${estadoOrden}`,
          })
        }

        return { orden: ordenActualizada, pago: nuevoPago }
      }
    )

    return NextResponse.json({
      idPuntoVenta,
      tipoOperacion: "orden_trabajo",
      ordenTrabajo: adaptarOrdenTrabajo(resultado.orden),
      pago: resultado.pago,
    })
  } catch (error) {
    console.log("[PUNTO_VENTA_ESTADO_PATCH]", error)

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
