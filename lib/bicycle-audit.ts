import type { Prisma } from "@/generated/prisma"

type AuditClient = Pick<Prisma.TransactionClient, "auditoria">

type BicycleAuditParams = {
  idUsuario: number
  idBicicleta: number
  idOrdenDeTrabajo: number
  tipoOperacion: "CREAR_BICICLETA" | "EDITAR_BICICLETA" | "ELIMINAR_BICICLETA"
  valorAnterior: unknown
  valorNuevo: unknown
}

/** Convierte valores de Prisma en JSON almacenable por el modelo Auditoria. */
function toAuditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, currentValue) => {
      if (typeof currentValue === "bigint") return currentValue.toString()
      if (currentValue instanceof Date) return currentValue.toISOString()
      return currentValue
    })
  ) as Prisma.InputJsonValue
}

/**
 * Registra una modificacion de bicicleta dentro de la misma transaccion que
 * realiza la operacion de negocio.
 */
export async function registrarAuditoriaBicicleta(
  tx: AuditClient,
  params: BicycleAuditParams
) {
  return tx.auditoria.create({
    data: {
      idUsuario: params.idUsuario,
      tipoOperacion: params.tipoOperacion,
      nombreTablaAfectada: "bicicletas",
      registroAfectado: params.idBicicleta,
      valorAnterior: toAuditJson(params.valorAnterior),
      valorNuevo: toAuditJson(params.valorNuevo),
      detalleCambio: `Bicicleta de la ODT #${params.idOrdenDeTrabajo}`,
    },
  })
}
