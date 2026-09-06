// Endpoints para registrar y consultar movimientos manuales de bodega.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

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
      const product = await tx.producto.findUnique({
        where: { idProducto },
      })

      if (!product) {
        return { type: "PRODUCTO_NO_EXISTE" as const }
      }

      // La condición se evalúa en la actualización para evitar que dos salidas
      // simultáneas dejen el stock en un valor negativo.
      if (tipoMovimiento === "SALIDA") {
        const updatedProducts = await tx.producto.updateMany({
          where: {
            idProducto,
            stockActual: { gte: cantidad },
          },
          data: {
            stockActual: { decrement: cantidad },
          },
        })

        if (updatedProducts.count === 0) {
          const currentProduct = await tx.producto.findUniqueOrThrow({
            where: { idProducto },
          })

          return {
            type: "STOCK_INSUFICIENTE" as const,
            product: currentProduct,
          }
        }
      } else {
        await tx.producto.update({
          where: { idProducto },
          data: {
            stockActual: { increment: cantidad },
          },
        })
      }

      const updatedProduct = await tx.producto.findUniqueOrThrow({
        where: { idProducto },
      })
      const stockNuevo = updatedProduct.stockActual
      const stockAnterior =
        tipoMovimiento === "ENTRADA"
          ? stockNuevo - cantidad
          : stockNuevo + cantidad

      const adjustment = await tx.ajusteInventario.create({
        data: {
          idUsuario: session.user.idUsuario,
          fechaRegistro: fechaOperacion!,
          motivo: motivo ?? "MOVIMIENTO_MANUAL",
          direccion: tipoMovimiento!,
          observacion,
        },
      })

      const adjustmentLine = await tx.lineaDeAjuste.create({
        data: {
          idAjuste: adjustment.idAjusteInventario,
          idProducto,
          cantidad,
          cantidadAnterior: stockAnterior,
          cantidadNueva: stockNuevo,
          costoUnitario: updatedProduct.costoPromedio,
        },
      })

      const registeredMovement = await tx.movimientoInventario.create({
        data: {
          idLineaDeAjuste: adjustmentLine.idLineaDeAjuste,
          fechaRegistro: fechaOperacion!,
          tipoMovimiento: tipoMovimiento!,
          cantidad,
          costoUnitario: updatedProduct.costoPromedio,
        },
      })

      return {
        type: "MOVIMIENTO_REGISTRADO" as const,
        movement: registeredMovement,
        product: updatedProduct,
        stockAnterior,
        stockNuevo,
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
