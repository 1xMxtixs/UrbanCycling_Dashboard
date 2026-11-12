import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma"
import {
  describirTemporal,
  guardarTemporal,
  confirmarArchivo,
  borrarArchivo,
  listarArchivosAntiguos,
  type ArchivoTemporal,
} from "./image-storage"
import { eliminarArchivoSubido } from "./delete-upload"

const TABLA = "archivos_bicicleta"
const TTL = 24 * 60 * 60 * 1000
const LEASE = 10 * 60 * 1000
type Tx = Prisma.TransactionClient
type Job = ArchivoTemporal & {
  userId: number
  expires: number
  lease?: string
  leaseUntil?: number
  bicicletaId?: number
}
export type Preparada = {
  id: bigint
  job: Job
  lease: string
  reutilizada: boolean
}
export class ImagenError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message)
  }
}
function secreto() {
  const value =
    process.env.IMAGE_UPLOAD_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET
  if (!value)
    throw new ImagenError(
      "Falta configurar IMAGE_UPLOAD_SECRET o NEXTAUTH_SECRET para las subidas temporales",
      503
    )
  return value
}
function firmar(payload: string) {
  return createHmac("sha256", secreto()).update(payload).digest("base64url")
}
function emitir(id: bigint, job: Job) {
  const payload = Buffer.from(
    JSON.stringify({ id: String(id), uid: job.userId, exp: job.expires })
  ).toString("base64url")
  return `${payload}.${firmar(payload)}`
}
function verificar(token: unknown, uid: number, aceptarVencido = false) {
  if (typeof token !== "string" || token.length > 2000)
    throw new ImagenError("Identificador temporal inválido")
  const [payload, firma, extra] = token.split(".")
  if (!payload || !firma || extra)
    throw new ImagenError("Identificador temporal inválido")
  const expected = Buffer.from(firmar(payload))
  const actual = Buffer.from(firma)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new ImagenError("Firma de imagen inválida", 403)
  let data
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
  } catch {
    throw new ImagenError("Identificador temporal inválido")
  }
  if (!data || typeof data !== "object" || !/^[1-9]\d{0,19}$/.test(data.id) || data.uid !== uid || !Number.isFinite(data.exp))
    throw new ImagenError("La imagen no pertenece al usuario", 403)
  if (!aceptarVencido && data.exp <= Date.now())
    throw new ImagenError(
      "La imagen temporal venció; vuelve a seleccionarla",
      410
    )
  return BigInt(data.id)
}
function datos(value: Prisma.JsonValue | null): Job {
  // El descriptor lo genera el servidor, nunca se reconstruyen claves desde el token.
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !("backend" in value) ||
    !("temporal" in value) ||
    !("definitivo" in value)
  )
    throw new ImagenError("Registro de imagen inválido", 409)
  return value as unknown as Job
}
async function bloquearJob(tx: Tx, id: bigint) {
  await tx.$queryRaw`SELECT id_auditoria FROM auditorias WHERE id_auditoria = ${id} FOR UPDATE`
  const row = await tx.auditoria.findUnique({ where: { idAuditoria: id } })
  if (!row || row.nombreTablaAfectada !== TABLA)
    throw new ImagenError("La imagen temporal no existe", 404)
  return row
}
const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue

export async function archivoEnUso(
  url: string,
  client: Pick<Tx, "imagenBicicleta" | "producto" | "imagenGarantia"> = db
) {
  const counts = await Promise.all([
    client.imagenBicicleta.count({ where: { urlImagen: url } }),
    client.producto.count({ where: { urlImagen: url } }),
    client.imagenGarantia.count({ where: { urlImagen: url } }),
  ])
  return counts.some((n) => n > 0)
}

export async function crearImagenTemporal(file: File, userId: number) {
  secreto() // Fallar antes de escribir si no se puede firmar la respuesta.
  const job: Job = {
    ...describirTemporal(userId, file.type),
    userId,
    expires: Date.now() + TTL,
  }
  // Registrar antes de subir: incluso una interrupción deja trabajo recuperable.
  const row = await db.auditoria.create({
    data: {
      idUsuario: userId,
      tipoOperacion: "imagen_temporal",
      nombreTablaAfectada: TABLA,
      registroAfectado: 0,
      valorNuevo: json(job),
      detalleCambio: "Subida temporal de imagen de bicicleta",
    },
  })
  try {
    await guardarTemporal(job, Buffer.from(await file.arrayBuffer()), file.type)
  } catch (error) {
    try {
      await limpiarJob(row.idAuditoria, true, userId)
    } catch {
      /* Queda registrado para reintento. */
    }
    throw error
  }
  return {
    token: emitir(row.idAuditoria, job),
    url: job.urlTemporal,
    finalUrl: job.url,
    expiresAt: new Date(job.expires).toISOString(),
  }
}

