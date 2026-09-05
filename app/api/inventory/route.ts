// Endpoints generales del inventario para listar productos y registrar nuevos items.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

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

function parseCategoryId(value: string | null) {
  if (value === null || value.trim() === "") {
    return null
  }

  const categoryId = Number(value)

  return Number.isInteger(categoryId) && categoryId > 0
    ? categoryId
    : Number.NaN
}

export async function GET(request: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_READ)

    if (response) {
      return response
    }

    const { searchParams } = new URL(request.url)
    const hasProductId =
      searchParams.has("idProducto") || searchParams.has("id")

    if (hasProductId) {
      const productIdValue =
        searchParams.get("idProducto") ?? searchParams.get("id")

      if (!productIdValue || productIdValue.trim() === "") {
        return NextResponse.json(
          {
            code: "ID_PRODUCTO_OBLIGATORIA",
            message: "Debe ingresar la ID del producto para realizar la búsqueda.",
          },
          { status: 400 },
        )
      }

      const productId = Number(productIdValue)

      if (!Number.isInteger(productId) || productId <= 0) {
        return NextResponse.json(
          {
            code: "ID_PRODUCTO_INVALIDA",
            message: "La ID del producto debe ser un número entero positivo.",
          },
          { status: 400 },
        )
      }

      const product = await db.producto.findUnique({
        where: { idProducto: productId },
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
    }

    const categoryId = parseCategoryId(
      searchParams.get("categoriaId") ??
        searchParams.get("idCategoria") ??
        searchParams.get("categoria"),
    )

    if (Number.isNaN(categoryId)) {
      return NextResponse.json(
        {
          code: "CATEGORIA_INVALIDA",
          message: "Debe seleccionar una categoría válida para filtrar.",
        },
        { status: 400 },
      )
    }

    if (categoryId !== null) {
      const category = await db.categoria.findUnique({
        where: { idCategoria: categoryId },
        select: {
          idCategoria: true,
          nombre: true,
          estado: true,
        },
      })

      if (!category) {
        return NextResponse.json(
          {
            code: "CATEGORIA_NO_EXISTE",
            message: "La categoría seleccionada no existe.",
          },
          { status: 404 },
        )
      }

      const products = await db.producto.findMany({
        where: {
          categoriasProducto: {
            some: { idCategoria: categoryId },
          },
        },
        orderBy: { idProducto: "desc" },
      })

      if (products.length === 0) {
        return NextResponse.json(
          {
            code: "PRODUCTOS_NO_ENCONTRADOS_EN_CATEGORIA",
            message: `No existen productos asociados a la categoría ${category.nombre}.`,
            category,
            products: [],
            count: 0,
          },
          { status: 404 },
        )
      }

      return NextResponse.json({
        code: "PRODUCTOS_FILTRADOS",
        message: `Productos de la categoría ${category.nombre}.`,
        category,
        products: products.map(withImageAlias),
        count: products.length,
      })
    }

    const products = await db.producto.findMany({
      orderBy: {
        idProducto: "desc",
      },
    })

    return NextResponse.json(products.map(withImageAlias))
  } catch (error) {
    console.log("[INVENTORY_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_CREATE)

    if (response) {
      return response
    }

    const data = await request.json()
    const stockMinimumValidation = validateStockMinimum(data.stockMinimo)

    if (stockMinimumValidation) {
      return stockMinimumValidation
    }

    const existingProduct = await db.producto.findUnique({
      where: {
        nombre: data.nombre,
      },
    })

    if (existingProduct) {
      return new NextResponse("Product already exists", { status: 409 })
    }

    const product = await db.producto.create({
      data: {
        tipoProducto: data.tipoProducto,
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        precioVenta: data.precioVenta,
        costoPromedio: data.costoPromedio ?? data.precioCosto ?? 0,
        stockActual: data.stockActual,
        stockMinimo: data.stockMinimo,
        estado: data.estado,
        urlImagen: data.urlImagen ?? data.imageUrl ?? "",
      },
    })

    return NextResponse.json(withImageAlias(product), { status: 201 })
  } catch (error) {
    console.log("[INVENTORY_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
