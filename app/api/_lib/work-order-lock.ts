import { Prisma } from "@/generated/prisma"
import { ESTADOS_OT_CERRADOS } from "@/lib/work-order-status"
import { NextResponse } from "next/server"

export class BicycleOrderError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
  }
}

// Todos los escritores bloquean primero las órdenes, en el mismo orden.
export async function bloquearOrdenesTrabajo(
  tx: Prisma.TransactionClient,
  ids: number[]
) {
  const ordenados = [...new Set(ids)].sort((a, b) => a - b)
  await tx.$queryRaw`SELECT id_orden_de_trabajo FROM ordenes_de_trabajo
    WHERE id_orden_de_trabajo IN (${Prisma.join(ordenados)})
    ORDER BY id_orden_de_trabajo FOR UPDATE`
}

export async function exigirOrdenAbierta(
  tx: Prisma.TransactionClient,
  id: number
) {
  const orden = await tx.ordenDeTrabajo.findUnique({
    where: { idOrdenDeTrabajo: id },
  })
  if (!orden)
    throw new BicycleOrderError(404, "ORDEN_NO_EXISTE", "La orden no existe")
  if (ESTADOS_OT_CERRADOS.some((estado) => estado === orden.estado)) {
    throw new BicycleOrderError(
      409,
      "ORDEN_CERRADA",
      "No se pueden asociar bicicletas o imágenes a una orden entregada o anulada"
    )
  }
}

export function respuestaErrorBicicleta(error: unknown) {
  return error instanceof BicycleOrderError
    ? NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status }
      )
    : null
}
