// Controlador para configurar el umbral mínimo de stock de un producto.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function parsePositiveInteger(value: string) {
  const parsedValue = Number(value)

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null
}

function parseStockThreshold(value: unknown) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN

  return Number.isInteger(parsedValue) && parsedValue >= 0
    ? parsedValue
    : null
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_UPDATE)

    if (response) {
      return response
    }

    const { id } = await context.params
    const idProducto = parsePositiveInteger(id)

    if (!idProducto) {
      return NextResponse.json(
        {
          code: "ID_PRODUCTO_INVALIDA",
          message: "La ID del producto debe ser un número entero positivo.",
        },
        { status: 400 },
      )
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          code: "DATOS_INVALIDOS",
          message: "La solicitud debe contener datos JSON válidos.",
        },
        { status: 400 },
      )
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          code: "DATOS_INVALIDOS",
          message: "La solicitud debe contener un objeto JSON válido.",
        },
        { status: 400 },
      )
    }

    const data = body as Record<string, unknown>
    const thresholdValue =
      data.stockMinimo ?? data.stock_minimo ?? data.umbralStock
    const stockMinimo = parseStockThreshold(thresholdValue)

    if (stockMinimo === null) {
      return NextResponse.json(
        {
          code: "UMBRAL_STOCK_INVALIDO",
          message:
            "El umbral de stock debe ser un número entero mayor o igual a 0.",
        },
        { status: 422 },
      )
    }

    const product = await db.producto.findUnique({
      where: { idProducto },
      select: { idProducto: true, nombre: true },
    })

    if (!product) {
      return NextResponse.json(
        {
          code: "PRODUCTO_NO_EXISTE",
          message: `El producto con ID ${idProducto} no está registrado en el inventario.`,
        },
        { status: 404 },
      )
    }

    const updatedProduct = await db.producto.update({
      where: { idProducto },
      data: { stockMinimo },
      select: {
        idProducto: true,
        nombre: true,
        stockActual: true,
        stockMinimo: true,
      },
    })

    return NextResponse.json({
      code: "UMBRAL_STOCK_CONFIGURADO",
      message: `El umbral de stock de ${updatedProduct.nombre} fue configurado correctamente.`,
      product: updatedProduct,
      stockBajo: updatedProduct.stockActual <= updatedProduct.stockMinimo,
    })
  } catch (error) {
    console.log("[INVENTORY_STOCK_THRESHOLD_PATCH]", error)
    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message: "No fue posible configurar el umbral de stock.",
      },
      { status: 500 },
    )
  }
}
