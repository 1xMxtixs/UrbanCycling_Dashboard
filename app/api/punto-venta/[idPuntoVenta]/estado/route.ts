// Cambio de estado referencial para punto de venta.
// A falta de tabla punto_venta, actualiza estado de venta u orden segun el ID:
// - venta-12
// - orden-8
import { db } from "@/lib/db";
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
    const data = await req.json();
    const estadoPago = data.estado_pago ?? data.estadoPago;

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

    const ordenActualizada = await prisma.ordenDeTrabajo.update({
      where: {
        idOrdenDeTrabajo: parsed.id,
      },
      data: {
        estado: estadoOrden ?? undefined,
        estadoPago: estadoPago ?? undefined,
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
          },
        },
        mecanico: true,
      },
    });

    return NextResponse.json({
      idPuntoVenta,
      tipoOperacion: "orden_trabajo",
      ordenTrabajo: adaptarOrdenTrabajo(ordenActualizada),
    });
  } catch (error) {
    console.log("[PUNTO_VENTA_ESTADO_PATCH]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
