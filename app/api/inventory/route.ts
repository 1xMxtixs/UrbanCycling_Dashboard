// Endpoints generales del inventario para listar productos y registrar nuevos items.
import { NextResponse } from "next/server"

import { EstadoRegistro } from "@/generated/prisma"
import { db } from "@/lib/db"
import { resolverEstadoRegistro } from "@/lib/estado-registro"
import { PERMISSIONS } from "@/lib/permissions"
import { parseProductSupplierCode } from "@/lib/product-supplier-code"
import { requirePermission } from "@/lib/require-permission"

function withImageAlias(product: {
  idProducto: number
  urlImagen: string
  categoriasProducto?: Array<{
    categoria: {
      idCategoria: number
      nombre: string
      descripcion: string | null
    }
  }>
}) {
  return {
    ...product,
    categoriasProducto: product.categoriasProducto?.map(({ categoria }) => categoria) ?? [],
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

function parseCategoryIds(value: unknown): number[] | null | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!Array.isArray(value)) {
    return null
  }

  const categoryIds = value.map(Number)

  return categoryIds.every((id) => Number.isInteger(id) && id > 0)
    ? Array.from(new Set(categoryIds))
    : null
}

const productCategoriesInclude = {
  categoriasProducto: {
    include: {
      categoria: {
        select: {
          idCategoria: true,
          nombre: true,
          descripcion: true,
        },
      },
    },
  },
} as const

