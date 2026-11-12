import { ACTIVE_WORK_ORDER_STATUSES } from "@/lib/work-order-status"
import { MAX_BICYCLE_IMAGES } from "@/lib/bicycle-images"
import type { Bicicleta, OrdenTrabajoResumen } from "../types"

export function ordenAbierta(estado: string | null | undefined) {
  return ACTIVE_WORK_ORDER_STATUSES.some((codigo) => codigo === estado)
}

const objeto = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
const texto = (value: unknown) => (typeof value === "string" ? value : null)

export function normalizarOrdenesAbiertas(
  data: unknown
): OrdenTrabajoResumen[] {
  const ordenes = new Map<number, OrdenTrabajoResumen>()
  for (const raw of Array.isArray(data) ? data : []) {
    const item = objeto(raw)
    if (item.tipoOperacion !== "orden_trabajo") continue
    const detalle = objeto(item.ordenTrabajo)
    const id = Number(detalle.idOrdenDeTrabajo)
    const estado =
      texto(item.codigoEstadoOrden) ??
      texto(detalle.codigoEstadoOrden) ??
      texto(detalle.estado)
    if (!Number.isSafeInteger(id) || id <= 0 || !ordenAbierta(estado)) continue
    const cliente = objeto(item.cliente ?? detalle.cliente)
    const total = Number(item.total ?? detalle.montoTotal ?? 0)
    ordenes.set(id, {
      idOrdenDeTrabajo: id,
      estadoOrden: estado!,
      estadoOrdenNombre:
        texto(item.estadoOrden) ?? texto(detalle.estadoOrdenNombre),
      fechaEntregaEstimada: texto(detalle.fechaEntregaEstimada),
      estadoPago: texto(item.estadoPago) ?? "PENDIENTE",
      total: Number.isFinite(total) ? total : 0,
      cliente: {
        razonSocial: texto(cliente.razonSocial),
        primerNombre: texto(cliente.primerNombre),
        apellidoPaterno: texto(cliente.apellidoPaterno),
        apellidoMaterno: texto(cliente.apellidoMaterno),
        rut: texto(cliente.rut),
      },
    })
  }
  return [...ordenes.values()]
}

export class ErrorApiBicicleta extends Error {
  constructor(
    message: string,
    public status: number,
    public etapa: "consulta" | "subida" | "guardado"
  ) {
    super(message)
  }
}

export async function solicitarBicicletaApi<T>(
  url: string,
  options: RequestInit = {},
  etapa: ErrorApiBicicleta["etapa"] = "consulta"
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...options,
    })
  } catch {
    throw new ErrorApiBicicleta(
      "No se pudo completar la conexión. Revisa tu conexión e inténtalo nuevamente.",
      0,
      etapa
    )
  }
  let text: string
  try {
    text = await response.text()
  } catch {
    throw new ErrorApiBicicleta(
      "La respuesta se interrumpió. Verifica los datos antes de reintentar.",
      0,
      etapa
    )
  }
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  if (!response.ok) {
    const message =
      texto(objeto(body).message) ??
      texto(body) ??
      "No se pudo completar la operación."
    throw new ErrorApiBicicleta(message, response.status, etapa)
  }
  return body as T
}

export type EdicionBicicleta = {
  idOrdenDeTrabajo: number
  marca: string
  modelo: string
  color: string
  descripcion: string
}

export type SubidaTemporal = {
  token: string
  url: string
  finalUrl: string
  expiresAt: string
}
export async function descartarSubidas(subidas: SubidaTemporal[]) {
  if (!subidas.length) return
  try {
    // keepalive permite pedir limpieza también al salir de la página.
    await fetch("/api/upload/temporales", {
      method: "DELETE",
      credentials: "same-origin",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens: subidas.map((s) => s.token) }),
    })
  } catch {
    /* El registro persistido permite limpiar después del vencimiento. */
  }
}

