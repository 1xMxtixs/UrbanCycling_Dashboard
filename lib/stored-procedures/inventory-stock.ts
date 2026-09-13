import type { Prisma } from "@/generated/prisma"

type StockProcedureInput = {
  idProducto: number
  stockNuevo: number
  idUsuario: number
  motivo: string | null
  observacion: string | null
}

type LastInsertIdRow = {
  idMovimientoInventario: bigint | number | string
}

function parseMovementId(value: LastInsertIdRow["idMovimientoInventario"]) {
  const idMovimientoInventario = Number(value)

  if (
    !Number.isSafeInteger(idMovimientoInventario) ||
    idMovimientoInventario <= 0
  ) {
    throw new Error("La SP no devolvió un identificador de movimiento válido")
  }

  return idMovimientoInventario
}

/**
 * Ejecuta el ajuste de stock dentro de la transacción que recibió el bloqueo
 * de la fila del producto. No debe invocarse fuera de una transacción activa.
 */
export async function registrarMovimientoConAjusteStock(
  tx: Prisma.TransactionClient,
  input: StockProcedureInput,
) {
  await tx.$queryRaw<Array<{ success: boolean | number }>>`
    CALL sp_ajustar_stock(
      ${input.idProducto},
      ${input.stockNuevo},
      ${input.idUsuario},
      ${input.motivo},
      ${input.observacion}
    )
  `

  // La última inserción de la SP corresponde a movimientos_inventario.
  // LAST_INSERT_ID() es local a la conexión de esta transacción.
  const [lastInsert] = await tx.$queryRaw<LastInsertIdRow[]>`
    SELECT LAST_INSERT_ID() AS idMovimientoInventario
  `

  if (!lastInsert) {
    throw new Error("No fue posible obtener el movimiento registrado")
  }

  const idMovimientoInventario = parseMovementId(lastInsert.idMovimientoInventario)

  const [movement, product] = await Promise.all([
    tx.movimientoInventario.findUniqueOrThrow({
      where: { idMovimientoInventario },
    }),
    tx.producto.findUniqueOrThrow({
      where: { idProducto: input.idProducto },
    }),
  ])

  return { movement, product }
}

export type ProductoParaDescontar = {
  idProducto: number;
  cantidad: number;
  idLineaDeVenta?: number | null;
  idLineaDeOrdenDeTrabajo?: number | null;
};

export type AjusteStockLineaOrdenInput = {
  idProducto: number;
  idLineaDeOrdenDeTrabajo: number;
  diferencia: number;
  costoUnitario: Prisma.Decimal | number;
};

export class InventoryStockError extends Error {
  constructor(
    public readonly code: "STOCK_INSUFICIENTE" | "PRODUCTO_NO_EXISTE",
    message: string
  ) {
    super(message);
    this.name = "InventoryStockError";
  }
}

/** Descuenta productos y registra sus movimientos dentro de la transaccion actual. */
export async function descontarStockProductos(
  tx: Prisma.TransactionClient,
  items: ProductoParaDescontar[]
) {
  if (items.length === 0) {
    return;
  }

  try {
    await tx.$executeRaw`
      CALL sp_descontar_stock_productos(${JSON.stringify(items)})
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes("stock insuficiente")) {
      throw new InventoryStockError(
        "STOCK_INSUFICIENTE",
        "No hay stock suficiente para uno de los insumos solicitados"
      );
    }

    if (normalizedMessage.includes("producto no encontrado")) {
      throw new InventoryStockError(
        "PRODUCTO_NO_EXISTE",
        "Uno de los insumos asociados no existe"
      );
    }

    throw error;
  }
}

/**
 * Ajusta el stock por la diferencia entre la cantidad anterior y la nueva de
 * una linea de producto de una orden de trabajo.
 *
 * Una diferencia positiva representa consumo adicional (SALIDA), mientras
 * que una diferencia negativa devuelve unidades a bodega (ENTRADA).
 */
export async function ajustarStockPorCantidadLineaOrden(
  tx: Prisma.TransactionClient,
  input: AjusteStockLineaOrdenInput
) {
  if (input.diferencia === 0) {
    return null;
  }

  const cantidadMovimiento = Math.abs(input.diferencia);
  const tipoMovimiento = input.diferencia > 0 ? "SALIDA" : "ENTRADA";

  if (input.diferencia > 0) {
    const resultado = await tx.producto.updateMany({
      where: {
        idProducto: input.idProducto,
        stockActual: {
          gte: cantidadMovimiento,
        },
      },
      data: {
        stockActual: {
          decrement: cantidadMovimiento,
        },
      },
    });

    if (resultado.count === 0) {
      const producto = await tx.producto.findUnique({
        where: {
          idProducto: input.idProducto,
        },
        select: {
          stockActual: true,
        },
      });

      if (!producto) {
        throw new InventoryStockError(
          "PRODUCTO_NO_EXISTE",
          "El insumo asociado a la linea no existe"
        );
      }

      throw new InventoryStockError(
        "STOCK_INSUFICIENTE",
        "No hay stock suficiente para aumentar la cantidad del insumo"
      );
    }
  } else {
    try {
      await tx.producto.update({
        where: {
          idProducto: input.idProducto,
        },
        data: {
          stockActual: {
            increment: cantidadMovimiento,
          },
        },
      });
    } catch (error) {
      const producto = await tx.producto.findUnique({
        where: {
          idProducto: input.idProducto,
        },
        select: {
          idProducto: true,
        },
      });

      if (!producto) {
        throw new InventoryStockError(
          "PRODUCTO_NO_EXISTE",
          "El insumo asociado a la linea no existe"
        );
      }

      throw error;
    }
  }

  const movimiento = await tx.movimientoInventario.create({
    data: {
      idLineaDeOrdenDeTrabajo: input.idLineaDeOrdenDeTrabajo,
      tipoMovimiento,
      cantidad: cantidadMovimiento,
      costoUnitario: input.costoUnitario,
    },
  });

  const producto = await tx.producto.findUniqueOrThrow({
    where: {
      idProducto: input.idProducto,
    },
  });

  const stockNuevo = producto.stockActual;
  const stockAnterior =
    tipoMovimiento === "SALIDA"
      ? stockNuevo + cantidadMovimiento
      : stockNuevo - cantidadMovimiento;

  return {
    movimiento,
    producto,
    tipoMovimiento,
    cantidad: cantidadMovimiento,
    stockAnterior,
    stockNuevo,
  };
}
