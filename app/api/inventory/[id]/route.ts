// Endpoints del inventario para consultar, actualizar o eliminar un producto por ID.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

function parseProductId(id: string): number {
  const productId = Number(id)

  if (!Number.isInteger(productId) || productId <= 0) {
    return Number.NaN
  }

  return productId
}

function withImageAlias(product: {
  idProducto: number
  urlImagen: string
}) {
  return {
    ...product,
    imagenesProducto: product.urlImagen
      ? [
          {
            idImagenProducto: product.idProducto,
            idProducto: product.idProducto,
            url: product.urlImagen,
          },
        ]
      : [],
  }
}

function validateStockMinimum(stockMinimo: unknown) {
  if (stockMinimo === undefined || stockMinimo === null || stockMinimo === "") {
    return NextResponse.json(
      {
        code: "STOCK_MINIMO_NO_CONFIGURADO",
        message:
          "Debe definir un stock mínimo para el producto antes de guardarlo.",
      },
      { status: 422 },
    )
  }

  if (
    typeof stockMinimo !== "number" ||
    !Number.isInteger(stockMinimo) ||
    stockMinimo < 0
  ) {
    return NextResponse.json(
      {
        code: "STOCK_MINIMO_INVALIDO",
        message: "El stock mínimo debe ser un número entero mayor o igual a 0.",
      },
      { status: 422 },
    )
  }

  return null
}

function parseRequiredText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null
  }

  const text = value.trim()
  return text.length > 0 && text.length <= maxLength ? text : null
}

function parseNonNegativeNumber(value: unknown, integer = false) {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN

  if (
    !Number.isFinite(numberValue) ||
    numberValue < 0 ||
    (integer && !Number.isInteger(numberValue))
  ) {
    return null
  }

  return numberValue
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_READ)

    if (response) {
      return response
    }

    const { id } = await context.params
    const productId = parseProductId(id)

    if (id.trim() === "") {
      return NextResponse.json(
        {
          code: "ID_PRODUCTO_OBLIGATORIA",
          message: "Debe ingresar la ID del producto para realizar la búsqueda.",
        },
        { status: 400 },
      )
    }

    if (Number.isNaN(productId)) {
      return NextResponse.json(
        {
          code: "ID_PRODUCTO_INVALIDA",
          message: "La ID del producto debe ser un número entero positivo.",
        },
        { status: 400 },
      )
    }

    const product = await db.producto.findUnique({
      where: {
        idProducto: productId,
      },
    })

    if (!product) {
      return NextResponse.json(
        {
          code: "PRODUCTO_NO_ENCONTRADO",
          message: `No se encontró un producto con la ID ${productId}.`,
        },
        { status: 404 },
      )
    }

    return NextResponse.json(withImageAlias(product))
  } catch (error) {
    console.log("[INVENTORY_ID_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_UPDATE)

    if (response) {
      return response
    }

    const { id } = await context.params
    const productId = parseProductId(id)

    if (Number.isNaN(productId)) {
      return new NextResponse("Invalid product id", { status: 400 })
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
    const productExists = await db.producto.findUnique({
      where: { idProducto: productId },
    })

    if (!productExists) {
      return NextResponse.json(
        { code: "PRODUCTO_NO_EXISTE", message: "Producto no encontrado." },
        { status: 404 },
      )
    }

    const updateData: {
      tipoProducto?: string
      nombre?: string
      descripcion?: string | null
      precioVenta?: number
      costoPromedio?: number
      stockActual?: number
      stockMinimo?: number
      estado?: string
      urlImagen?: string
    } = {}
    const invalidFields: string[] = []

    if ("tipoProducto" in data) {
      const value = parseRequiredText(data.tipoProducto, 20)
      if (value) updateData.tipoProducto = value
      else invalidFields.push("tipo de producto")
    }

    if ("nombre" in data) {
      const value = parseRequiredText(data.nombre, 100)
      if (value) updateData.nombre = value
      else invalidFields.push("nombre")
    }

    if ("descripcion" in data) {
      if (data.descripcion === null) {
        updateData.descripcion = null
      } else {
        const value = parseRequiredText(data.descripcion, 50)
        if (value) updateData.descripcion = value
        else invalidFields.push("descripción")
      }
    }

    if ("precioVenta" in data) {
      const value = parseNonNegativeNumber(data.precioVenta)
      if (value !== null) updateData.precioVenta = value
      else invalidFields.push("precio de venta")
    }

    const costField = "costoPromedio" in data ? "costoPromedio" : "precioCosto"
    if (costField in data) {
      const value = parseNonNegativeNumber(data[costField])
      if (value !== null) updateData.costoPromedio = value
      else invalidFields.push("costo promedio")
    }

    if ("stockActual" in data) {
      const value = parseNonNegativeNumber(data.stockActual, true)
      if (value !== null) updateData.stockActual = value
      else invalidFields.push("stock actual")
    }

    if ("stockMinimo" in data) {
      const stockMinimumValidation = validateStockMinimum(data.stockMinimo)
      if (stockMinimumValidation) return stockMinimumValidation
      updateData.stockMinimo = data.stockMinimo as number
    }

    if ("estado" in data) {
      const value = parseRequiredText(data.estado, 20)
      if (value) updateData.estado = value
      else invalidFields.push("estado")
    }

    const imageField = "urlImagen" in data ? "urlImagen" : "imageUrl"
    if (imageField in data && data[imageField] !== null) {
      const value = parseRequiredText(data[imageField], 512)
      if (value) updateData.urlImagen = value
      else invalidFields.push("foto")
    }

    if (invalidFields.length > 0) {
      return NextResponse.json(
        {
          code: "CAMPOS_INVALIDOS",
          message: `No puede guardar campos vacíos o inválidos: ${invalidFields.join(", ")}.`,
          fields: invalidFields,
        },
        { status: 400 },
      )
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          code: "SIN_CAMBIOS",
          message: "Debe indicar al menos un dato del producto para actualizar.",
        },
        { status: 400 },
      )
    }

    if (updateData.nombre) {
      const existingProduct = await db.producto.findUnique({
        where: {
          nombre: updateData.nombre,
        },
      })

      if (existingProduct && existingProduct.idProducto !== productId) {
        return new NextResponse("Product already exists", { status: 409 })
      }
    }

    const product = await db.producto.update({
      where: {
        idProducto: productId,
      },
      data: updateData,
    })

    return NextResponse.json(withImageAlias(product))
  } catch (error) {
    console.log("[INVENTORY_ID_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_DELETE)

    if (response) {
      return response
    }

    const { id } = await context.params
    const productId = parseProductId(id)

    if (Number.isNaN(productId)) {
      return new NextResponse("Invalid product id", { status: 400 })
    }

    const product = await db.producto.findUnique({
      where: {
        idProducto: productId,
      },
    })

    if (!product) {
      return new NextResponse("Product not found", { status: 404 })
    }

    await db.producto.delete({
      where: {
        idProducto: productId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.log("[INVENTORY_ID_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
