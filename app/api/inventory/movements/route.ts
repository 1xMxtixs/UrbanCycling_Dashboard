// Endpoints para registrar y consultar movimientos manuales de bodega.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { registrarMovimientoConAjusteStock } from "@/lib/stored-procedures/inventory-stock"

type MovementType = "ENTRADA" | "SALIDA"

function parsePositiveInteger(value: unknown) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN
  }

  return parsedValue
}

function parseOperationDate(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    return null
  }

  const parsedDate = new Date(value)

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

function parseMovementType(value: unknown): MovementType | null {
  if (typeof value !== "string") {
    return null
  }

  const normalizedValue = value.trim().toUpperCase()

  return normalizedValue === "ENTRADA" || normalizedValue === "SALIDA"
    ? normalizedValue
    : null
}

function getOptionalText(value: unknown, maxLength: number) {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== "string" || value.trim().length > maxLength) {
    return undefined
  }

  return value.trim() || null
}

export async function POST(request: Request) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.INVENTORY_UPDATE,
    )

    if (response || !session) {
      return response || new NextResponse("No autorizado", { status: 401 })
    }

    let data: unknown

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

    const movementData = data as Record<string, unknown>
    const idProducto = parsePositiveInteger(
      movementData.idProducto ?? movementData.id_producto,
    )
    const cantidad = parsePositiveInteger(movementData.cantidad)
    const tipoMovimiento = parseMovementType(
      movementData.tipoMovimiento ??
        movementData.tipo_movimiento ??
        movementData.operacion,
    )
    const fechaOperacion = parseOperationDate(
      movementData.fechaOperacion ??
        movementData.fecha_operacion ??
        movementData.fecha,
    )

    const missingFields = [
      Number.isNaN(idProducto) ? "producto" : null,
      Number.isNaN(cantidad) ? "cantidad" : null,
      !tipoMovimiento ? "operación" : null,
      !fechaOperacion ? "fecha de operación" : null,
    ].filter(Boolean)

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          code: "CAMPOS_OBLIGATORIOS",
          message: `Debe completar campos válidos: ${missingFields.join(", ")}.`,
          fields: missingFields,
        },
        { status: 400 },
      )
    }

    const motivo = getOptionalText(movementData.motivo, 50)
    const observacion = getOptionalText(movementData.observacion, 500)

    if (motivo === undefined || observacion === undefined) {
      return NextResponse.json(
        {
          code: "DATOS_INVALIDOS",
          message:
            "El motivo debe tener hasta 50 caracteres y la observación hasta 500 caracteres.",
        },
        { status: 400 },
      )
    }

    const result = await db.$transaction(async (tx) => {
      // El bloqueo y el cálculo del stock objetivo ocurren en la misma
      // transacción. Así, movimientos simultáneos del mismo producto se
      // serializan antes de llamar a la SP.
      const products = await tx.$queryRaw<
        Array<{
          idProducto: number
          nombre: string
          stockActual: number
          stockMinimo: number
        }>
      >`
        SELECT
          id_producto AS idProducto,
          nombre,
          stock_actual AS stockActual,
          stock_minimo AS stockMinimo
        FROM productos
        WHERE id_producto = ${idProducto}
        FOR UPDATE
      `
      // $queryRaw puede devolver enteros sin signo como bigint. Normalizarlos
      // evita errores de serialización al responder validaciones de stock.
      const rawProduct = products[0]
      const product = rawProduct
        ? {
            ...rawProduct,
            idProducto: Number(rawProduct.idProducto),
            stockActual: Number(rawProduct.stockActual),
            stockMinimo: Number(rawProduct.stockMinimo),
          }
        : null

      if (!product) {
        return { type: "PRODUCTO_NO_EXISTE" as const }
      }

      if (tipoMovimiento === "SALIDA" && product.stockActual < cantidad) {
        return {
          type: "STOCK_INSUFICIENTE" as const,
          product,
        }
      }

      const stockAnterior = product.stockActual
      const stockNuevo =
        tipoMovimiento === "ENTRADA"
          ? stockAnterior + cantidad
          : stockAnterior - cantidad

      const registered = await registrarMovimientoConAjusteStock(tx, {
        idProducto,
        stockNuevo,
        idUsuario: session.user.idUsuario,
        motivo: motivo ?? "MOVIMIENTO_MANUAL",
        observacion,
      })

      return {
        type: "MOVIMIENTO_REGISTRADO" as const,
        movement: registered.movement,
        product: registered.product,
        stockAnterior,
        stockNuevo: registered.product.stockActual,
      }
    })

    if (result.type === "PRODUCTO_NO_EXISTE") {
      return NextResponse.json(
        {
          code: result.type,
          message: `El producto con ID ${idProducto} no existe.`,
        },
        { status: 404 },
      )
    }

    if (result.type === "STOCK_INSUFICIENTE") {
      return NextResponse.json(
        {
          code: result.type,
          message: `No hay stock suficiente para registrar la salida de ${result.product.nombre}.`,
          stockActual: result.product.stockActual,
          cantidadSolicitada: cantidad,
        },
        { status: 409 },
      )
    }

    const stockBajo = result.stockNuevo <= result.product.stockMinimo
    const cruzoUmbral =
      result.stockAnterior > result.product.stockMinimo && stockBajo
    const stockNormalizado =
      result.stockAnterior <= result.product.stockMinimo &&
      result.stockNuevo > result.product.stockMinimo

    return NextResponse.json(
      {
        code: "MOVIMIENTO_REGISTRADO",
        message: "El movimiento de bodega fue registrado correctamente.",
        movement: {
          idMovimientoInventario: result.movement.idMovimientoInventario,
          idProducto,
          tipoMovimiento: result.movement.tipoMovimiento,
          cantidad: result.movement.cantidad,
          // La SP registra la fecha con NOW(); se devuelve la fecha efectiva.
          fechaOperacion: result.movement.fechaRegistro,
          stockAnterior: result.stockAnterior,
          stockNuevo: result.stockNuevo,
        },
        alert: stockBajo
          ? {
              code: "STOCK_BAJO_DETECTADO",
              message: cruzoUmbral
                ? `${result.product.nombre} alcanzó su umbral crítico de stock.`
                : `${result.product.nombre} continúa con stock igual o inferior a su umbral mínimo.`,
              product: {
                idProducto,
                nombre: result.product.nombre,
                stockActual: result.stockNuevo,
                stockMinimo: result.product.stockMinimo,
              },
              cruzoUmbral,
            }
          : stockNormalizado
            ? {
                code: "STOCK_NORMALIZADO",
                message: `El stock de ${result.product.nombre} fue normalizado.`,
                product: {
                  idProducto,
                  nombre: result.product.nombre,
                  stockActual: result.stockNuevo,
                  stockMinimo: result.product.stockMinimo,
                },
              }
            : null,
      },
      { status: 201 },
    )
  } catch (error) {
    console.log("[INVENTORY_MOVEMENTS_POST]", error)
    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.INVENTORY_READ)

    if (response) {
      return response
    }

    const movements = await db.movimientoInventario.findMany({
      where: {
        idLineaDeAjuste: {
          not: null,
        },
      },
      orderBy: {
        fechaRegistro: "desc",
      },
      include: {
        lineaDeAjuste: {
          include: {
            producto: true,
            ajusteInventario: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      movements: movements.map((movement) => ({
        idMovimientoInventario: movement.idMovimientoInventario,
        idProducto: movement.lineaDeAjuste?.idProducto,
        producto: movement.lineaDeAjuste?.producto.nombre,
        tipoMovimiento: movement.tipoMovimiento,
        cantidad: movement.cantidad,
        fechaOperacion: movement.fechaRegistro,
        stockAnterior: movement.lineaDeAjuste?.cantidadAnterior,
        stockNuevo: movement.lineaDeAjuste?.cantidadNueva,
        motivo: movement.lineaDeAjuste?.ajusteInventario.motivo,
        observacion: movement.lineaDeAjuste?.ajusteInventario.observacion,
        usuario: movement.lineaDeAjuste?.ajusteInventario.usuario.primerNombre,
      })),
      count: movements.length,
    })
  } catch (error) {
    console.log("[INVENTORY_MOVEMENTS_GET]", error)
    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 },
    )
  }
}
