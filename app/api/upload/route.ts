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

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return new NextResponse("No se recibió ningún archivo", { status: 400 })
    }

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return new NextResponse(
        "Tipo de archivo no permitido. Solo se aceptan: JPG, PNG, WEBP, GIF",
        { status: 400 }
      )
    }

    // Validar tamaño (máx 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse(
        "El archivo supera el tamaño máximo de 5 MB",
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = path.extname(file.name) || ".jpg"
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

    if (isR2Configured) {
      // ─── MODO PRODUCCIÓN: Subir a Cloudflare R2 ────────────────────────────
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

      const fileUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`
      return NextResponse.json({ url: fileUrl }, { status: 201 })
    } else {
      // ─── MODO DESARROLLO: Guardar en public/uploads/ ────────────────────────
      const uploadsDir = path.join(process.cwd(), "public", "uploads")

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      const filePath = path.join(uploadsDir, fileName)
      fs.writeFileSync(filePath, buffer)

      const fileUrl = `/uploads/${fileName}`
      return NextResponse.json({ url: fileUrl }, { status: 201 })
    }
  } catch (error) {
    console.error("[UPLOAD_POST]", error)
    return new NextResponse("Error interno al subir la imagen", { status: 500 })
  }
}
