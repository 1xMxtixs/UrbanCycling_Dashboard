// Controlador para registrar pagos y recalcular el saldo de una orden de compra.
import { NextResponse } from "next/server"

import {
  EstadoOrdenCompra,
  EstadoPago,
  EstadoPagoOrdenCompra,
  EstadoRegistro,
} from "@/generated/prisma"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{ id: string }>
}

type PaymentInput = {
  monto: number
  metodoPago: string
}

const MAX_DECIMAL_12_0 = 999_999_999_999

class PurchaseOrderPaymentError extends Error {
  /** Mantiene el código y el status HTTP que devolverá el controlador. */
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Convierte el ID de ruta en un entero positivo compatible con INT UNSIGNED.
 * Devuelve null cuando el parámetro no representa un ID válido.
 */
function parsePurchaseOrderId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 && id <= 4_294_967_295
    ? id
    : null
}

/**
 * Lee montos enteros en pesos y verifica el rango de DECIMAL(12, 0).
 * Rechaza decimales, valores no finitos, cero y montos negativos.
 */
function parsePositiveAmount(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : Number.NaN

  return Number.isSafeInteger(amount) &&
    amount > 0 &&
    amount <= MAX_DECIMAL_12_0
    ? amount
    : null
}

/**
 * Valida el objeto del pago y normaliza el código del método de pago.
 * Acepta las variantes camelCase y snake_case usadas por la API.
 */
function parsePaymentInput(value: unknown): PaymentInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const data = value as Record<string, unknown>
  const monto = parsePositiveAmount(data.monto)
  const metodoPagoValue = data.metodoPago ?? data.metodo_pago
  const metodoPago =
    typeof metodoPagoValue === "string"
      ? metodoPagoValue.trim().toUpperCase()
      : ""

  if (!monto || metodoPago.length === 0 || metodoPago.length > 30) {
    return null
  }

  return { monto, metodoPago }
}

