import type { Prisma } from "@/generated/prisma";

type StoredProcedureOutput = {
  montoTotal: number | string | null;
};

/** Recalcula y persiste los montos de una orden dentro de la transaccion actual. */
export async function recalcularTotalesOrdenTrabajo(
  tx: Prisma.TransactionClient,
  idOrdenDeTrabajo: number
) {
  await tx.$executeRaw`
    CALL sp_calcular_total_orden_de_trabajo(
      ${idOrdenDeTrabajo},
      @monto_total_orden_trabajo
    )
  `;

  const resultado = await tx.$queryRaw<StoredProcedureOutput[]>`
    SELECT @monto_total_orden_trabajo AS montoTotal
  `;

  return Number(resultado[0]?.montoTotal ?? 0);
}
