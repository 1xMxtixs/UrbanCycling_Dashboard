import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import {
  ajustarStockPorCantidadLineaOrden,
  InventoryStockError,
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
      | "ESTADO_ORDEN_NO_PERMITE_AJUSTE"
      | "LINEA_NO_ES_INSUMO"
      | "CANTIDAD_INVALIDA"
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
    const tieneCantidad = Object.prototype.hasOwnProperty.call(
      data,
      "cantidad"
    );

    if (!tienePrecio && !tieneDescuento && !tieneCantidad) {
      throw new WorkOrderLineError(
        "CAMPOS_LINEA_REQUERIDOS",
        "Debe indicar cantidad, precioUnitario o descuentoUnitario"
      );
    }

    const resultado = await db.$transaction(async (tx) => {
      if (tieneCantidad) {
        await tx.$queryRaw`
          SELECT id_orden_de_trabajo
          FROM ordenes_de_trabajo
          WHERE id_orden_de_trabajo = ${idOrdenDeTrabajo}
          FOR UPDATE
        `;
      }

      const orden = await tx.ordenDeTrabajo.findUnique({
        where: { idOrdenDeTrabajo },
      });

      if (!orden) {
        throw new WorkOrderLineError(
          "ORDEN_NO_EXISTE",
          "La orden de trabajo no existe"
        );
      }

      if (tieneCantidad && orden.estado !== "En curso") {
        throw new WorkOrderLineError(
          "ESTADO_ORDEN_NO_PERMITE_AJUSTE",
          'La orden debe estar en estado "En curso" para ajustar sus insumos'
        );
      }

      if (!tieneCantidad && ["Entregado", "Anulada"].includes(orden.estado)) {
        throw new WorkOrderLineError(
          "ORDEN_NO_MODIFICABLE",
          "La orden de trabajo no puede ser modificada en su estado actual"
        );
      }

      if (tieneCantidad) {
        await tx.$queryRaw`
          SELECT id_linea_de_orden_de_trabajo
          FROM lineas_de_orden_de_trabajo
          WHERE id_linea_de_orden_de_trabajo = ${idLineaDeOrdenDeTrabajo}
            AND id_orden_de_trabajo = ${idOrdenDeTrabajo}
          FOR UPDATE
        `;
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

      if (tieneCantidad && !linea.idProducto) {
        throw new WorkOrderLineError(
          "LINEA_NO_ES_INSUMO",
          "La línea seleccionada no corresponde a un repuesto o material"
        );
      }

      const cantidadAnterior = linea.cantidad;
      const cantidadNueva = tieneCantidad
        ? Number(data.cantidad)
        : cantidadAnterior;

      if (!Number.isInteger(cantidadNueva) || cantidadNueva <= 0) {
        throw new WorkOrderLineError(
          "CANTIDAD_INVALIDA",
          "La nueva cantidad debe ser un número entero mayor que cero"
        );
      }

      const diferenciaCantidad = cantidadNueva - cantidadAnterior;

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

      const ajusteInventario =
        diferenciaCantidad !== 0 && linea.idProducto
          ? await ajustarStockPorCantidadLineaOrden(tx, {
              idProducto: linea.idProducto,
              idLineaDeOrdenDeTrabajo: linea.idLineaDeOrdenDeTrabajo,
              diferencia: diferenciaCantidad,
              costoUnitario: linea.costoUnitario,
            })
          : null;

      const lineaActualizada = await tx.lineaDeOrdenDeTrabajo.update({
        where: { idLineaDeOrdenDeTrabajo },
        data: {
          cantidad: cantidadNueva,
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
        tipoOperacion:
          tieneCantidad
            ? "ajuste_cantidad_insumo"
            : "modificacion_linea_orden",
        idOrdenDeTrabajo,
        valorAnterior: {
          idLineaDeOrdenDeTrabajo,
          idProducto: linea.idProducto,
          cantidad: cantidadAnterior,
          precioUnitario: linea.precioUnitario,
          descuentoUnitario: linea.descuentoUnitario,
          stock: ajusteInventario?.stockAnterior,
          montoSubtotal: orden.montoSubtotal,
          montoTotal: orden.montoTotal,
        },
        valorNuevo: {
          idLineaDeOrdenDeTrabajo,
          idProducto: linea.idProducto,
          cantidad: cantidadNueva,
          diferenciaCantidad,
          precioUnitario,
          descuentoUnitario,
          stock: ajusteInventario?.stockNuevo,
          montoSubtotal: ordenActualizada.montoSubtotal,
          montoTotal: ordenActualizada.montoTotal,
        },
        detalleCambio:
          tieneCantidad
            ? `Cantidad del insumo modificada de ${cantidadAnterior} a ${cantidadNueva}`
            : "Modificacion de precio o descuento de línea",
      });

      return {
        linea: lineaActualizada,
        ajusteInventario,
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
        CANTIDAD_INVALIDA: 400,
        ORDEN_NO_EXISTE: 404,
        LINEA_NO_EXISTE: 404,
        ORDEN_NO_MODIFICABLE: 409,
        ESTADO_ORDEN_NO_PERMITE_AJUSTE: 409,
        LINEA_NO_ES_INSUMO: 409,
      };

      return NextResponse.json(
        {
          code: error.code,
          message: error.message,
        },
        { status: statusByCode[error.code] }
      );
    }

    if (error instanceof InventoryStockError) {
      return NextResponse.json(
        {
          code: error.code,
          message: error.message,
        },
        {
          status: error.code === "PRODUCTO_NO_EXISTE" ? 404 : 409,
        }
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
