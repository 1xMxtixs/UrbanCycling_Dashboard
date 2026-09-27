import { EstadoPagoVenta, EstadoVentaMostrador } from "@/generated/prisma"
import { ESTADO_OT, type EstadoOt } from "@/lib/work-order-status"
import { NextResponse } from "next/server"

const normalizarCodigo = (value: string) =>
  value.trim().toUpperCase().replace(/[ -]+/g, "_")

const resolverCodigo = <T extends string>(value: unknown, codigos: T[]) =>
  typeof value === "string"
    ? (codigos.find((codigo) => codigo === normalizarCodigo(value)) ?? null)
    : null

/** Códigos válidos que el frontend puede enviar al cambiar el estado de una OT. */
export const ESTADOS_OT_DISPONIBLES = Object.values(ESTADO_OT)

/** Normaliza un código o nombre compatible al código persistido de la OT. */
export const resolverEstadoOt = (value: unknown): EstadoOt | null =>
  resolverCodigo(value, ESTADOS_OT_DISPONIBLES)

/** Normaliza el estado financiero común almacenado en Venta. */
export const resolverEstadoPago = (value: unknown) =>
  resolverCodigo(value, Object.values(EstadoPagoVenta))

/** Acepta estados de venta y conserva el alias histórico CONFIRMADA. */
export function resolverEstadoVenta(value: unknown) {
  const codigo = typeof value === "string" ? normalizarCodigo(value) : value
  return resolverCodigo(codigo === "CONFIRMADA" ? "COMPLETADA" : codigo, Object.values(EstadoVentaMostrador))
}

/** Construye la respuesta 400 uniforme que consumen los formularios del POS. */
export function respuestaInvalida(code: string, message: string) {
  return NextResponse.json({ code, message }, { status: 400 })
}

/** Selección mínima para mostrar código y etiqueta legible del estado OT. */
export const estadoOrdenInclude = {
  select: { codigo: true, nombre: true },
} as const
