// Cambio de estado referencial para punto de venta.
// A falta de tabla punto_venta, actualiza estado de venta u orden segun el ID:
// - venta-12
// - orden-8
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import { NextResponse } from "next/server";

const prisma = db as any;

const transicionesOrdenPermitidas: Record<string, string[]> = {
  "Por realizar": ["En curso", "En espera"],
  "En curso": ["Listo para entregar", "En espera"],
  "En espera": ["En curso", "Listo para entregar"],
  "Listo para entregar": ["Entregado", "En curso"],
  Entregado: [],
};

function parseIdPuntoVenta(idPuntoVenta: string) {
  const [tipo, id] = idPuntoVenta.split("-");
  const parsedId = Number(id);

  if (
    !["venta", "orden"].includes(tipo) ||
    !Number.isInteger(parsedId) ||
    parsedId <= 0
  ) {
    return null;
  }

  return {
    tipo,
    id: parsedId,
  };
}

function sanitizarUsuario(usuario: any) {
  if (!usuario) {
    return usuario;
  }

  const {
    contrasena,
    contrasenaHash,
    contrasena_hash,
    password,
    ...usuarioSeguro
  } = usuario;

  return usuarioSeguro;
}

function sanitizarActores<T extends { usuario?: any; mecanico?: any }>(data: T) {
  return {
    ...data,
    usuario: sanitizarUsuario(data.usuario),
    mecanico: sanitizarUsuario(data.mecanico),
  };
}

function adaptarVenta(venta: any) {
  const ventaSegura = sanitizarActores(venta);
  const ventaEnMostrador = ventaSegura.ventaEnMostrador ?? {};

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
    estadoPago: ventaEnMostrador.estadoPago,
    fechaRegistro: ventaSegura.fechaRegistro,
  };
}

