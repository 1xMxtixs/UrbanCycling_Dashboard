import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit";
import { NextResponse } from "next/server";

function parseIdOrden(idVenta: string) {
  const idOrdenDeTrabajo = Number(idVenta);

  if (!Number.isInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
    return Number.NaN;
  }

  return idOrdenDeTrabajo;
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function calcularMontos(montoSubtotal: number) {
  const montoNeto = Math.round(montoSubtotal / 1.19);
  const montoIva = montoSubtotal - montoNeto;

  return {
    montoSubtotal,
    montoTotal: montoSubtotal,
    montoNeto,
    montoIva,
  };
}

function parsePositiveInteger(value: unknown) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN;
  }

  return parsedValue;
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getFirstDefined(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return data[key];
    }
  }

  return undefined;
}

async function recalcularMontosOrden(
  tx: Prisma.TransactionClient,
  idOrdenDeTrabajo: number
) {
  const lineas = await tx.lineaDeOrdenDeTrabajo.findMany({
    where: {
      idOrdenDeTrabajo,
    },
  });

  const totalServicios = lineas.reduce(
    (total, linea) =>
      total + linea.cantidad * toNumber(linea.precioUnitario),
    0
  );
  const montos = calcularMontos(totalServicios);

  const ordenActualizada = await tx.ordenDeTrabajo.update({
    where: {
      idOrdenDeTrabajo,
    },
    data: {
      montoSubtotal: montos.montoSubtotal,
      montoTotal: montos.montoTotal,
      montoNeto: montos.montoNeto,
      montoIva: montos.montoIva,
    },
  });

  return {
    orden: ordenActualizada,
    totalServicios,
  };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
    const { response } = await requirePermission(PERMISSIONS.WORK_ORDERS_UPDATE)

    if (response) {
      return response
    }

    const { idVenta } = await params;
    const { id_servicio, idServicio, cantidad } = await req.json();
    const idOrdenDeTrabajo = parseIdOrden(idVenta);
    const servicioId = Number(id_servicio ?? idServicio);
    const cantidadServicio = Number(cantidad);

    if (Number.isNaN(idOrdenDeTrabajo)) {
      return NextResponse.json(
        { code: "ID_INVALIDO", message: "El ID de la orden no es válido" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(servicioId) ||
      servicioId <= 0 ||
      !Number.isInteger(cantidadServicio) ||
      cantidadServicio <= 0
    ) {
      return NextResponse.json(
        {
          code: "FALTAN_DATOS",
          message: "Servicio y cantidad son obligatorios",
        },
        { status: 400 }
      );
    }

    const orden = await db.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo,
      },
    });

    if (!orden) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden de trabajo no existe",
        },
        { status: 404 }
      );
    }

    const servicio = await db.servicio.findUnique({
      where: {
        idServicio: servicioId,
      },
    });

    if (!servicio) {
      return NextResponse.json(
        {
          code: "SERVICIO_NO_EXISTE",
          message: "El servicio no existe",
        },
        { status: 404 }
      );
    }

    const productosServicio = await db.productoServicio.findMany({
      where: {
        idServicio: servicio.idServicio,
      },
      include: {
        producto: true,
      },
    });

    if (productosServicio.length === 0) {
      return NextResponse.json(
        {
          code: "SERVICIO_SIN_INSUMOS",
          message: "El servicio no tiene insumos asociados",
        },
        { status: 409 }
      );
    }

    const productosAUtilizar = productosServicio.map((item) => {
      const cantidadNecesaria = item.cantidad * cantidadServicio;

      return {
        producto: item.producto,
        cantidadNecesaria,
      };
    });

    const productoSinStock = productosAUtilizar.find(
      (item) => item.producto.stockActual < item.cantidadNecesaria
    );

    if (productoSinStock) {
      return NextResponse.json(
        {
          code: "STOCK_INSUFICIENTE",
          message: `No hay stock suficiente para ${productoSinStock.producto.nombre}`,
          producto: {
            id_producto: productoSinStock.producto.idProducto,
            idProducto: productoSinStock.producto.idProducto,
            nombre: productoSinStock.producto.nombre,
            stock_actual: productoSinStock.producto.stockActual,
            stockActual: productoSinStock.producto.stockActual,
          },
          cantidad_requerida: productoSinStock.cantidadNecesaria,
          cantidad_disponible: productoSinStock.producto.stockActual,
        },
        { status: 409 }
      );
    }

    const resultado = await db.$transaction(async (tx) => {
      const linea = await tx.lineaDeOrdenDeTrabajo.create({
        data: {
          idOrdenDeTrabajo,
          idServicio: servicio.idServicio,
          cantidad: cantidadServicio,
          precioUnitario: servicio.precioVenta,
          descuentoUnitario: 0,
          costoUnitario: 0,
        },
      });

      for (const item of productosAUtilizar) {
        await tx.producto.update({
          where: {
            idProducto: item.producto.idProducto,
          },
          data: {
            stockActual: item.producto.stockActual - item.cantidadNecesaria,
          },
        });
      }

      const lineas = await tx.lineaDeOrdenDeTrabajo.findMany({
        where: {
          idOrdenDeTrabajo,
        },
      });

      const totalServicios = lineas.reduce(
        (total, linea) =>
          total + linea.cantidad * toNumber(linea.precioUnitario),
        0
      );
      const montos = calcularMontos(totalServicios);

      const ordenActualizada = await tx.ordenDeTrabajo.update({
        where: {
          idOrdenDeTrabajo,
        },
        data: {
          montoSubtotal: montos.montoSubtotal,
          montoTotal: montos.montoTotal,
          montoNeto: montos.montoNeto,
          montoIva: montos.montoIva,
        },
      });

      return {
        linea,
        orden: ordenActualizada,
        totalServicios,
      };
    });

    return NextResponse.json(
      {
        linea: resultado.linea,
        servicio,
        orden: resultado.orden,
        total_servicios: resultado.totalServicios,
        productos_utilizados: productosAUtilizar.map((item) => ({
          id_producto: item.producto.idProducto,
          idProducto: item.producto.idProducto,
          nombre: item.producto.nombre,
          cantidad_utilizada: item.cantidadNecesaria,
          stock_anterior: item.producto.stockActual,
          stock_nuevo: item.producto.stockActual - item.cantidadNecesaria,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("[AGREGAR_SERVICIO_ORDEN]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
    const { response } = await requirePermission(PERMISSIONS.WORK_ORDERS_READ)

    if (response) {
      return response
    }

    const { idVenta } = await params;
    const idOrdenDeTrabajo = parseIdOrden(idVenta);

    if (Number.isNaN(idOrdenDeTrabajo)) {
      return NextResponse.json(
        { code: "ID_INVALIDO", message: "El ID de la orden no es válido" },
        { status: 400 }
      );
    }

    const orden = await db.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo,
      },
    });

    if (!orden) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden de trabajo no existe",
        },
        { status: 404 }
      );
    }

    const lineas = await db.lineaDeOrdenDeTrabajo.findMany({
      where: {
        idOrdenDeTrabajo,
      },
      include: {
        servicio: true,
        producto: true,
      },
    });

    const total = lineas.reduce(
      (acumulado, linea) =>
        acumulado + linea.cantidad * toNumber(linea.precioUnitario),
      0
    );

    return NextResponse.json({
      id_orden_de_trabajo: idOrdenDeTrabajo,
      idOrdenDeTrabajo,
      lineas,
      total,
    });
  } catch (error) {
    console.log("[LISTAR_SERVICIOS_ORDEN]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
    const { session, response } = await requirePermission(PERMISSIONS.WORK_ORDERS_UPDATE)

    if (response || !session) {
      return response
    }

    const { idVenta } = await params;
    const idOrdenDeTrabajo = parseIdOrden(idVenta);
    const data = (await req.json()) as Record<string, unknown>;

    if (Number.isNaN(idOrdenDeTrabajo)) {
      return NextResponse.json(
        { code: "ID_INVALIDO", message: "El ID de la orden no es vÃ¡lido" },
        { status: 400 }
      );
    }

    const idLineaDeOrdenDeTrabajoInput = getFirstDefined(data, [
      "id_linea_de_orden_de_trabajo",
      "idLineaDeOrdenDeTrabajo",
      "id_linea",
      "idLinea",
    ]);
    const idServicioInput = getFirstDefined(data, [
      "id_servicio",
      "idServicio",
      "nuevo_servicio",
      "nuevoServicio",
      "id_nuevo_servicio",
      "idNuevoServicio",
    ]);
    const diagnostico = getText(
      getFirstDefined(data, [
        "observaciones_ingreso",
        "observacionesIngreso",
        "diagnostico",
        "nuevoDiagnostico",
        "descripcion",
      ])
    );
    const idLineaDeOrdenDeTrabajo =
      idLineaDeOrdenDeTrabajoInput === undefined ||
      idLineaDeOrdenDeTrabajoInput === null ||
      idLineaDeOrdenDeTrabajoInput === ""
        ? undefined
        : parsePositiveInteger(idLineaDeOrdenDeTrabajoInput);
    const idServicio = parsePositiveInteger(idServicioInput);

    if (!diagnostico || Number.isNaN(idServicio)) {
      return NextResponse.json(
        {
          code: "CAMPOS_MODIFICACION_VACIOS",
          message: "Debe agregar una descripciÃ³n para el cambio",
        },
        { status: 400 }
      );
    }

    if (idLineaDeOrdenDeTrabajo !== undefined && Number.isNaN(idLineaDeOrdenDeTrabajo)) {
      return NextResponse.json(
        {
          code: "LINEA_INVALIDA",
          message: "La linea de servicio no es vÃ¡lida",
        },
        { status: 400 }
      );
    }

    const orden = await db.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo,
      },
    });

    if (!orden) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden de trabajo no existe",
        },
        { status: 404 }
      );
    }

    if (orden.estado !== "En curso") {
      return NextResponse.json(
        {
          code: "ESTADO_ORDEN_NO_PERMITE_MODIFICACION",
          message: "La orden debe estar en estado En curso",
        },
        { status: 409 }
      );
    }

    const servicio = await db.servicio.findUnique({
      where: {
        idServicio,
      },
    });

    if (!servicio) {
      return NextResponse.json(
        {
          code: "SERVICIO_NO_EXISTE",
          message: "El servicio no existe",
        },
        { status: 404 }
      );
    }

    const lineasServicio = await db.lineaDeOrdenDeTrabajo.findMany({
      where: {
        idOrdenDeTrabajo,
        idServicio: {
          not: null,
        },
      },
    });

    const lineaServicio = idLineaDeOrdenDeTrabajo
      ? lineasServicio.find(
          (linea) =>
            linea.idLineaDeOrdenDeTrabajo === idLineaDeOrdenDeTrabajo
        )
      : lineasServicio.length === 1
        ? lineasServicio[0]
        : null;

    if (!lineaServicio) {
      return NextResponse.json(
        {
          code: idLineaDeOrdenDeTrabajo
            ? "LINEA_SERVICIO_NO_EXISTE"
            : "LINEA_SERVICIO_REQUERIDA",
          message: idLineaDeOrdenDeTrabajo
            ? "La linea de servicio no existe en la orden"
            : "Debe indicar la linea de servicio a modificar",
        },
        { status: idLineaDeOrdenDeTrabajo ? 404 : 400 }
      );
    }

    const resultado = await db.$transaction(async (tx) => {
      const lineaActualizada = await tx.lineaDeOrdenDeTrabajo.update({
        where: {
          idLineaDeOrdenDeTrabajo: lineaServicio.idLineaDeOrdenDeTrabajo,
        },
        data: {
          idServicio: servicio.idServicio,
          precioUnitario: servicio.precioVenta,
        },
        include: {
          servicio: true,
          producto: true,
        },
      });

      const ordenConDiagnostico = await tx.ordenDeTrabajo.update({
        where: {
          idOrdenDeTrabajo,
        },
        data: {
          observacionesIngreso: diagnostico,
        },
      });

      const montos = await recalcularMontosOrden(tx, idOrdenDeTrabajo);

      await registrarAuditoriaOrdenTrabajo(tx, {
        idUsuario: session.user.idUsuario,
        tipoOperacion: "modificacion_servicio",
        idOrdenDeTrabajo,
        valorAnterior: {
          idLineaDeOrdenDeTrabajo: lineaServicio.idLineaDeOrdenDeTrabajo,
          idServicio: lineaServicio.idServicio,
          precioUnitario: lineaServicio.precioUnitario,
          observacionesIngreso: orden.observacionesIngreso,
        },
        valorNuevo: {
          idLineaDeOrdenDeTrabajo: lineaActualizada.idLineaDeOrdenDeTrabajo,
          idServicio: lineaActualizada.idServicio,
          precioUnitario: lineaActualizada.precioUnitario,
          observacionesIngreso: diagnostico,
        },
        detalleCambio: "Modificacion de servicio tecnico de la orden",
      });

      return {
        linea: lineaActualizada,
        servicio,
        orden: {
          ...ordenConDiagnostico,
          ...montos.orden,
          observacionesIngreso: diagnostico,
        },
        totalServicios: montos.totalServicios,
      };
    });

    return NextResponse.json({
      code: "SERVICIO_ORDEN_MODIFICADO",
      message: "ModificaciÃ³n de servicio registrada correctamente",
      linea: resultado.linea,
      servicio: resultado.servicio,
      orden: resultado.orden,
      total_servicios: resultado.totalServicios,
    });
  } catch (error) {
    console.log("[MODIFICAR_SERVICIO_ORDEN]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
