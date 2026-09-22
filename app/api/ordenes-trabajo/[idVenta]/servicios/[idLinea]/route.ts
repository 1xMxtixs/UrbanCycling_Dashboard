import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import {
  recalcularTotalesOrdenTrabajo,
  WorkOrderTotalsError,
} from "@/lib/stored-procedures";
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit";
import { NextResponse } from "next/server";

class ServicePriceError extends Error {
  constructor(
    public readonly code:
      | "ID_INVALIDO"
      | "PRECIO_INVALIDO"
      | "ORDEN_NO_EXISTE"
      | "LINEA_SERVICIO_NO_EXISTE"
      | "ORDEN_NO_MODIFICABLE",
    message: string
  ) {
    super(message);
    this.name = "ServicePriceError";
  }
}

function parsePositiveInteger(value: string) {
  const parsedValue = Number(value);

  return Number.isSafeInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
}

function parseServicePrice(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isSafeInteger(parsedValue) && parsedValue >= 0
    ? parsedValue
    : null;
}

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      idVenta: string;
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

    const { idVenta, idLinea } = await params;
    const idOrdenDeTrabajo = parsePositiveInteger(idVenta);
    const idLineaDeOrdenDeTrabajo = parsePositiveInteger(idLinea);

    if (!idOrdenDeTrabajo || !idLineaDeOrdenDeTrabajo) {
      throw new ServicePriceError(
        "ID_INVALIDO",
        "La orden o línea de servicio indicada no es válida"
      );
    }

    const data = (await req.json()) as Record<string, unknown>;
    const precioUnitario = parseServicePrice(
      data.precioUnitario ?? data.precio_unitario
    );

    if (precioUnitario === null) {
      throw new ServicePriceError(
        "PRECIO_INVALIDO",
        "El precio del servicio debe ser un número entero no negativo"
      );
    }

    const resultado = await db.$transaction(async (tx) => {
      const orden = await tx.ordenDeTrabajo.findUnique({
        where: { idOrdenDeTrabajo },
      });

      if (!orden) {
        throw new ServicePriceError(
          "ORDEN_NO_EXISTE",
          "La orden de trabajo no existe"
        );
      }

      if (["Entregado", "Anulada"].includes(orden.estado)) {
        throw new ServicePriceError(
          "ORDEN_NO_MODIFICABLE",
          "La orden de trabajo no puede ser modificada en su estado actual"
        );
      }

      const linea = await tx.lineaDeOrdenDeTrabajo.findFirst({
        where: {
          idLineaDeOrdenDeTrabajo,
          idOrdenDeTrabajo,
          idServicio: { not: null },
        },
      });

      if (!linea) {
        throw new ServicePriceError(
          "LINEA_SERVICIO_NO_EXISTE",
          "La línea de servicio no pertenece a la orden de trabajo"
        );
      }

      const lineaActualizada = await tx.lineaDeOrdenDeTrabajo.update({
        where: { idLineaDeOrdenDeTrabajo },
        data: { precioUnitario },
        include: { servicio: true },
      });

      await recalcularTotalesOrdenTrabajo(tx, idOrdenDeTrabajo);

      const ordenActualizada = await tx.ordenDeTrabajo.findUniqueOrThrow({
        where: { idOrdenDeTrabajo },
      });

      await registrarAuditoriaOrdenTrabajo(tx, {
        idUsuario: session.user.idUsuario,
        tipoOperacion: "actualizacion_precio_servicio",
        idOrdenDeTrabajo,
        valorAnterior: {
          idLineaDeOrdenDeTrabajo,
          idServicio: linea.idServicio,
          precioUnitario: linea.precioUnitario,
          montoSubtotal: orden.montoSubtotal,
          montoTotal: orden.montoTotal,
        },
        valorNuevo: {
          idLineaDeOrdenDeTrabajo,
          idServicio: lineaActualizada.idServicio,
          precioUnitario: lineaActualizada.precioUnitario,
          montoSubtotal: ordenActualizada.montoSubtotal,
          montoTotal: ordenActualizada.montoTotal,
        },
        detalleCambio: "Actualizacion de precio de servicio de la orden",
      });

      return {
        linea: lineaActualizada,
        orden: ordenActualizada,
      };
    });

    return NextResponse.json({
      code: "PRECIO_SERVICIO_ACTUALIZADO",
      message: "Precio del servicio actualizado correctamente",
      ...resultado,
    });
  } catch (error) {
    if (error instanceof ServicePriceError) {
      const statusByCode: Record<ServicePriceError["code"], number> = {
        ID_INVALIDO: 400,
        PRECIO_INVALIDO: 400,
        ORDEN_NO_EXISTE: 404,
        LINEA_SERVICIO_NO_EXISTE: 404,
        ORDEN_NO_MODIFICABLE: 409,
      };

      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: statusByCode[error.code] }
      );
    }

    if (error instanceof WorkOrderTotalsError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: 400 }
      );
    }

    console.log("[ACTUALIZAR_PRECIO_SERVICIO_ORDEN]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
