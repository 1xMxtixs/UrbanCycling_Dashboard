import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import {
  recalcularTotalesOrdenTrabajo,
  WorkOrderTotalsError,
} from "@/lib/stored-procedures";
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit";
import { NextResponse } from "next/server";

class WorkOrderLineError extends Error {
  constructor(
    public readonly code:
      | "ID_INVALIDO"
      | "ORDEN_NO_EXISTE"
      | "LINEA_NO_EXISTE"
      | "ORDEN_NO_MODIFICABLE"
      | "VALORES_LINEA_INVALIDOS"
      | "CAMPOS_LINEA_REQUERIDOS",
    message: string
  ) {
    super(message);
    this.name = "WorkOrderLineError";
  }
}

function parseOrderId(value: string) {
  const match = /^orden-(\d+)$/.exec(value);
  const id = Number(match?.[1]);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseLineId(value: string) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function sanitizarUsuario(usuario: unknown) {
  if (!usuario || typeof usuario !== "object") {
    return usuario;
  }

  const usuarioSeguro = {
    ...(usuario as Record<string, unknown>),
  };

  delete usuarioSeguro.contrasena;
  delete usuarioSeguro.contrasenaHash;
  delete usuarioSeguro.contrasena_hash;
  delete usuarioSeguro.password;

  return usuarioSeguro;
}

function sanitizarOrdenTrabajo(orden: Record<string, unknown>) {
  const venta = orden.venta;

  return {
    ...orden,
    venta:
      venta && typeof venta === "object"
        ? {
            ...(venta as Record<string, unknown>),
            usuario: sanitizarUsuario(
              (venta as Record<string, unknown>).usuario
            ),
          }
        : venta,
    mecanico: sanitizarUsuario(orden.mecanico),
  };
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      idPuntoVenta: string;
      idLinea: string;
    }>;
  }
) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.WORK_ORDERS_UPDATE
    );

    if (response || !session) {
      return response;
    }

    const { idPuntoVenta, idLinea } = await params;
    const idOrdenDeTrabajo = parseOrderId(idPuntoVenta);
    const idLineaDeOrdenDeTrabajo = parseLineId(idLinea);

    if (!idOrdenDeTrabajo || !idLineaDeOrdenDeTrabajo) {
      throw new WorkOrderLineError(
        "ID_INVALIDO",
        "La orden o línea indicada no es válida"
      );
    }

    const data = (await req.json()) as Record<string, unknown>;
    const tienePrecio = Object.prototype.hasOwnProperty.call(
      data,
      "precioUnitario"
    ) || Object.prototype.hasOwnProperty.call(data, "precio_unitario");
    const tieneDescuento = Object.prototype.hasOwnProperty.call(
      data,
      "descuentoUnitario"
    ) || Object.prototype.hasOwnProperty.call(data, "descuento_unitario");

    if (!tienePrecio && !tieneDescuento) {
      throw new WorkOrderLineError(
        "CAMPOS_LINEA_REQUERIDOS",
        "Debe indicar precioUnitario o descuentoUnitario"
      );
    }

    const resultado = await db.$transaction(async (tx) => {
      const orden = await tx.ordenDeTrabajo.findUnique({
        where: { idOrdenDeTrabajo },
      });

      if (!orden) {
        throw new WorkOrderLineError(
          "ORDEN_NO_EXISTE",
          "La orden de trabajo no existe"
        );
      }

      if (["Entregado", "Anulada"].includes(orden.estado)) {
        throw new WorkOrderLineError(
          "ORDEN_NO_MODIFICABLE",
          "La orden de trabajo no puede ser modificada en su estado actual"
        );
      }

      const linea = await tx.lineaDeOrdenDeTrabajo.findFirst({
        where: {
          idLineaDeOrdenDeTrabajo,
          idOrdenDeTrabajo,
        },
      });

      if (!linea) {
        throw new WorkOrderLineError(
          "LINEA_NO_EXISTE",
          "La línea no pertenece a la orden de trabajo"
        );
      }

      const precioUnitario = tienePrecio
        ? Number(data.precioUnitario ?? data.precio_unitario)
        : Number(linea.precioUnitario);
      const descuentoUnitario = tieneDescuento
        ? Number(data.descuentoUnitario ?? data.descuento_unitario)
        : Number(linea.descuentoUnitario);

      if (
        !Number.isFinite(precioUnitario) ||
        precioUnitario < 0 ||
        !Number.isFinite(descuentoUnitario) ||
        descuentoUnitario < 0 ||
        descuentoUnitario > precioUnitario
      ) {
        throw new WorkOrderLineError(
          "VALORES_LINEA_INVALIDOS",
          "El descuento no puede superar el precio unitario"
        );
      }

      const lineaActualizada = await tx.lineaDeOrdenDeTrabajo.update({
        where: { idLineaDeOrdenDeTrabajo },
        data: {
          precioUnitario,
          descuentoUnitario,
        },
      });

      await recalcularTotalesOrdenTrabajo(tx, idOrdenDeTrabajo);

      const ordenActualizada = await tx.ordenDeTrabajo.findUniqueOrThrow({
        where: { idOrdenDeTrabajo },
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

      await registrarAuditoriaOrdenTrabajo(tx, {
        idUsuario: session.user.idUsuario,
        tipoOperacion: "modificacion_linea_orden",
        idOrdenDeTrabajo,
        valorAnterior: {
          idLineaDeOrdenDeTrabajo,
          precioUnitario: linea.precioUnitario,
          descuentoUnitario: linea.descuentoUnitario,
        },
        valorNuevo: {
          idLineaDeOrdenDeTrabajo,
          precioUnitario,
          descuentoUnitario,
        },
        detalleCambio: "Modificacion de precio o descuento de línea",
      });

      return {
        linea: lineaActualizada,
        ordenTrabajo: ordenActualizada,
      };
    });

    return NextResponse.json({
      ...resultado,
      ordenTrabajo: sanitizarOrdenTrabajo(
        resultado.ordenTrabajo as unknown as Record<string, unknown>
      ),
    });
  } catch (error) {
    if (error instanceof WorkOrderLineError) {
      const statusByCode: Record<WorkOrderLineError["code"], number> = {
        ID_INVALIDO: 400,
        CAMPOS_LINEA_REQUERIDOS: 400,
        VALORES_LINEA_INVALIDOS: 400,
        ORDEN_NO_EXISTE: 404,
        LINEA_NO_EXISTE: 404,
        ORDEN_NO_MODIFICABLE: 409,
      };

      return NextResponse.json(
        {
          code: error.code,
          message: error.message,
        },
        { status: statusByCode[error.code] }
      );
    }

    if (error instanceof WorkOrderTotalsError) {
      return NextResponse.json(
        {
          code: error.code,
          message: error.message,
        },
        { status: 400 }
      );
    }

    console.log("[ACTUALIZAR_LINEA_ORDEN]", error);

    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
