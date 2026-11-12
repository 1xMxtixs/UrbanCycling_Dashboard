import { lstat, realpath, unlink } from "node:fs/promises"
import path from "node:path"

/** Elimina únicamente archivos propios del endpoint upload. Las URLs externas se conservan. */
export async function eliminarArchivoSubido(
  url: string
): Promise<"eliminado" | "externo"> {
  if (url.startsWith("/uploads/")) {
    const nombre = url.slice("/uploads/".length)
    if (!/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(nombre)) {
      throw new Error("Ruta de archivo local no permitida")
    }
    const raiz = path.resolve(process.cwd(), "public", "uploads")
    const destino = path.resolve(raiz, nombre)
    if (path.dirname(destino) !== raiz)
      throw new Error("Ruta fuera del almacenamiento")
    try {
      // No seguir una carpeta uploads redirigida fuera del proyecto.
      if ((await realpath(raiz)) !== raiz)
        throw new Error("Directorio de almacenamiento redirigido")
      const info = await lstat(destino)
      if (!info.isFile()) throw new Error("El archivo no es un archivo regular")
      await unlink(destino)
    } catch (error) {
      if (
        !error ||
        typeof error !== "object" ||
        !("code" in error) ||
        error.code !== "ENOENT"
      )
        throw error
    }
    return "eliminado"
  }

  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "")
  if (!publicUrl || !url.startsWith(`${publicUrl}/`)) return "externo"
  const key = url.slice(publicUrl.length + 1)
  // upload almacena las imágenes de cualquier entidad bajo productos/.
  if (!/^productos\/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(key)) {
    throw new Error("Clave de almacenamiento no permitida")
  }
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Falta configuración para eliminar el archivo de R2")
  }
  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3")
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    maxAttempts: 3,
  })
  try {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }), {
      abortSignal: AbortSignal.timeout(10_000),
    })
  } finally {
    client.destroy()
  }
  return "eliminado"
}
