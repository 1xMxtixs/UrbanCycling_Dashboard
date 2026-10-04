import { IVA_RATE } from "@/lib/tax-document"

export type DiscountLine = {
  cantidad: number
  precioUnitario: number
  descuentoUnitario: number
}

export type DiscountTotals = {
  montoSubtotal: number
  descuentoProductos: number
  descuentoGlobal: number
  montoTotal: number
  montoNeto: number
  montoIva: number
}

export type DiscountCalculation =
  | { ok: true; totals: DiscountTotals }
  | {
      ok: false
      code: "VALORES_LINEA_INVALIDOS" | "DESCUENTO_GLOBAL_EXCEDE_SUBTOTAL"
    }

/** Valida un descuento fijo aplicado a cada unidad de una línea. */
export function esDescuentoUnitarioValido(
  precioUnitario: number,
  descuentoUnitario: number
) {
  return (
    Number.isFinite(precioUnitario) &&
    precioUnitario >= 0 &&
    Number.isFinite(descuentoUnitario) &&
    descuentoUnitario >= 0 &&
    descuentoUnitario <= precioUnitario
  )
}

/** Valida el descuento global contra el subtotal disponible tras las líneas. */
export function esDescuentoGlobalValido(
  montoSubtotal: number,
  descuentoProductos: number,
  descuentoGlobal: number
) {
  return (
    Number.isFinite(montoSubtotal) &&
    montoSubtotal >= 0 &&
    Number.isFinite(descuentoProductos) &&
    descuentoProductos >= 0 &&
    descuentoProductos <= montoSubtotal &&
    Number.isFinite(descuentoGlobal) &&
    descuentoGlobal >= 0 &&
    descuentoGlobal <= montoSubtotal - descuentoProductos
  )
}

/** Calcula los montos de una venta u OT usando descuentos monetarios en CLP. */
export function calcularTotalesConDescuentos(
  lineas: DiscountLine[],
  descuentoGlobal: number
): DiscountCalculation {
  let montoSubtotal = 0
  let descuentoProductos = 0

  for (const linea of lineas) {
    if (
      !Number.isInteger(linea.cantidad) ||
      linea.cantidad <= 0 ||
      !esDescuentoUnitarioValido(
        linea.precioUnitario,
        linea.descuentoUnitario
      )
    ) {
      return { ok: false, code: "VALORES_LINEA_INVALIDOS" }
    }

    montoSubtotal += linea.cantidad * linea.precioUnitario
    descuentoProductos += linea.cantidad * linea.descuentoUnitario
  }

  if (
    !esDescuentoGlobalValido(
      montoSubtotal,
      descuentoProductos,
      descuentoGlobal
    )
  ) {
    return { ok: false, code: "DESCUENTO_GLOBAL_EXCEDE_SUBTOTAL" }
  }

  const montoTotal = montoSubtotal - descuentoProductos - descuentoGlobal
  const montoNeto = Math.round(montoTotal / (1 + IVA_RATE))
  const montoIva = montoTotal - montoNeto

  return {
    ok: true,
    totals: {
      montoSubtotal,
      descuentoProductos,
      descuentoGlobal,
      montoTotal,
      montoNeto,
      montoIva,
    },
  }
}