export async function prepararImagenes(
  tokens: unknown,
  userId: number,
  bicicletaId: number
): Promise<Preparada[]> {
  if (tokens === undefined) return []
  if (!Array.isArray(tokens) || tokens.length > 8)
    throw new ImagenError("Lista de imágenes temporales inválida")
  const ids = [...new Set(tokens.map((t) => verificar(t, userId)))].sort(
    (a, b) => (a < b ? -1 : 1)
  )
  const preparadas: Preparada[] = []
  try {
    for (const id of ids) {
      const preparada = await db.$transaction(async (tx) => {
        const row = await bloquearJob(tx, id)
        const job = datos(row.valorNuevo)
        if (job.userId !== userId || job.expires <= Date.now())
          throw new ImagenError(
            "La imagen temporal venció o pertenece a otro usuario",
            410
          )
        if (row.tipoOperacion === "imagen_borrada")
          throw new ImagenError(
            "La imagen temporal ya no está disponible; vuelve a seleccionarla",
            410
          )
        if (
          ["imagen_confirmada", "imagen_archivada"].includes(row.tipoOperacion)
        ) {
          const asociada = await tx.imagenBicicleta.findFirst({
            where: { idBicicleta: bicicletaId, urlImagen: job.url },
          })
          if (job.bicicletaId !== bicicletaId || !asociada)
            throw new ImagenError("La imagen ya fue utilizada", 409)
          return { id, job, lease: "", reutilizada: true }
        }
        if (row.tipoOperacion !== "imagen_temporal")
          throw new ImagenError(
            "La imagen está siendo procesada; vuelve a intentarlo",
            409
          )
        const lease = randomUUID()
        const reservado = { ...job, lease, leaseUntil: Date.now() + LEASE }
        await tx.auditoria.update({
          where: { idAuditoria: id },
          data: {
            tipoOperacion: "imagen_preparada",
            valorNuevo: json(reservado),
          },
        })
        return { id, job: reservado, lease, reutilizada: false }
      })
      preparadas.push(preparada)
      if (!preparada.reutilizada) await confirmarArchivo(preparada.job)
    }
    return preparadas
  } catch (error) {
    await liberarPreparadas(preparadas)
    throw error
  }
}
export async function confirmarPreparadas(
  tx: Tx,
  preparadas: Preparada[],
  bicicletaId: number
) {
  for (const p of preparadas) {
    if (p.reutilizada) continue
    const row = await bloquearJob(tx, p.id)
    const job = datos(row.valorNuevo)
    if (
      row.tipoOperacion !== "imagen_preparada" ||
      job.lease !== p.lease ||
      (job.leaseUntil ?? 0) < Date.now()
    )
      throw new ImagenError(
        "La reserva de imagen venció; vuelve a intentarlo",
        409
      )
    await tx.auditoria.update({
      where: { idAuditoria: p.id },
      data: {
        tipoOperacion: "imagen_confirmada",
        registroAfectado: bicicletaId,
        valorNuevo: json({
          ...job,
          bicicletaId,
          lease: null,
          leaseUntil: null,
        }),
      },
    })
  }
}
export async function liberarPreparadas(preparadas: Preparada[]) {
  for (const p of preparadas) {
    if (p.reutilizada) continue
    try {
      // La reserva impide otro guardado mientras se intenta compensar el fallo.
      const reservada = await db.$transaction(async (tx) => {
        const row = await bloquearJob(tx, p.id)
        if (
          row.tipoOperacion !== "imagen_preparada" ||
          datos(row.valorNuevo).lease !== p.lease
        )
          return false
        await tx.auditoria.update({
          where: { idAuditoria: p.id },
          data: {
            valorNuevo: json({ ...p.job, leaseUntil: Date.now() + LEASE }),
          },
        })
        return true
      })
      if (!reservada) continue
      if (!(await archivoEnUso(p.job.url)))
        await borrarArchivo(p.job.backend, p.job.definitivo)
      await db.auditoria.updateMany({
        where: {
          idAuditoria: p.id,
          tipoOperacion: "imagen_preparada",
          valorNuevo: { path: "$.lease", equals: p.lease },
        },
        data: {
          tipoOperacion: "imagen_temporal",
          valorNuevo: json({ ...p.job, lease: null, leaseUntil: null }),
        },
      })
    } catch (error) {
      console.error("[IMAGEN_COMPENSACION_PENDIENTE]", error)
    }
  }
}

