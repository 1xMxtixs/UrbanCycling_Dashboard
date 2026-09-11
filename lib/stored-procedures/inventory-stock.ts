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
