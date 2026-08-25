import type { Prisma } from "@/generated/prisma"

type AuditClient = Pick<Prisma.TransactionClient, "auditoria">

function toAuditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(
    JSON.stringify(value, (_key, currentValue) => {
      if (typeof currentValue === "bigint") {
        return currentValue.toString()
      }

      if (currentValue instanceof Date) {
        return currentValue.toISOString()
      }

      return currentValue
    })
  ) as Prisma.InputJsonValue
}

export async function registrarAuditoriaOrdenTrabajo(
  tx: AuditClient,
  params: {
    idUsuario: number
    tipoOperacion: string
    idOrdenDeTrabajo: number
    valorAnterior: unknown
    valorNuevo: unknown
    detalleCambio?: string | null
  }
) {
  return tx.auditoria.create({
    data: {
      idUsuario: params.idUsuario,
      tipoOperacion: params.tipoOperacion,
      nombreTablaAfectada: "ordenes_de_trabajo",
      registroAfectado: params.idOrdenDeTrabajo,
      valorAnterior: toAuditJson(params.valorAnterior),
      valorNuevo: toAuditJson(params.valorNuevo),
      detalleCambio: params.detalleCambio ?? null,
    },
  })
}
