// Detalle referencial de punto de venta.
// A falta de una tabla punto_venta, el parametro acepta valores como:
// - venta-12
// - orden-8
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const prisma = db as any;

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
  if (!venta) {
    return null;
  }

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
  if (!ordenTrabajo) {
    return null;
  }

  const ordenTrabajoSegura = sanitizarActores(ordenTrabajo);

  return {
    ...ordenTrabajoSegura,
    total: ordenTrabajoSegura.montoTotal,
    descuento: ordenTrabajoSegura.descuentoGlobal,
    estadoOrden: ordenTrabajoSegura.estado,
    fechaCreacion: ordenTrabajoSegura.venta?.fechaRegistro,
    fechaRegistro: ordenTrabajoSegura.venta?.fechaRegistro,
    usuario: sanitizarUsuario(ordenTrabajoSegura.venta?.usuario),
    cliente: ordenTrabajoSegura.venta?.cliente,
  };
}

export async function GET(
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

    if (parsed.tipo === "venta") {
      const venta = await prisma.venta.findUnique({
        where: {
          idVenta: parsed.id,
        },
        include: {
          usuario: true,
          cliente: true,
          ventaEnMostrador: {
            include: {
              lineasDeVenta: {
                include: {
                  producto: true,
                },
              },
            },
          },
        },
      });

      if (!venta) {
        return NextResponse.json(
          {
            code: "VENTA_NO_EXISTE",
            message: "La venta indicada no existe",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        idPuntoVenta,
        tipoOperacion: "venta",
        venta: adaptarVenta(venta),
      });
    }

    const ordenTrabajo = await prisma.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo: parsed.id,
      },
      include: {
        venta: {
          include: {
            usuario: true,
            cliente: true,
          },
        },
        mecanico: true,
        bicicletas: true,
        lineasDeOrdenDeTrabajo: {
          include: {
            producto: true,
            servicio: true,
          },
        },
      },
    });

    if (!ordenTrabajo) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden de trabajo indicada no existe",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      idPuntoVenta,
      tipoOperacion: "orden_trabajo",
      ordenTrabajo: adaptarOrdenTrabajo(ordenTrabajo),
    });
  } catch (error) {
    console.log("[PUNTO_VENTA_DETALLE_GET]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ idPuntoVenta: string }> }
) {
  try {
    const { idPuntoVenta } = await params;
    const parsed = parseIdPuntoVenta(idPuntoVenta);
    const data = await req.json();

    if (!parsed) {
      return NextResponse.json(
        {
          code: "ID_PUNTO_VENTA_INVALIDO",
          message: "Use un identificador referencial como venta-1 u orden-1",
        },
        { status: 400 }
      );
    }

    if (parsed.tipo === "venta") {
      const ventaActualizada = await prisma.venta.update({
        where: {
          idVenta: parsed.id,
        },
        data: {
          ventaEnMostrador: {
            update: {
              descuentoGlobal:
                data.descuento !== undefined || data.descuentoGlobal !== undefined
                  ? Number(data.descuento ?? data.descuentoGlobal)
                  : undefined,
              estadoPago: data.estado_pago ?? data.estadoPago ?? undefined,
              estado:
                data.estado_venta ?? data.estadoVenta ?? data.estado ?? undefined,
            },
          },
        },
        include: {
          usuario: true,
          cliente: true,
          ventaEnMostrador: {
            include: {
              lineasDeVenta: {
                include: {
                  producto: true,
                },
              },
            },
          },
        },
      });

      return NextResponse.json({
        idPuntoVenta,
        tipoOperacion: "venta",
        venta: adaptarVenta(ventaActualizada),
      });
    }

    const fechaEntregaEstimadaInput =
      data.fecha_entrega_estimada ?? data.fechaEntregaEstimada;
    const ordenActualizada = await prisma.ordenDeTrabajo.update({
      where: {
        idOrdenDeTrabajo: parsed.id,
      },
      data: {
        descuentoGlobal:
          data.descuento !== undefined || data.descuentoGlobal !== undefined
            ? Number(data.descuento ?? data.descuentoGlobal)
            : undefined,
        estadoPago: data.estado_pago ?? data.estadoPago ?? undefined,
        fechaEntregaEstimada: fechaEntregaEstimadaInput
          ? new Date(fechaEntregaEstimadaInput)
          : undefined,
        observacionesIngreso:
          data.observaciones_ingreso ?? data.observacionesIngreso ?? undefined,
      },
      include: {
        venta: {
          include: {
            usuario: true,
            cliente: true,
          },
        },
        mecanico: true,
        bicicletas: true,
        lineasDeOrdenDeTrabajo: {
          include: {
            producto: true,
            servicio: true,
          },
        },
      },
    });

    return NextResponse.json({
      idPuntoVenta,
      tipoOperacion: "orden_trabajo",
      ordenTrabajo: adaptarOrdenTrabajo(ordenActualizada),
    });
  } catch (error) {
    console.log("[PUNTO_VENTA_DETALLE_PATCH]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