function adaptarOrdenTrabajo(ordenTrabajo: any) {
  const ordenTrabajoSegura = sanitizarActores(ordenTrabajo);

  return {
    ...ordenTrabajoSegura,
    total: ordenTrabajoSegura.montoTotal,
    descuento: ordenTrabajoSegura.descuentoGlobal,
    estadoOrden: ordenTrabajoSegura.estado,
    fechaCreacion: ordenTrabajoSegura.venta?.fechaRegistro,
    fechaRegistro: ordenTrabajoSegura.venta?.fechaRegistro,
    fechaRecepcion: ordenTrabajoSegura.venta?.fechaRegistro,
    usuario: sanitizarUsuario(ordenTrabajoSegura.venta?.usuario),
    cliente: ordenTrabajoSegura.venta?.cliente,
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ idPuntoVenta: string }> }
) {
  try {
    const { idPuntoVenta } = await params;
    const parsed = parseIdPuntoVenta(idPuntoVenta);

    if (!parsed) {
      return NextResponse.json(
        {
          code: "ID_PUNTO_VENTA_INVALIDO",
          message: "Use un identificador referencial como venta-1 u orden-1",
        },
        { status: 400 }
      );
    }

    const requiredPermission =
      parsed.tipo === "venta"
        ? PERMISSIONS.SALES_CREATE
        : PERMISSIONS.WORK_ORDERS_UPDATE_STATUS
    const { response } = await requirePermission(requiredPermission)

    if (response) {
      return response
    }

    const data = await req.json();
    const estadoPago = data.estado_pago ?? data.estadoPago;
    const metodoPago = data.metodo_pago ?? data.metodoPago;
    const montoPago = data.monto_pagado ?? data.montoPagado ?? data.monto;

    if (parsed.tipo === "venta") {
      const estadoVenta = data.estado_venta ?? data.estadoVenta ?? data.estado;

      if (!estadoVenta && !estadoPago) {
        return NextResponse.json(
          {
            code: "FALTA_ESTADO",
            message: "Debe indicar estadoVenta o estadoPago",
          },
          { status: 400 }
        );
      }

      let nuevoPago = null;
      if (estadoPago?.toLowerCase() === "pagada" && metodoPago) {
        const ventaObj = await prisma.venta.findUnique({
          where: { idVenta: parsed.id },
          include: { ventaEnMostrador: true },
        });

        if (ventaObj?.ventaEnMostrador) {
          const totalVenta = Number(ventaObj.ventaEnMostrador.montoTotal);

          nuevoPago = await prisma.$transaction(async (tx: any) => {
            const p = await tx.pago.create({
              data: {
                idUsuario: ventaObj.idUsuario,
                fechaRegistro: new Date(),
                estado: "pagada",
                metodoPago: String(metodoPago),
                monto: totalVenta,
              },
            });

            await tx.asignacionPago.create({
              data: {
                idPago: p.idPago,
                idVentaEnMostrador: ventaObj.ventaEnMostrador.idVentaEnMostrador,
                idOrdenDeCompra: null,
                montoAsociado: totalVenta,
                tipoAbono: "pago_total",
              },
            });

            return p;
          });
        }
      }

      const ventaActualizada = await prisma.venta.update({
        where: {
          idVenta: parsed.id,
        },
        data: {
          ventaEnMostrador: {
            update: {
              estado: estadoVenta ?? undefined,
              estadoPago: estadoPago ?? undefined,
            },
          },
        },
        include: {
          usuario: true,
          cliente: true,
          ventaEnMostrador: true,
        },
      });

      return NextResponse.json({
        idPuntoVenta,
        tipoOperacion: "venta",
        venta: adaptarVenta(ventaActualizada),
        pago: nuevoPago,
      });
    }

    const estadoOrden = data.estado_orden ?? data.estadoOrden ?? data.estado;

    if (!estadoOrden && !estadoPago) {
      return NextResponse.json(
        {
          code: "FALTA_ESTADO",
          message: "Debe indicar estadoOrden o estadoPago",
        },
        { status: 400 }
      );
    }

    const ordenTrabajo = await prisma.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo: parsed.id,
      },
      include: {
        venta: {
          include: {
            ventaEnMostrador: {
              include: {
                asignacionesPago: true,
              },
            },
          },
        },
      },
    });

    if (!ordenTrabajo) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden de trabajo no existe",
        },
        { status: 404 }
      );
    }

    if (estadoOrden) {
      const estadosSiguientes =
        transicionesOrdenPermitidas[ordenTrabajo.estado] ?? [];

      if (!estadosSiguientes.includes(estadoOrden)) {
        return NextResponse.json(
          {
            code: "CAMBIO_ESTADO_NO_PERMITIDO",
            message: `No se puede cambiar una orden desde "${ordenTrabajo.estado}" a "${estadoOrden}"`,
          },
          { status: 409 }
        );
      }
    }

    let nuevoPago = null;
    let finalEstadoPago = estadoPago;

    if (estadoPago && metodoPago) {
      const totalOrden = Number(ordenTrabajo.montoTotal);
      const totalPagadoPrev =
        ordenTrabajo.venta?.ventaEnMostrador?.asignacionesPago?.reduce(
          (sum: number, ap: any) => sum + Number(ap.montoAsociado),
          0
        ) ?? 0;

      const saldoPendiente = Math.max(0, totalOrden - totalPagadoPrev);
      const montoAPagar =
        montoPago !== undefined && montoPago !== null
          ? Number(montoPago)
          : saldoPendiente;

      if (montoAPagar > 0 && ordenTrabajo.venta?.ventaEnMostrador) {
        nuevoPago = await prisma.$transaction(async (tx: any) => {
          const p = await tx.pago.create({
            data: {
              idUsuario: ordenTrabajo.venta.idUsuario,
              fechaRegistro: new Date(),
              estado: "pagada",
              metodoPago: String(metodoPago),
              monto: montoAPagar,
            },
          });

          const isFullPayment = totalPagadoPrev + montoAPagar >= totalOrden;

          await tx.asignacionPago.create({
            data: {
              idPago: p.idPago,
              idVentaEnMostrador:
                ordenTrabajo.venta.ventaEnMostrador.idVentaEnMostrador,
              idOrdenDeCompra: null,
              montoAsociado: montoAPagar,
              tipoAbono: isFullPayment ? "pago_total" : "abono",
            },
          });

          return p;
        });

        if (totalPagadoPrev + montoAPagar >= totalOrden) {
          finalEstadoPago = "pagada";
        }
      }
    }

    if (finalEstadoPago && ordenTrabajo.venta?.ventaEnMostrador) {
      await prisma.ventaEnMostrador.update({
        where: {
          idVentaEnMostrador: ordenTrabajo.venta.ventaEnMostrador.idVentaEnMostrador,
        },
        data: {
          estadoPago: finalEstadoPago,
        },
      });
    }

    const ordenActualizada = await prisma.ordenDeTrabajo.update({
      where: {
        idOrdenDeTrabajo: parsed.id,
      },
      data: {
        estado: estadoOrden ?? undefined,
        estadoPago: finalEstadoPago ?? undefined,
        fechaEntregaReal:
          estadoOrden && ["Listo para entregar", "Entregado"].includes(estadoOrden)
            ? new Date()
            : undefined,
      },
      include: {
        venta: {
          include: {
            usuario: true,
            cliente: true,
            ventaEnMostrador: {
              include: {
                asignacionesPago: {
                  include: {
                    pago: true,
                  },
                },
              },
            },
          },
        },
        mecanico: true,
      },
    });

    return NextResponse.json({
      idPuntoVenta,
      tipoOperacion: "orden_trabajo",
      ordenTrabajo: adaptarOrdenTrabajo(ordenActualizada),
      pago: nuevoPago,
    });
  } catch (error) {
    console.log("[PUNTO_VENTA_ESTADO_PATCH]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
