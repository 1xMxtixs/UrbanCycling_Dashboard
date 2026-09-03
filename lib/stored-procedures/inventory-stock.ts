import type { Prisma } from "@/generated/prisma";

export type ProductoParaDescontar = {
  idProducto: number;
  cantidad: number;
  idLineaDeVenta?: number | null;
  idLineaDeOrdenDeTrabajo?: number | null;
};

/** Descuenta productos y registra sus movimientos dentro de la transaccion actual. */
export async function descontarStockProductos(
  tx: Prisma.TransactionClient,
  items: ProductoParaDescontar[]
) {
  if (items.length === 0) {
    return;
  }

  await tx.$executeRaw`
    CALL sp_descontar_stock_productos(${JSON.stringify(items)})
  `;
}
