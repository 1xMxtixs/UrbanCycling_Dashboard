import { NextResponse } from "next/server"
import { requireAnyPermission } from "@/lib/require-permission"
import { PERMISSIONS } from "@/lib/permissions"
import {
  crearImagenTemporal,
  descartarTemporales,
  ImagenError,
} from "@/app/api/_lib/image-jobs"

export async function POST(request: Request) {
  // La subida temporal se comparte entre la creacion y la edicion.
  const { session, response } = await requireAnyPermission([
    PERMISSIONS.BICYCLES_CREATE,
    PERMISSIONS.BICYCLES_UPDATE,
  ])
  if (response || !session)
    return response ?? new NextResponse("No autorizado", { status: 401 })
  try {
    const form = await request.formData()
    const file = form.get("file")
    if (
      !(file instanceof File) ||
      !file.size ||
      file.size > 5 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type
      )
    ) {
      throw new ImagenError(
        "Seleccione una imagen JPG, PNG, WEBP o GIF de hasta 5 MB"
      )
    }
    return NextResponse.json(
      await crearImagenTemporal(file, session.user.idUsuario),
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ImagenError)
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    console.error("[IMAGEN_TEMPORAL_SUBIDA]", error)
    return NextResponse.json(
      { message: "No se pudo subir la imagen temporal" },
      { status: 500 }
    )
  }
}
export async function DELETE(request: Request) {
  // Quien pudo subir el temporal tambien puede descartarlo al cerrar el formulario.
  const { session, response } = await requireAnyPermission([
    PERMISSIONS.BICYCLES_CREATE,
    PERMISSIONS.BICYCLES_UPDATE,
  ])
  if (response || !session)
    return response ?? new NextResponse("No autorizado", { status: 401 })
  try {
    const body = await request.json()
    await descartarTemporales(body.tokens, session.user.idUsuario)
    return NextResponse.json({ descartadas: true })
  } catch (error) {
    if (error instanceof ImagenError)
      return NextResponse.json(
        { message: error.message },
        { status: error.status }
      )
    console.error("[IMAGEN_TEMPORAL_DESCARTE]", error)
    return NextResponse.json(
      { message: "La limpieza temporal queda pendiente de reintento" },
      { status: 503 }
    )
  }
}
