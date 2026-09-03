import type { Prisma } from "@/generated/prisma";

type StoredProcedureOutput = {
  montoTotal: number | string | null;
};

export class WorkOrderTotalsError extends Error {
  constructor(
    public readonly code: "DESCUENTO_EXCEDE_SUBTOTAL",
    message: string
  ) {
    super(message);
    this.name = "WorkOrderTotalsError";
  }
}

/** Recalcula y persiste los montos de una orden dentro de la transaccion actual. */
export async function recalcularTotalesOrdenTrabajo(
  tx: Prisma.TransactionClient,
  idOrdenDeTrabajo: number
) {
  try {
    await tx.$executeRaw`
      CALL sp_calcular_total_orden_de_trabajo(
        ${idOrdenDeTrabajo},
        @monto_total_orden_trabajo
      )
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      message
        .toLowerCase()
        .includes("descuento total aplicado supera el subtotal")
    ) {
      throw new WorkOrderTotalsError(
        "DESCUENTO_EXCEDE_SUBTOTAL",
        "El descuento total aplicado supera el subtotal de la orden de trabajo"
      );
    }

    throw error;
  }

  const resultado = await tx.$queryRaw<StoredProcedureOutput[]>`
    SELECT @monto_total_orden_trabajo AS montoTotal
  `;

  return Number(resultado[0]?.montoTotal ?? 0);
}
