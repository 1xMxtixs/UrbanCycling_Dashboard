// Utilidades para normalizar y calcular datos de documentos tributarios.
export type TaxDocumentOrigin = "venta" | "orden-trabajo"

export const DEFAULT_TAX_DOCUMENT_TYPE = 39
export const DEFAULT_TAX_DOCUMENT_STATUS = "emitido"
export const IVA_RATE = 0.19

export function parsePositiveInteger(value: unknown) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN
  }

  return parsedValue
}

export function toNumber(value: unknown) {
  return Number(value ?? 0)
}

export function normalizeTaxDocumentType(value: unknown) {
  const rawType = String(value ?? DEFAULT_TAX_DOCUMENT_TYPE)
    .trim()
    .toLowerCase()

  if (!rawType) {
    return DEFAULT_TAX_DOCUMENT_TYPE
  }

  if (rawType === "boleta") {
    return 39
  }

  if (rawType === "factura") {
    return 33
  }

  const numericType = Number(rawType)

  if (!Number.isInteger(numericType) || numericType <= 0) {
    return DEFAULT_TAX_DOCUMENT_TYPE
  }

  return numericType
}

export function normalizeTaxDocumentOrigin(value: unknown): TaxDocumentOrigin | null {
  const origin = String(value ?? "")
    .trim()
    .toLowerCase()

  if (origin === "venta") {
    return "venta"
  }

  if (
    origin === "orden-trabajo" ||
    origin === "orden_de_trabajo" ||
    origin === "ordendetrabajo"
  ) {
    return "orden-trabajo"
  }

  return null
}

export function calculateIncludedIva(total: number) {
  const montoTotal = Math.max(0, Math.round(total))
  const montoNeto = Math.round(montoTotal / (1 + IVA_RATE))
  const montoIva = montoTotal - montoNeto

  return {
    montoTotal,
    montoNeto,
    montoIva,
  }
}

export function calcularMontos(montoSubtotal: number, descuentoGlobal: number) {
  const montoTotal = Math.max(0, montoSubtotal - descuentoGlobal);
  const montoNeto = Math.round(montoTotal / 1.19); // Asumiendo IVA 19%
  const montoIva = montoTotal - montoNeto;

  return {
    montoSubtotal,
    descuentoGlobal,
    montoTotal,
    montoNeto,
    montoIva,
  };
}