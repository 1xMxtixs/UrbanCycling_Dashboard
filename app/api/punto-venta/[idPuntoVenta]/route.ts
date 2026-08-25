// Detalle referencial de punto de venta.
// A falta de una tabla punto_venta, el parametro acepta valores como:
// - venta-12
// - orden-8
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit";
import { NextResponse } from "next/server";

const prisma = db;

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
  
  const asignaciones = ordenTrabajoSegura.venta?.ventaEnMostrador?.asignacionesPago ?? [];
  const totalPagado = asignaciones.reduce(
    (sum: number, a: any) => sum + Number(a.montoAsociado ?? 0),
    0
  );

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
    totalPagado,
    pagos: asignaciones.map((a: any) => ({
      idPago: a.pago?.idPago,
      fechaRegistro: a.pago?.fechaRegistro,
      estado: a.pago?.estado,
      metodoPago: a.pago?.metodoPago,
      monto: a.pago?.monto,
      tipoAbono: a.tipoAbono,
    })),
  };
}

function normalizarFechaSoloDia(fecha: Date) {
  return new Date(
    Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate())
  );
}

function parseFechaEntregaEstimada(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const fechaInput = value.trim();
  const [, datePart] = fechaInput.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/) ?? [];

  if (!datePart) {
    return null;
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const fecha = new Date(Date.UTC(year, month - 1, day));

  if (
    fecha.getUTCFullYear() !== year ||
    fecha.getUTCMonth() !== month - 1 ||
    fecha.getUTCDate() !== day
  ) {
    return null;
  }

  return fecha;
}

function hasOwn(data: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(data, key);
}

function getAliasedValue(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    if (hasOwn(data, key)) {
      return data[key];
    }
  }

  return undefined;
}

function hasAnyAlias(data: Record<string, unknown>, ...keys: string[]) {
  return keys.some((key) => hasOwn(data, key));
}

function isBlank(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  );
}

function parseOptionalPositiveInteger(value: unknown) {
  if (isBlank(value)) {
    return null;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN;
  }

  return parsedValue;
}

function camposRequeridosVacios(data: Record<string, unknown>) {
  const camposRequeridos = [
    ["fecha_entrega_estimada", "fechaEntregaEstimada"],
    ["estado_pago", "estadoPago"],
    ["estado_orden", "estadoOrden", "estado"],
    ["descuento", "descuentoGlobal"],
  ];

  return camposRequeridos.some((aliases) => {
    const fueEnviado = hasAnyAlias(data, ...aliases);
    const value = getAliasedValue(data, ...aliases);

    return fueEnviado && isBlank(value);
  });
}

