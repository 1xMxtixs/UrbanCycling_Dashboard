export const MAX_BICYCLE_IMAGES = 8

type BicycleImageInput = {
  imagenUrl?: unknown
  imagenes?: unknown
  imagenesUrl?: unknown
  imagenesUrls?: unknown
  url?: unknown
  urlImagen?: unknown
}

function normalizarImagen(image: unknown) {
  if (typeof image === "string") {
    return image.trim()
  }

  if (image && typeof image === "object" && "urlImagen" in image) {
    return String(image.urlImagen ?? "").trim()
  }

  if (image && typeof image === "object" && "url" in image) {
    return String(image.url ?? "").trim()
  }

  return ""
}

export function normalizarImagenesBicicleta(data: BicycleImageInput) {
  const rawImages = data.imagenes ?? data.imagenesUrl ?? data.imagenesUrls
  const urls = Array.isArray(rawImages)
    ? rawImages.map(normalizarImagen).filter(Boolean)
    : []
  const singleUrl = data.urlImagen ?? data.url ?? data.imagenUrl
  const imagenUrl = singleUrl ? String(singleUrl).trim() : ""

  return Array.from(new Set([imagenUrl, ...urls].filter(Boolean)))
}