async function validateCategoryIds(categoryIds: number[]) {
  if (categoryIds.length === 0) {
    return true
  }

  const categories = await db.categoria.findMany({
    where: {
      idCategoria: { in: categoryIds },
      estado: EstadoRegistro.ACTIVO,
    },
    select: { idCategoria: true },
  })

  return categories.length === categoryIds.length
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

/**
 * Convierte los parámetros del código de proveedor al mismo formato utilizado
 * por las operaciones de creación y actualización de productos.
 */
function parseSupplierCodeFilter(searchParams: URLSearchParams) {
  const filterData: Record<string, unknown> = {}

  if (searchParams.has("codigoProveedor")) {
    filterData.codigoProveedor = searchParams.get("codigoProveedor")
  }

  if (searchParams.has("codigo_proveedor")) {
    filterData.codigo_proveedor = searchParams.get("codigo_proveedor")
  }

  return parseProductSupplierCode(filterData)
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

/**
 * GET /api/inventory
 * Lista productos o consulta uno por ID. Admite filtros combinables por
 * categoriaId y codigoProveedor para consultar asociaciones del inventario.
 */
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
        include: productCategoriesInclude,
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

    const supplierCodeFilter = parseSupplierCodeFilter(searchParams)

    if (supplierCodeFilter.status === "invalid") {
      return NextResponse.json(
        {
          code: "CODIGO_PROVEEDOR_INVALIDO",
          message:
            "El código de proveedor debe contener entre 1 y 50 caracteres.",
        },
        { status: 400 },
      )
    }

    const supplierCode =
      supplierCodeFilter.status === "valid"
        ? supplierCodeFilter.value
        : null

    const category =
      categoryId !== null
        ? await db.categoria.findUnique({
            where: { idCategoria: categoryId },
            select: {
              idCategoria: true,
              nombre: true,
              estado: true,
            },
          })
        : null

    if (categoryId !== null && !category) {
      return NextResponse.json(
        {
          code: "CATEGORIA_NO_EXISTE",
          message: "La categoría seleccionada no existe.",
        },
        { status: 404 },
      )
    }

    const hasCategoryFilter = categoryId !== null
    const hasSupplierCodeFilter = supplierCode !== null

    if (hasCategoryFilter || hasSupplierCodeFilter) {
      const products = await db.producto.findMany({
        where: {
          ...(supplierCode !== null
            ? { codigoProveedor: supplierCode }
            : {}),
          ...(categoryId !== null
            ? {
                categoriasProducto: {
                  some: { idCategoria: categoryId },
                },
              }
            : {}),
        },
        orderBy: { idProducto: "desc" },
        include: productCategoriesInclude,
      })

      if (supplierCode !== null) {
        return NextResponse.json({
          code: "PRODUCTOS_PROVEEDOR_CARGADOS",
          message:
            products.length > 0
              ? `Productos asociados al código ${supplierCode}.`
              : `No existen productos asociados al código ${supplierCode}.`,
          codigoProveedor: supplierCode,
          ...(category ? { category } : {}),
          products: products.map(withImageAlias),
          count: products.length,
        })
      }

      if (products.length === 0 && category) {
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
        message: `Productos de la categoría ${category!.nombre}.`,
        category,
        products: products.map(withImageAlias),
        count: products.length,
      })
    }

    const products = await db.producto.findMany({
      include: productCategoriesInclude,
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

/**
 * POST /api/inventory
 * Crea un producto, valida su stock mínimo, EstadoRegistro y categorías, y
 * devuelve el registro con los aliases de imagen esperados por el frontend.
 */
export async function POST(request: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_CREATE)

    if (response) {
      return response
    }

    let data

    try {
      data = await request.json()
    } catch {
      return NextResponse.json(
        {
          code: "DATOS_INVALIDOS",
          message: "La solicitud debe contener datos JSON válidos.",
        },
        { status: 400 },
      )
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        {
          code: "DATOS_INVALIDOS",
          message: "La solicitud debe contener un objeto JSON válido.",
        },
        { status: 400 },
      )
    }

    const supplierCodeResult = parseProductSupplierCode(
      data as Record<string, unknown>,
    )

    if (supplierCodeResult.status === "invalid") {
      return NextResponse.json(
        {
          code: "CODIGO_PROVEEDOR_INVALIDO",
          message:
            "El código de proveedor debe contener entre 1 y 50 caracteres.",
        },
        { status: 400 },
      )
    }

    const stockMinimumValidation = validateStockMinimum(data.stockMinimo)

    if (stockMinimumValidation) {
      return stockMinimumValidation
    }

    const categoryIds = parseCategoryIds(data.categoriaIds)

    if (categoryIds === null) {
      return NextResponse.json(
        {
          code: "CATEGORIAS_INVALIDAS",
          message: "Las categorías seleccionadas no son válidas.",
        },
        { status: 400 },
      )
    }

    const normalizedCategoryIds = categoryIds ?? []
    const categoriesAreValid = await validateCategoryIds(normalizedCategoryIds)

    if (!categoriesAreValid) {
      return NextResponse.json(
        {
          code: "CATEGORIAS_INVALIDAS",
          message: "Una o más categorías no existen o están inactivas.",
        },
        { status: 400 },
      )
    }

    const existingProduct = await db.producto.findUnique({
      where: {
        nombre: data.nombre,
      },
    })

    if (existingProduct) {
      return new NextResponse("Product already exists", { status: 409 })
    }

    const estado = resolverEstadoRegistro(data.estado ?? EstadoRegistro.ACTIVO)

    if (!estado) {
      return NextResponse.json(
        {
          code: "ESTADO_REGISTRO_INVALIDO",
          message: "El estado del producto debe ser ACTIVO o INACTIVO",
        },
        { status: 400 },
      )
    }

    const product = await db.$transaction(async (tx) => {
      const createdProduct = await tx.producto.create({
        data: {
          tipoProducto: data.tipoProducto,
          codigoProveedor:
            supplierCodeResult.status === "valid"
              ? supplierCodeResult.value
              : null,
          nombre: data.nombre,
          descripcion: data.descripcion ?? null,
          precioVenta: data.precioVenta,
          costoPromedio: data.costoPromedio ?? data.precioCosto ?? 0,
          stockActual: data.stockActual,
          stockMinimo: data.stockMinimo,
          estado,
          urlImagen: data.urlImagen ?? data.imageUrl ?? "",
        },
      })

      if (normalizedCategoryIds.length > 0) {
        await tx.categoriaProducto.createMany({
          data: normalizedCategoryIds.map((idCategoria) => ({
            idProducto: createdProduct.idProducto,
            idCategoria,
          })),
        })
      }

      return tx.producto.findUniqueOrThrow({
        where: { idProducto: createdProduct.idProducto },
        include: productCategoriesInclude,
      })
    })

    return NextResponse.json(withImageAlias(product), { status: 201 })
  } catch (error) {
    console.log("[INVENTORY_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
