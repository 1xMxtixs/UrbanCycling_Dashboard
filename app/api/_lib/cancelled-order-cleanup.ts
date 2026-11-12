import { db } from "@/lib/db"
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit"
import { eliminarArchivoSubido } from "./delete-upload"
import type { Prisma } from "@/generated/prisma"
import { encolarBorrado } from "./image-jobs"

// Compartido por la API de OT y la API que utiliza punto de venta.
export async function eliminarBicicletasOrden(
  tx: Prisma.TransactionClient,
  idOrdenDeTrabajo: number,
  idUsuario: number
) {
  const bicicletas = await tx.bicicleta.findMany({
    where: { idOrdenDeTrabajo },
    include: { imagenes: true },
  })
  const archivosPendientes = [
    ...new Set(bicicletas.flatMap((b) => b.imagenes.map((i) => i.urlImagen))),
  ]
  // La limpieza administrativa también recupera fallos de las anulaciones.
  await encolarBorrado(tx, archivosPendientes, idUsuario, 0)
  await tx.imagenBicicleta.deleteMany({
    where: { bicicleta: { idOrdenDeTrabajo } },
  })
  await tx.bicicleta.deleteMany({ where: { idOrdenDeTrabajo } })
  return { bicicletas, archivosPendientes }
}

function pendientes(value: unknown): string[] {
  if (!value || typeof value !== "object" || !("archivosPendientes" in value))
    return []
  return Array.isArray(value.archivosPendientes)
    ? value.archivosPendientes.filter(
        (url): url is string => typeof url === "string"
      )
    : []
}

// La auditoría de anulación contiene el trabajo pendiente incluso si el proceso
// se interrumpe tras el commit. Repetir PATCH ANULADA vuelve a intentar la limpieza.
export async function limpiarArchivosOrdenAnulada(
  idOrdenDeTrabajo: number,
  idUsuario: number
) {
  const registro = await db.auditoria.findFirst({
    where: {
      nombreTablaAfectada: "ordenes_de_trabajo",
      registroAfectado: idOrdenDeTrabajo,
      tipoOperacion: { in: ["anulacion_orden", "limpieza_archivos_anulacion"] },
    },
    orderBy: { idAuditoria: "desc" },
  })
  const urls = [...new Set(pendientes(registro?.valorNuevo))]
  const archivosPendientes: string[] = []
  let eliminados = 0
  let conservados = 0
  let externos = 0
  for (const url of urls) {
    try {
      // No borrar una imagen que todavía usa otra bicicleta, producto o garantía.
      const referencias = await Promise.all([
        db.imagenBicicleta.count({ where: { urlImagen: url } }),
        db.producto.count({ where: { urlImagen: url } }),
        db.imagenGarantia.count({ where: { urlImagen: url } }),
      ])
      if (referencias.some((cantidad) => cantidad > 0)) {
        conservados++
      } else if ((await eliminarArchivoSubido(url)) === "externo") {
        externos++
      } else {
        eliminados++
      }
    } catch (error) {
      console.error("[ANULACION_LIMPIEZA_ARCHIVO]", error)
      archivosPendientes.push(url)
    }
  }
  if (urls.length > 0) {
    await registrarAuditoriaOrdenTrabajo(db, {
      idUsuario,
      idOrdenDeTrabajo,
      tipoOperacion: "limpieza_archivos_anulacion",
      valorAnterior: { archivosPendientes: urls },
      valorNuevo: { archivosPendientes, eliminados, conservados, externos },
      detalleCambio: archivosPendientes.length
        ? "Limpieza de archivos pendiente de reintento"
        : "Limpieza de archivos finalizada",
    })
  }
  return {
    eliminados,
    conservados,
    externos,
    pendientes: archivosPendientes.length,
  }
}
