// Controlador para registrar pedidos a proveedores.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type PurchaseLine = {
  idProducto: number
  cantidadOrdenada: number
  precioCostoUnitario?: number
}

function parsePositiveInteger(value: unknown) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null
}

function parseNonNegativeNumber(value: unknown) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date
}

function parseLines(value: unknown): PurchaseLine[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null
  }

  const lines: PurchaseLine[] = []

  for (const line of value) {
    if (!line || typeof line !== "object" || Array.isArray(line)) {
      return null
    }

    const data = line as Record<string, unknown>
    const idProducto = parsePositiveInteger(data.idProducto ?? data.id_producto)
    const cantidadOrdenada = parsePositiveInteger(
      data.cantidadOrdenada ?? data.cantidad_ordenada ?? data.cantidad,
    )
    const priceValue =
      data.precioCostoUnitario ??
      data.precio_costo_unitario ??
      data.precioUnitario ??
      data.precio_unitario
    const precioCostoUnitario =
      priceValue === undefined ? undefined : parseNonNegativeNumber(priceValue)

    if (
      !idProducto ||
      !cantidadOrdenada ||
      (priceValue !== undefined && precioCostoUnitario === null)
    ) {
      return null
    }

    lines.push({
      idProducto,
      cantidadOrdenada,
      precioCostoUnitario: precioCostoUnitario ?? undefined,
    })
  }

  return lines
}

export async function POST(request: Request) {
  try {
    const { session, response } = await requirePermission(PERMISSIONS.SALES_CREATE)

    if (response || !session) {
      return response || new NextResponse("No autorizado", { status: 401 })
    }

    const providers = await db.proveedor.findMany({
      where: { estado: "activo" },
      select: { idProveedor: true },
      take: 1,
    })

    if (providers.length === 0) {
      return NextResponse.json(
        {
          code: "PROVEEDORES_NO_REGISTRADOS",
          message:
            "Debe registrar al menos un proveedor activo antes de crear una orden de compra.",
        },
        { status: 422 },
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
    const idProveedor = parsePositiveInteger(data.idProveedor ?? data.id_proveedor)
    const fechaEmisionValue = data.fechaEmision ?? data.fecha_emision
    const fechaEntregaValue =
      data.fechaEntregaEstimada ?? data.fecha_entrega_estimada
    const fechaEmision = parseDate(fechaEmisionValue)
    const fechaEntregaEstimada = parseDate(fechaEntregaValue)
    const lines = parseLines(data.productos ?? data.detalleProductos ?? data.items)

    const missingFields = [
      !idProveedor ? "proveedor" : null,
      !fechaEmision && (!fechaEmisionValue || String(fechaEmisionValue).trim() === "")
        ? "fecha de emisión"
        : null,
      !fechaEntregaEstimada &&
      (!fechaEntregaValue || String(fechaEntregaValue).trim() === "")
        ? "fecha estimada de entrega"
        : null,
      !lines ? "detalle de productos" : null,
    ].filter(Boolean)

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          code: "CAMPOS_OBLIGATORIOS",
          message: `Debe completar los campos obligatorios: ${missingFields.join(", ")}.`,
          fields: missingFields,
        },
        { status: 400 },
      )
    }

    // El bloque anterior devuelve para cualquier valor faltante; esta guarda
    // deja los datos estrechados para las consultas y el registro posterior.
    if (!idProveedor || !lines) {
      return NextResponse.json(
        {
          code: "CAMPOS_OBLIGATORIOS",
          message: "Debe completar los campos obligatorios de la orden de compra.",
        },
        { status: 400 },
      )
    }

    if (!fechaEmision || !fechaEntregaEstimada) {
      return NextResponse.json(
        {
          code: "FECHA_INVALIDA",
          message: "Las fechas deben tener el formato AAAA-MM-DD y ser fechas válidas.",
        },
        { status: 400 },
      )
    }

    if (fechaEntregaEstimada < fechaEmision) {
      return NextResponse.json(
        {
          code: "FECHAS_INCOHERENTES",
          message:
            "La fecha estimada de entrega no puede ser anterior a la fecha de emisión.",
        },
        { status: 422 },
      )
    }

    const repeatedProduct = lines.find(
      (line, index) =>
        lines.findIndex((candidate) => candidate.idProducto === line.idProducto) !==
        index,
    )

    if (repeatedProduct) {
      return NextResponse.json(
        {
          code: "PRODUCTO_REPETIDO",
          message: "Un producto solo puede aparecer una vez en el detalle de la orden.",
          idProducto: repeatedProduct.idProducto,
        },
        { status: 400 },
      )
    }

    const [provider, products] = await Promise.all([
      db.proveedor.findUnique({ where: { idProveedor } }),
      db.producto.findMany({
        where: { idProducto: { in: lines.map((line) => line.idProducto) } },
        select: { idProducto: true, nombre: true, costoPromedio: true },
      }),
    ])

    if (!provider || provider.estado !== "activo") {
      return NextResponse.json(
        {
          code: "PROVEEDOR_NO_DISPONIBLE",
          message: "El proveedor seleccionado no existe o no está activo.",
        },
        { status: 404 },
      )
    }

    const productsById = new Map(products.map((product) => [product.idProducto, product]))
    const missingProduct = lines.find((line) => !productsById.has(line.idProducto))

    if (missingProduct) {
      return NextResponse.json(
        {
          code: "PRODUCTO_NO_EXISTE",
          message: `El producto con ID ${missingProduct.idProducto} no existe.`,
        },
        { status: 404 },
      )
    }

    const resolvedLines = lines.map((line) => ({
      ...line,
      precioCostoUnitario:
        line.precioCostoUnitario ??
        Number(productsById.get(line.idProducto)!.costoPromedio),
    }))
    const montoSubtotal = resolvedLines.reduce(
      (total, line) => total + line.cantidadOrdenada * line.precioCostoUnitario,
      0,
    )
    const descuentoProductos = 0
    const descuentoGlobal = 0
    const montoTotal = montoSubtotal - descuentoProductos - descuentoGlobal
    const montoNeto = Math.round(montoTotal / 1.19)
    const montoIva = montoTotal - montoNeto

    const purchaseOrder = await db.ordenDeCompra.create({
      data: {
        idUsuario: session.user.idUsuario,
        idProveedor,
        fechaRegistro: fechaEmision,
        fechaEntregaEstimada,
        estado: "PENDIENTE",
        estadoPago: "PENDIENTE",
        estadoRecepcion: "PENDIENTE",
        montoSubtotal,
        descuentoProductos,
        descuentoGlobal,
        montoTotal,
        montoNeto,
        montoIva,
        lineas: {
          create: resolvedLines.map((line) => ({
            idProducto: line.idProducto,
            cantidadOrdenada: line.cantidadOrdenada,
            cantidadRecibida: 0,
            precioCostoUnitario: line.precioCostoUnitario,
          })),
        },
      },
      include: {
        proveedor: { select: { idProveedor: true, razonSocial: true } },
        lineas: {
          include: { producto: { select: { idProducto: true, nombre: true } } },
        },
      },
    })

    return NextResponse.json(
      {
        code: "ORDEN_COMPRA_REGISTRADA",
        message: "La orden de compra fue registrada correctamente.",
        purchaseOrder,
      },
      { status: 201 },
    )
  } catch (error) {
    console.log("[PURCHASE_ORDERS_POST]", error)
    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "No fue posible registrar la orden de compra." },
      { status: 500 },
    )
  }
}