export async function encolarBorrado(
  tx: Pick<Tx, "auditoria">,
  urls: string[],
  userId: number,
  bicicletaId: number
) {
  if (!urls.length) return null
  const row = await tx.auditoria.create({
    data: {
      idUsuario: userId,
      nombreTablaAfectada: TABLA,
      registroAfectado: bicicletaId,
      tipoOperacion: "imagen_eliminar",
      valorNuevo: { urls: [...new Set(urls)] },
      detalleCambio: "Limpieza pendiente de imágenes retiradas",
    },
  })
  return row.idAuditoria
}
export async function procesarBorrado(
  id: bigint,
  deadline = Date.now() + 20_000
) {
  const lease = randomUUID()
  const reservado = await db.$transaction(async (tx) => {
    const row = await bloquearJob(tx, id)
    const value = row.valorNuevo as {
      urls?: string[]
      leaseUntil?: number
    } | null
    if (
      row.tipoOperacion !== "imagen_eliminar" &&
      !(
        row.tipoOperacion === "imagen_limpiando" &&
        (value?.leaseUntil ?? 0) < Date.now()
      )
    )
      return null
    const urls = (value?.urls ?? []).filter((u) => typeof u === "string")
    await tx.auditoria.update({
      where: { idAuditoria: id },
      data: {
        tipoOperacion: "imagen_limpiando",
        fechaRegistro: new Date(),
        valorNuevo: { urls, lease, leaseUntil: Date.now() + LEASE },
      },
    })
    return urls
  })
  if (!reservado) return { pendientes: 0 }
  const pendientes: string[] = []
  for (const url of reservado) {
    if (Date.now() > deadline) {
      pendientes.push(url)
      continue
    }
    try {
      if (!(await archivoEnUso(url))) await eliminarArchivoSubido(url)
    } catch (error) {
      console.error("[IMAGEN_BORRADO_PENDIENTE]", error)
      pendientes.push(url)
    }
  }
  await db.auditoria.updateMany({
    where: {
      idAuditoria: id,
      tipoOperacion: "imagen_limpiando",
      valorNuevo: { path: "$.lease", equals: lease },
    },
    data: {
      tipoOperacion: pendientes.length ? "imagen_eliminar" : "imagen_limpia",
      valorNuevo: { urls: pendientes },
    },
  })
  return { pendientes: pendientes.length }
}
export async function intentarBorrado(id: bigint | null) {
  if (!id) return { pendientes: 0 }
  try {
    return await procesarBorrado(id)
  } catch (error) {
    console.error("[IMAGEN_BORRADO_PENDIENTE]", error)
    return { pendientes: null }
  }
}