function compactObject(data: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
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

    const requiredPermission =
      parsed.tipo === "venta" ? PERMISSIONS.SALES_READ : PERMISSIONS.WORK_ORDERS_READ
    const { session, response } = await requirePermission(requiredPermission)

    if (response || !session) {
      return response
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
              asignacionesPago: {
                include: {
                  pago: true,
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
        : PERMISSIONS.WORK_ORDERS_UPDATE
    const { session, response } = await requirePermission(requiredPermission)

    if (response || !session) {
      return response
    }

    const data = (await req.json()) as Record<string, unknown>;

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

    const tieneFechaEntregaEstimada = hasAnyAlias(
      data,
      "fecha_entrega_estimada",
      "fechaEntregaEstimada"
    );
    const fechaEntregaEstimadaInput = getAliasedValue(
      data,
      "fecha_entrega_estimada",
      "fechaEntregaEstimada"
    );
    const tieneEstadoPago = hasAnyAlias(data, "estado_pago", "estadoPago");
    const estadoPago = getAliasedValue(data, "estado_pago", "estadoPago");
    const tieneEstadoOrden = hasAnyAlias(data, "estado_orden", "estadoOrden", "estado");
    const estadoOrden = getAliasedValue(data, "estado_orden", "estadoOrden", "estado");
    const tieneDescuento = hasAnyAlias(data, "descuento", "descuentoGlobal");
    const descuento = getAliasedValue(data, "descuento", "descuentoGlobal");
    const tieneMecanicoAsignado = hasAnyAlias(
      data,
      "id_mecanico_asignado",
      "idMecanicoAsignado"
    );
    const idMecanicoAsignadoInput = getAliasedValue(
      data,
      "id_mecanico_asignado",
      "idMecanicoAsignado"
    );

    if (camposRequeridosVacios(data)) {
      if (
        tieneFechaEntregaEstimada &&
        !String(fechaEntregaEstimadaInput ?? "").trim()
      ) {
        return NextResponse.json(
          {
            code: "FECHA_ENTREGA_ESTIMADA_REQUERIDA",
            message: "Debe ingresar una fecha estimada de entrega",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          code: "CAMPOS_REQUERIDOS_VACIOS",
          message: "Debe llenar los campos requeridos",
        },
        { status: 400 }
      );
    }

    let fechaEntregaEstimada: Date | undefined;
    let idMecanicoAsignado: number | null | undefined;

    if (tieneFechaEntregaEstimada) {
      fechaEntregaEstimada =
        parseFechaEntregaEstimada(fechaEntregaEstimadaInput) ?? undefined;

      if (!fechaEntregaEstimada) {
        return NextResponse.json(
          {
            code: !String(fechaEntregaEstimadaInput ?? "").trim()
              ? "FECHA_ENTREGA_ESTIMADA_REQUERIDA"
              : "FECHA_ENTREGA_ESTIMADA_INVALIDA",
            message: !String(fechaEntregaEstimadaInput ?? "").trim()
              ? "Debe ingresar una fecha estimada de entrega"
              : "La fecha ingresada no es valida",
          },
          { status: 400 }
        );
      }
    }

    if (tieneMecanicoAsignado) {
      idMecanicoAsignado = parseOptionalPositiveInteger(idMecanicoAsignadoInput);

      if (Number.isNaN(idMecanicoAsignado)) {
        return NextResponse.json(
          {
            code: "MECANICO_INVALIDO",
            message: "El mecanico asignado no es valido",
          },
          { status: 400 }
        );
      }
    }

    if (tieneDescuento && Number.isNaN(Number(descuento))) {
      return NextResponse.json(
        {
          code: "DESCUENTO_INVALIDO",
          message: "El descuento no es valido",
        },
        { status: 400 }
      );
    }

    const ordenTrabajoActual = await prisma.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo: parsed.id,
      },
      include: {
        venta: true,
      },
    });

    if (!ordenTrabajoActual) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden de trabajo indicada no existe",
        },
        { status: 404 }
      );
    }

    if (
      fechaEntregaEstimada &&
      ordenTrabajoActual?.venta?.fechaRegistro &&
      fechaEntregaEstimada <
        normalizarFechaSoloDia(new Date(ordenTrabajoActual.venta.fechaRegistro))
    ) {
      return NextResponse.json(
        {
          code: "FECHA_ENTREGA_ESTIMADA_INVALIDA",
          message: "La fecha ingresada no es valida",
        },
        { status: 400 }
      );
    }

    if (idMecanicoAsignado) {
      const mecanico = await prisma.usuario.findUnique({
        where: {
          idUsuario: idMecanicoAsignado,
        },
      });

      if (!mecanico) {
        return NextResponse.json(
          {
            code: "MECANICO_NO_EXISTE",
            message: "El mecanico asignado no existe",
          },
          { status: 404 }
        );
      }
    }

    const updateData = {
      descuentoGlobal: tieneDescuento ? Number(descuento) : undefined,
      estado: tieneEstadoOrden ? String(estadoOrden).trim() : undefined,
      estadoPago: tieneEstadoPago ? String(estadoPago).trim() : undefined,
      idMecanicoAsignado: tieneMecanicoAsignado
        ? idMecanicoAsignado
        : undefined,
      fechaEntregaEstimada,
      observacionesIngreso:
        data.observaciones_ingreso ?? data.observacionesIngreso ?? undefined,
    };
    const cambiosAuditoria = compactObject({
      descuentoGlobal: updateData.descuentoGlobal,
      estado: updateData.estado,
      estadoPago: updateData.estadoPago,
      idMecanicoAsignado: updateData.idMecanicoAsignado,
      fechaEntregaEstimada: updateData.fechaEntregaEstimada,
      observacionesIngreso: updateData.observacionesIngreso,
    });

    const ordenActualizada = await prisma.$transaction(async (tx: any) => {
      const orden = await tx.ordenDeTrabajo.update({
        where: {
          idOrdenDeTrabajo: parsed.id,
        },
        data: updateData,
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

      if (Object.keys(cambiosAuditoria).length > 0) {
        await registrarAuditoriaOrdenTrabajo(tx, {
          idUsuario: session.user.idUsuario,
          tipoOperacion: tieneFechaEntregaEstimada
            ? "reprogramacion_entrega"
            : "modificacion_orden",
          idOrdenDeTrabajo: parsed.id,
          valorAnterior: compactObject({
            descuentoGlobal: tieneDescuento
              ? ordenTrabajoActual.descuentoGlobal
              : undefined,
            estado: tieneEstadoOrden ? ordenTrabajoActual.estado : undefined,
            estadoPago: tieneEstadoPago ? ordenTrabajoActual.estadoPago : undefined,
            idMecanicoAsignado: tieneMecanicoAsignado
              ? ordenTrabajoActual.idMecanicoAsignado
              : undefined,
            fechaEntregaEstimada: tieneFechaEntregaEstimada
              ? ordenTrabajoActual.fechaEntregaEstimada
              : undefined,
            observacionesIngreso:
              updateData.observacionesIngreso !== undefined
                ? ordenTrabajoActual.observacionesIngreso
                : undefined,
          }),
          valorNuevo: cambiosAuditoria,
          detalleCambio: tieneFechaEntregaEstimada
            ? "Reprogramacion de fecha estimada de entrega"
            : "Modificacion de orden de trabajo",
        });
      }

      return orden;
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
