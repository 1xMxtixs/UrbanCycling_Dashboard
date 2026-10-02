export const METODOS_PAGO = [
  { codigo: "EFECTIVO", nombre: "Efectivo" },
  { codigo: "DEBITO", nombre: "Tarjeta de Débito" },
  { codigo: "CREDITO", nombre: "Tarjeta de Crédito" },
  { codigo: "TRANSFERENCIA", nombre: "Transferencia" },
] as const
export type MetodoPago = (typeof METODOS_PAGO)[number]["codigo"]
export const METODO_PAGO_DEFECTO: MetodoPago = "EFECTIVO"
export function getNombreMetodoPago(codigo?: string | null) {
  return METODOS_PAGO.find((m) => m.codigo === codigo?.toUpperCase())?.nombre ?? codigo ?? "—"
}
