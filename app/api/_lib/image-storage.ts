import {
  mkdir,
  readdir,
  lstat,
  readFile,
  realpath,
  unlink,
  writeFile,
} from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import {
  S3Client,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"

export type ArchivoTemporal = {
  backend: "local" | "r2"
  temporal: string
  definitivo: string
  urlTemporal: string
  url: string
}
const nombreSeguro = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/
const claveSegura =
  /^(?:productos\/|tmp\/bicicletas\/\d+\/)[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/
export function usarR2() {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_R2_BUCKET_NAME &&
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL &&
    !process.env.NEXT_PUBLIC_R2_PUBLIC_URL.includes("localhost")
  )
}
function clienteR2() {
  const {
    CLOUDFLARE_ACCOUNT_ID: account,
    CLOUDFLARE_ACCESS_KEY_ID: accessKeyId,
    CLOUDFLARE_SECRET_ACCESS_KEY: secretAccessKey,
    CLOUDFLARE_R2_BUCKET_NAME: bucket,
  } = process.env
  if (!account || !accessKeyId || !secretAccessKey || !bucket)
    throw new Error("Falta configuración de R2")
  return {
    bucket,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${account}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      maxAttempts: 2,
    }),
  }
}
async function rutaLocal(key: string, crear = false) {
  if (
    !nombreSeguro.test(key) &&
    !/^tmp\/bicicletas\/\d+\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(key)
  )
    throw new Error("Ruta local no permitida")
  const raiz = path.resolve(process.cwd(), "public", "uploads")
  const destino = path.resolve(raiz, key)
  if (!destino.startsWith(raiz + path.sep))
    throw new Error("Ruta fuera del almacenamiento")
  if (crear) {
    // Verificar el padre antes de crear cada subdirectorio.
    const publicDir = path.dirname(raiz)
    if ((await realpath(publicDir)) !== publicDir)
      throw new Error("Almacenamiento redirigido")
    let padre = publicDir
    const segmentos = path
      .relative(publicDir, path.dirname(destino))
      .split(path.sep)
    for (const segmento of segmentos) {
      const carpeta = path.join(padre, segmento)
      try {
        await mkdir(carpeta)
      } catch (error) {
        if (
          !(
            error &&
            typeof error === "object" &&
            "code" in error &&
            error.code === "EEXIST"
          )
        )
          throw error
      }
      if ((await realpath(carpeta)) !== carpeta)
        throw new Error("Almacenamiento redirigido")
      padre = carpeta
    }
  }
  // Verificar cada carpeta existente: no seguir enlaces fuera del almacenamiento.
  let carpeta = path.dirname(destino)
  while (carpeta.length >= raiz.length) {
    if ((await realpath(carpeta)) !== carpeta)
      throw new Error("Almacenamiento redirigido")
    if (carpeta === raiz) break
    carpeta = path.dirname(carpeta)
  }
  return destino
}
export function describirTemporal(
  userId: number,
  mime: string
): ArchivoTemporal {
  const ext = (
    {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    } as Record<string, string>
  )[mime]
  if (!ext || !Number.isSafeInteger(userId) || userId <= 0)
    throw new Error("Imagen o usuario inválido")
  const nombre = `${Date.now()}-${randomUUID()}.${ext}`
  const temporal = `tmp/bicicletas/${userId}/${nombre}`
  if (usarR2()) {
    const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!.replace(/\/+$/, "")
    return {
      backend: "r2",
      temporal,
      definitivo: `productos/${nombre}`,
      urlTemporal: `${base}/${temporal}`,
      url: `${base}/productos/${nombre}`,
    }
  }
  return {
    backend: "local",
    temporal,
    definitivo: nombre,
    urlTemporal: `/uploads/${temporal}`,
    url: `/uploads/${nombre}`,
  }
}
export async function guardarTemporal(
  archivo: ArchivoTemporal,
  buffer: Buffer,
  mime: string
) {
  if (archivo.backend === "local")
    return writeFile(await rutaLocal(archivo.temporal, true), buffer, {
      flag: "wx",
    })
  if (!claveSegura.test(archivo.temporal)) throw new Error("Clave R2 inválida")
  const { client, bucket } = clienteR2()
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: archivo.temporal,
        Body: buffer,
        ContentType: mime,
      }),
      { abortSignal: AbortSignal.timeout(10_000) }
    )
  } finally {
    client.destroy()
  }
}
export async function confirmarArchivo(archivo: ArchivoTemporal) {
  if (archivo.backend === "local") {
    const origen = await rutaLocal(archivo.temporal)
    if (!(await lstat(origen)).isFile()) throw new Error("Temporal inválido")
    // Leer antes de crear la copia y evitar seguir un destino enlazado.
    const buffer = await readFile(origen)
    const destino = await rutaLocal(archivo.definitivo, true)
    try {
      await writeFile(destino, buffer, { flag: "wx" })
    } catch (error) {
      if (
        !(
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "EEXIST"
        )
      )
        throw error
      if (!(await lstat(destino)).isFile()) throw new Error("Destino inválido")
    }
    return
  }
  if (
    !claveSegura.test(archivo.temporal) ||
    !claveSegura.test(archivo.definitivo)
  )
    throw new Error("Clave R2 inválida")
  const { client, bucket } = clienteR2()
  try {
    await client.send(
      new CopyObjectCommand({
        Bucket: bucket,
        Key: archivo.definitivo,
        CopySource: `${bucket}/${archivo.temporal.split("/").map(encodeURIComponent).join("/")}`,
      }),
      { abortSignal: AbortSignal.timeout(10_000) }
    )
  } finally {
    client.destroy()
  }
}
export async function borrarArchivo(
  backend: ArchivoTemporal["backend"],
  key: string
) {
  if (backend === "local") {
    try {
      const destino = await rutaLocal(key)
      if (!(await lstat(destino)).isFile())
        throw new Error("Archivo local inválido")
      await unlink(destino)
    } catch (error) {
      if (
        !(
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "ENOENT"
        )
      )
        throw error
    }
    return
  }
  if (!claveSegura.test(key)) throw new Error("Clave R2 inválida")
  const { client, bucket } = clienteR2()
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }), {
      abortSignal: AbortSignal.timeout(10_000),
    })
  } finally {
    client.destroy()
  }
}