export async function obtenerBicicleta(
  id: number,
  signal?: AbortSignal
): Promise<Bicicleta> {
  type Orden = NonNullable<Bicicleta["ordenDeTrabajo"]>
  const data = await solicitarBicicletaApi<
    Omit<Bicicleta, "ordenDeTrabajo"> & {
      ordenDeTrabajo:
        | (Partial<Orden> & {
            estado?: string
            venta?: { cliente?: Orden["cliente"] }
          })
        | null
    }
  >(`/api/bicycles/${id}`, { signal })
  const orden = data.ordenDeTrabajo
  return {
    ...data,
    ordenDeTrabajo: orden
      ? {
          ...orden,
          estadoOrden: orden.estado ?? orden.estadoOrden ?? "",
          cliente: orden.venta?.cliente ?? orden.cliente ?? null,
        }
      : null,
  }
}

export async function guardarEdicionBicicleta({
  id,
  valores,
  imagenes,
  archivos,
  subidas,
}: {
  id: number
  valores: EdicionBicicleta
  imagenes: string[]
  archivos: File[]
  subidas: Map<File, SubidaTemporal>
}): Promise<Bicicleta & { limpiezaArchivos?: { pendientes: number | null } }> {
  if (
    !Number.isSafeInteger(valores.idOrdenDeTrabajo) ||
    valores.idOrdenDeTrabajo <= 0
  ) {
    throw new Error("Selecciona una orden de trabajo válida.")
  }
  if (imagenes.length + archivos.length > MAX_BICYCLE_IMAGES) {
    throw new Error(
      `Solo puedes tener hasta ${MAX_BICYCLE_IMAGES} imágenes por bicicleta.`
    )
  }
  for (const archivo of archivos) {
    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        archivo.type
      ) ||
      archivo.size > 5 * 1024 * 1024 ||
      archivo.size === 0
    ) {
      throw new Error(
        "Cada imagen debe ser JPG, PNG, WEBP o GIF, con un tamaño máximo de 5 MB."
      )
    }
  }
  // Esperar todas las subidas antes de guardar. Conservar las exitosas para
  // no duplicarlas si otra falla y se reintenta desde el mismo formulario.
  const resultados = await Promise.allSettled(
    archivos.map(async (archivo) => {
      const existente = subidas.get(archivo)
      if (existente && new Date(existente.expiresAt).getTime() > Date.now())
        return
      const form = new FormData()
      form.append("file", archivo)
      const data = await solicitarBicicletaApi<SubidaTemporal>(
        "/api/upload/temporales",
        { method: "POST", body: form },
        "subida"
      )
      if (
        !data.url ||
        !data.token ||
        !data.finalUrl ||
        !Number.isFinite(new Date(data.expiresAt).getTime())
      )
        throw new ErrorApiBicicleta(
          "La imagen subida no devolvió una dirección válida.",
          500,
          "subida"
        )
      subidas.set(archivo, data)
    })
  )
  const fallo = resultados.find((r) => r.status === "rejected")
  if (fallo?.status === "rejected") throw fallo.reason

  // El PATCH existente guarda datos y reemplaza las asociaciones de imágenes
  // en una sola transacción. Nunca quitar fotos antes de completar las subidas.
  try {
    return await solicitarBicicletaApi<
      Bicicleta & { limpiezaArchivos?: { pendientes: number | null } }
    >(
      `/api/bicycles/${id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...valores,
          descripcion: valores.descripcion || null,
          imagenes: [...new Set(imagenes)],
          imagenesTemporales: archivos.map(
            (archivo) => subidas.get(archivo)!.token
          ),
        }),
      },
      "guardado"
    )
  } catch (error) {
    if (error instanceof ErrorApiBicicleta && error.status === 410) {
      void descartarSubidas(
        archivos
          .map((file) => subidas.get(file))
          .filter((s): s is SubidaTemporal => Boolean(s))
      )
      archivos.forEach((file) => subidas.delete(file))
    }
    throw error
  }
}
