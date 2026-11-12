import { borrarArchivo } from "./image-storage"

/** Solo elimina archivos propios; las URLs externas se conservan. */
export async function eliminarArchivoSubido(
  url: string
): Promise<"eliminado" | "externo"> {
  if (url.startsWith("/uploads/")) {
    await borrarArchivo("local", url.slice("/uploads/".length))
    return "eliminado"
  }
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "")
  if (!base || !url.startsWith(`${base}/`)) return "externo"
  await borrarArchivo("r2", url.slice(base.length + 1))
  return "eliminado"
}