/**
 * POST /api/ordenes-compra/:id/pagos
 * Registra un abono completado y deriva el estado financiero de la orden.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.PURCHASE_ORDERS_UPDATE,
    )

    if (response || !session) {
      return response || new NextResponse("No autorizado", { status: 401 })
    }

    const { id } = await context.params
    const idOrdenDeCompra = parsePurchaseOrderId(id)

    if (!idOrdenDeCompra) {
      return NextResponse.json(
        {
          code: "ID_ORDEN_COMPRA_INVALIDO",
          message: "El identificador de la orden de compra no es válido.",
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
          message: "El cuerpo debe contener datos JSON válidos.",
        },
        { status: 400 },
      )
    }

    const paymentInput = parsePaymentInput(body)

    if (!paymentInput) {
      return NextResponse.json(
        {
          code: "DATOS_PAGO_INVALIDOS",
          message:
            "Debe informar un monto entero positivo y un método de pago válido.",
        },
        { status: 400 },
      )
    }

    const result = await db.$transaction(async (tx) => {
      // Serializa pagos y evita carreras con el cierre o la anulación de la orden.
      const lockedOrders = await tx.$queryRaw<
        Array<{ idOrdenDeCompra: number }>
      >`
        SELECT id_orden_de_compra AS idOrdenDeCompra
        FROM ordenes_de_compra
        WHERE id_orden_de_compra = ${idOrdenDeCompra}
        FOR UPDATE
      `

      if (lockedOrders.length === 0) {
        throw new PurchaseOrderPaymentError(
          "ORDEN_COMPRA_NO_ENCONTRADA",
          404,
          "No existe una orden de compra con el ID indicado.",
        )
      }

      const order = await tx.ordenDeCompra.findUnique({
        where: { idOrdenDeCompra },
        select: {
          idOrdenDeCompra: true,
          idUsuario: true,
          estado: true,
          estadoPago: true,
          montoTotal: true,
        },
      })

      if (!order) {
        throw new PurchaseOrderPaymentError(
          "ORDEN_COMPRA_NO_ENCONTRADA",
          404,
          "No existe una orden de compra con el ID indicado.",
        )
      }

      if (order.estado !== EstadoOrdenCompra.ENVIADA) {
        throw new PurchaseOrderPaymentError(
          "ORDEN_NO_PAGABLE",
          409,
          "Solo se pueden registrar pagos para una orden ENVIADA.",
        )
      }

      if (order.estadoPago === EstadoPagoOrdenCompra.ANULADA) {
        throw new PurchaseOrderPaymentError(
          "PAGO_ORDEN_ANULADO",
          409,
          "No se pueden registrar pagos para una orden con estado de pago ANULADA.",
        )
      }

      const paymentMethod = await tx.metodoPago.findUnique({
        where: { codigo: paymentInput.metodoPago },
        select: { codigo: true, nombre: true, estado: true },
      })

      if (!paymentMethod || paymentMethod.estado !== EstadoRegistro.ACTIVO) {
        throw new PurchaseOrderPaymentError(
          "METODO_PAGO_INVALIDO",
          422,
          "El método de pago no existe o está inactivo.",
        )
      }

      const completedAssignments = await tx.asignacionPago.findMany({
        where: {
          idOrdenDeCompra,
          pago: { is: { estado: EstadoPago.COMPLETADO } },
        },
        select: { montoAsociado: true },
      })

      const totalOrder = Number(order.montoTotal)
      const totalPaidBefore = completedAssignments.reduce(
        (total, assignment) => total + Number(assignment.montoAsociado),
        0,
      )
      const pendingBalance = totalOrder - totalPaidBefore

      if (!Number.isSafeInteger(totalOrder) || totalOrder <= 0) {
        throw new PurchaseOrderPaymentError(
          "MONTO_ORDEN_INVALIDO",
          409,
          "La orden no tiene un monto total válido para registrar pagos.",
        )
      }

      if (pendingBalance <= 0) {
        throw new PurchaseOrderPaymentError(
          "ORDEN_SIN_SALDO_PENDIENTE",
          409,
          "La orden ya no tiene saldo pendiente de pago.",
        )
      }

      if (paymentInput.monto > pendingBalance) {
        throw new PurchaseOrderPaymentError(
          "MONTO_SUPERA_SALDO",
          409,
          "El monto del pago no puede superar el saldo pendiente de la orden.",
        )
      }

      const isFinalPayment = paymentInput.monto === pendingBalance
      const tipoAbono = isFinalPayment
        ? "PAGO_FINAL"
        : totalPaidBefore === 0
          ? "ANTICIPO"
          : "ABONO"

      // El pago y su asignación se crean juntos para no dejar saldos huérfanos.
      const payment = await tx.pago.create({
        data: {
          idUsuario: session.user.idUsuario,
          estado: EstadoPago.COMPLETADO,
          metodoPago: paymentMethod.codigo,
          monto: paymentInput.monto,
        },
      })

      const assignment = await tx.asignacionPago.create({
        data: {
          idPago: payment.idPago,
          idVenta: null,
          idOrdenDeCompra,
          montoAsociado: paymentInput.monto,
          tipoAbono,
        },
      })

      const totalPaidAfter = totalPaidBefore + paymentInput.monto
      const estadoPago =
        totalPaidAfter === 0
          ? EstadoPagoOrdenCompra.PENDIENTE
          : totalPaidAfter < totalOrder
            ? EstadoPagoOrdenCompra.PARCIAL
            : EstadoPagoOrdenCompra.PAGADA

      const purchaseOrder = await tx.ordenDeCompra.update({
        where: { idOrdenDeCompra },
        data: { estadoPago },
        include: {
          proveedor: {
            select: { idProveedor: true, razonSocial: true },
          },
        },
      })

      return {
        purchaseOrder,
        payment,
        assignment,
        totalPagado: totalPaidAfter,
        saldoPendiente: totalOrder - totalPaidAfter,
      }
    })

    return NextResponse.json(
      {
        code: "PAGO_ORDEN_COMPRA_REGISTRADO",
        message: "El pago fue registrado correctamente.",
        ...result,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof PurchaseOrderPaymentError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status },
      )
    }

    console.error("[PURCHASE_ORDER_PAYMENT_POST]", error)
    return NextResponse.json(
      {
        code: "ERROR_REGISTRAR_PAGO_ORDEN_COMPRA",
        message: "No fue posible registrar el pago de la orden de compra.",
      },
      { status: 500 },
    )
  }
}
