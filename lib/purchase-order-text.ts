import { formatCLP } from "@/lib/formatters"

type PurchaseOrderTextInput = {
  idOrdenDeCompra: number
  proveedor: { razonSocial: string }
  montoTotal: number | string
  lineas: Array<{
    cantidadOrdenada: number
    precioCostoUnitario: number | string
    producto: { nombre: string }
  }>
}

/** Texto del pedido original, independiente de las entregas y pagos registrados. */
export function buildPurchaseOrderText(order: PurchaseOrderTextInput): string {
  const lines = order.lineas.map((line, index) => {
    const price = Number(line.precioCostoUnitario)
    return [
      `${index + 1}. ${line.producto.nombre}`,
      `Cantidad solicitada: ${line.cantidadOrdenada}`,
      `Precio unitario: ${formatCLP(price)}`,
      `Total línea: ${formatCLP(line.cantidadOrdenada * price)}`,
    ].join("\n")
  })

  return [
    `*Orden de compra OC-${order.idOrdenDeCompra}*`,
    `Proveedor: ${order.proveedor.razonSocial}`,
    "",
    lines.join("\n\n"),
    "",
    `*Total de la orden: ${formatCLP(Number(order.montoTotal))}*`,
  ].join("\n")
}
