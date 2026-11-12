import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/require-auth"
import { db } from "@/lib/db"
import {
  ejecutarLimpieza,
  encolarBorrado,
  intentarBorrado,
} from "@/app/api/_lib/image-jobs"
import { usarR2 } from "@/app/api/_lib/image-storage"

export async function POST() {
  const { session, response } = await requireAuth()
  if (response || !session)
    return response ?? new NextResponse("No autorizado", { status: 401 })
  if (session.user.rol !== "Administrador")
    return new NextResponse("Sin permisos", { status: 403 })
  const userId = session.user.idUsuario
  try {
    const checkpoint = await db.auditoria.findFirst({
      where: {
        nombreTablaAfectada: "archivos_bicicleta",
        tipoOperacion: "imagen_cursor",
      },
      orderBy: { idAuditoria: "desc" },
    })
    const valor = checkpoint?.valorNuevo as {
      cursor?: string | null
      almacen?: string
    } | null
    const almacen = usarR2()
      ? `r2:${process.env.CLOUDFLARE_R2_BUCKET_NAME}`
      : "local"
    const resultado = await ejecutarLimpieza(
      valor?.almacen === almacen ? (valor.cursor ?? undefined) : undefined
    )
    // Encolar antes de avanzar el cursor: nunca perder candidatos si cae el proceso.
    const job = await encolarBorrado(db, resultado.candidatos, userId, 0)
    const limpieza = await intentarBorrado(job)
    const data = { valorNuevo: { cursor: resultado.cursor, almacen } }
    if (checkpoint)
      await db.auditoria.update({
        where: { idAuditoria: checkpoint.idAuditoria },
        data,
      })
    else
      await db.auditoria.create({
        data: {
          ...data,
          idUsuario: userId,
          nombreTablaAfectada: "archivos_bicicleta",
          registroAfectado: 0,
          tipoOperacion: "imagen_cursor",
          detalleCambio: "Cursor de reconciliación periódica de archivos",
        },
      })
    return NextResponse.json({
      procesadas: resultado.procesadas,
      huerfanosDetectados: resultado.candidatos.length,
      limpieza,
      hayMasArchivos: resultado.cursor !== null,
    })
  } catch (error) {
    console.error("[LIMPIEZA_IMAGENES]", error)
    return NextResponse.json(
      {
        message:
          "No se pudo completar la limpieza; las tareas siguen registradas para reintento",
      },
      { status: 503 }
    )
  }
}
