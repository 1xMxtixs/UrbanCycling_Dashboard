import { EstadoPagoVenta, EstadoVentaMostrador } from "@/generated/prisma"
import { ESTADO_OT, type EstadoOt } from "@/lib/work-order-status"
import { NextResponse } from "next/server"

const normalizarCodigo = (value: string) =>
  value.trim().toUpperCase().replace(/[ -]+/g, "_")

const resolverCodigo = <T extends string>(value: unknown, codigos: T[]) =>
  typeof value === "string"
    ? (codigos.find((codigo) => codigo === normalizarCodigo(value)) ?? null)
    : null

export const ESTADOS_OT_DISPONIBLES = Object.values(ESTADO_OT)

export const resolverEstadoOt = (value: unknown): EstadoOt | null =>
  resolverCodigo(value, ESTADOS_OT_DISPONIBLES)

export const resolverEstadoPago = (value: unknown) =>
  resolverCodigo(value, Object.values(EstadoPagoVenta))

export function resolverEstadoVenta(value: unknown) {
  const codigo = typeof value === "string" ? normalizarCodigo(value) : value
  return resolverCodigo(codigo === "CONFIRMADA" ? "COMPLETADA" : codigo, Object.values(EstadoVentaMostrador))
}

export function respuestaInvalida(code: string, message: string) {
  return NextResponse.json({ code, message }, { status: 400 })
}

export const estadoOrdenInclude = {
  select: { codigo: true, nombre: true },
} as const
