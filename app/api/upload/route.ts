// app/api/upload/route.ts
// Motor de subida de imágenes con detección automática de entorno.
// En desarrollo (sin PUBLIC_URL configurado): guarda en public/uploads/
// En producción (con credenciales R2): sube directamente a Cloudflare R2

import { NextResponse } from "next/server"
import path from "path"
import fs from "fs"

const isR2Configured =
  process.env.CLOUDFLARE_ACCOUNT_ID &&
  process.env.CLOUDFLARE_ACCESS_KEY_ID &&
  process.env.CLOUDFLARE_SECRET_ACCESS_KEY &&
  process.env.CLOUDFLARE_R2_BUCKET_NAME &&
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL &&
  !process.env.NEXT_PUBLIC_R2_PUBLIC_URL.includes("localhost")

const MAX_FILES_PER_REQUEST = 8
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]

class UploadValidationError extends Error {}

async function saveFile(file: File) {
  if (!allowedTypes.includes(file.type)) {
    throw new UploadValidationError(
      "Tipo de archivo no permitido. Solo se aceptan: JPG, PNG, WEBP, GIF"
    )
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new UploadValidationError("El archivo supera el tamaño máximo de 5 MB")
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = path.extname(file.name) || ".jpg"
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

  if (isR2Configured) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3")

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY!,
      },
    })

    const key = `productos/${fileName}`

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads")

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const filePath = path.join(uploadsDir, fileName)
  fs.writeFileSync(filePath, buffer)

  return `/uploads/${fileName}`
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const files = [
      ...formData.getAll("files"),
      ...formData.getAll("file"),
    ].filter((item): item is File => item instanceof File && item.size > 0)

    if (files.length === 0) {
      return new NextResponse("No se recibió ningún archivo", { status: 400 })
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return new NextResponse(
        `Solo se pueden subir hasta ${MAX_FILES_PER_REQUEST} imágenes por solicitud`,
        { status: 400 }
      )
    }

    const urls = await Promise.all(files.map(saveFile))
    const status = 201

    if (urls.length === 1) {
      return NextResponse.json({ url: urls[0], urls }, { status })
    }

    return NextResponse.json({ urls }, { status })
  } catch (error) {
    console.error("[UPLOAD_POST]", error)
    if (error instanceof UploadValidationError) {
      return new NextResponse(error.message, { status: 400 })
    }

    return new NextResponse("Error interno al subir la imagen", { status: 500 })
  }
}