/** Un lote por llamada; el cursor evita bloquearse en archivos recientes o compartidos. */
export async function listarArchivosAntiguos(cursor?: string) {
  const limite = Date.now() - 48 * 60 * 60 * 1000
  if (usarR2()) {
    const { client, bucket } = clienteR2()
    try {
      const page = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: "productos/",
          MaxKeys: 100,
          ContinuationToken: cursor,
        }),
        { abortSignal: AbortSignal.timeout(10_000) }
      )
      const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!.replace(/\/+$/, "")
      return {
        urls: (page.Contents ?? [])
          .filter(
            (o) =>
              o.Key &&
              /^productos\/\d+-[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(o.Key) &&
              o.LastModified &&
              o.LastModified.getTime() < limite
          )
          .map((o) => `${base}/${o.Key}`),
        cursor: page.NextContinuationToken ?? null,
      }
    } finally {
      client.destroy()
    }
  }
  const raiz = path.resolve(process.cwd(), "public", "uploads")
  try {
    if ((await realpath(raiz)) !== raiz)
      throw new Error("Almacenamiento redirigido")
    const nombres = (await readdir(raiz))
      .filter((n) => /^\d+-[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(n))
      .sort()
      .filter((n) => !cursor || n > cursor)
    const lote = nombres.slice(0, 100)
    const urls: string[] = []
    for (const nombre of lote) {
      const info = await lstat(path.join(raiz, nombre))
      if (info.isFile() && info.mtimeMs < limite)
        urls.push(`/uploads/${nombre}`)
    }
    return { urls, cursor: nombres.length > 100 ? lote.at(-1)! : null }
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    )
      return { urls: [], cursor: null }
    throw error
  }
}
