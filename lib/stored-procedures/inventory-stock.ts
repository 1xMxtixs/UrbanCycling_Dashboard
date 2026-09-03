import type { Prisma } from "@/generated/prisma";

export type ProductoParaDescontar = {
  idProducto: number;
  cantidad: number;
  idLineaDeVenta?: number | null;
  idLineaDeOrdenDeTrabajo?: number | null;
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