async function limpiarJob(id: bigint, soloTemporal = false, owner?: number) {
  const lease = randomUUID()
  const reservado = await db.$transaction(async (tx) => {
    const row = await bloquearJob(tx, id)
    if (
      ![
        "imagen_temporal",
        "imagen_preparada",
        "imagen_confirmada",
        "imagen_archivada",
        "imagen_descartando",
      ].includes(row.tipoOperacion)
    )
      return null
    const job = datos(row.valorNuevo)
    if (owner !== undefined && job.userId !== owner)
      throw new ImagenError("La imagen no pertenece al usuario", 403)
    if (
      (row.tipoOperacion === "imagen_preparada" ||
        row.tipoOperacion === "imagen_descartando") &&
      (job.leaseUntil ?? 0) > Date.now()
    )
      return null
    if (
      !soloTemporal &&
      row.tipoOperacion === "imagen_temporal" &&
      job.expires > Date.now()
    )
      return null
    const confirmada =
      row.tipoOperacion === "imagen_confirmada" ||
      row.tipoOperacion === "imagen_archivada"
    if (
      confirmada &&
      owner === undefined &&
      row.tipoOperacion === "imagen_archivada" &&
      row.fechaRegistro.getTime() > Date.now() - 48 * 60 * 60 * 1000
    )
      return null
    await tx.auditoria.update({
      where: { idAuditoria: id },
      data: {
        tipoOperacion: "imagen_descartando",
        fechaRegistro: new Date(),
        valorNuevo: json({ ...job, lease, leaseUntil: Date.now() + LEASE }),
      },
    })
    return { job, confirmada }
  })
  if (!reservado) return
  const { job, confirmada } = reservado
  try {
    const enUso = await archivoEnUso(job.url)
    const temporalEnUso = await archivoEnUso(job.urlTemporal)
    // Al cancelar un modal, una imagen confirmada nunca se elimina del destino.
    if (!enUso && !(soloTemporal && confirmada))
      await borrarArchivo(job.backend, job.definitivo)
    if (!temporalEnUso) await borrarArchivo(job.backend, job.temporal)
    await db.auditoria.updateMany({
      where: {
        idAuditoria: id,
        tipoOperacion: "imagen_descartando",
        valorNuevo: { path: "$.lease", equals: lease },
      },
      data: {
        tipoOperacion:
          enUso || temporalEnUso || (soloTemporal && confirmada)
            ? "imagen_archivada"
            : "imagen_borrada",
        valorNuevo: json({ ...job, lease: null, leaseUntil: null }),
      },
    })
  } catch (error) {
    // Dejar la reserva persistida; la limpieza administrativa la recupera al vencer.
    console.error("[IMAGEN_TEMPORAL_LIMPIEZA_PENDIENTE]", error)
    throw error
  }
}
export async function descartarTemporales(tokens: unknown, userId: number) {
  if (!Array.isArray(tokens) || tokens.length > 8)
    throw new ImagenError("Lista de temporales inválida")
  const ids = tokens.map((t) => verificar(t, userId, true))
  for (const id of ids) await limpiarJob(id, true, userId)
}
export async function limpiarConfirmadas(preparadas: Preparada[]) {
  for (const p of preparadas) {
    try {
      await limpiarJob(p.id, true, p.job.userId)
    } catch {
      /* La reserva persistida se reintentará desde la limpieza administrativa. */
    }
  }
}

export async function ejecutarLimpieza(cursor?: string) {
  const deadline = Date.now() + 20_000
  const pendientes = await db.auditoria.findMany({
    where: {
      nombreTablaAfectada: TABLA,
      tipoOperacion: {
        in: [
          "imagen_eliminar",
          "imagen_limpiando",
          "imagen_confirmada",
          "imagen_preparada",
          "imagen_descartando",
        ],
      },
    },
    orderBy: [{ fechaRegistro: "asc" }, { idAuditoria: "asc" }],
    take: 20,
  })
  const vencidos = await db.auditoria.findMany({
    where: {
      nombreTablaAfectada: TABLA,
      tipoOperacion: "imagen_temporal",
      fechaRegistro: { lt: new Date(Date.now() - TTL) },
    },
    orderBy: { idAuditoria: "asc" },
    take: 20,
  })
  let procesadas = 0
  for (const row of [...pendientes, ...vencidos]) {
    if (Date.now() > deadline) break
    try {
      if (["imagen_eliminar", "imagen_limpiando"].includes(row.tipoOperacion))
        await procesarBorrado(row.idAuditoria, deadline)
      else await limpiarJob(row.idAuditoria)
      procesadas++
    } catch (error) {
      console.error("[IMAGEN_LIMPIEZA_REINTENTO]", error)
    }
  }
  // La reconciliación es paginada y conserva SIEMPRE los archivos referenciados.
  const page =
    Date.now() < deadline
      ? await listarArchivosAntiguos(cursor)
      : { urls: [], cursor: cursor ?? null }
  const candidatos: string[] = []
  for (const url of page.urls)
    if (!(await archivoEnUso(url))) candidatos.push(url)
  if (candidatos.length) {
    // Actor del registro original; si se trata de un archivo legacy sin registro,
    // se requiere que el llamador admin lo encole desde el endpoint.
    return { procesadas, candidatos, cursor: page.cursor }
  }
  return { procesadas, candidatos, cursor: page.cursor }
}
