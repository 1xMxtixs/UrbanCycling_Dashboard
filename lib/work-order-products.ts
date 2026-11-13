export class WorkOrderProductError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = "WorkOrderProductError"
  }
}

// Las cantidades también se envían a procedimientos que usan INT con signo.
export const MAX_PRODUCT_QUANTITY = 2147483647

export function validarCantidadProducto(cantidad: number) {
  if (!Number.isSafeInteger(cantidad) || cantidad <= 0 || cantidad > MAX_PRODUCT_QUANTITY) {
    throw new WorkOrderProductError("CANTIDAD_INVALIDA", "La cantidad debe ser un entero positivo dentro del rango permitido")
  }
}

type ProductLine = {
  idProducto: number
  cantidad: number
  precioUnitario: number
  descuentoUnitario: number
  costoUnitario: number
}

/** Agrupa solo productos de la ODT, una vez resueltos los precios del catálogo. */
export function agruparLineasProductosOrden<T extends ProductLine>(lineas: T[]): T[] {
  const porProducto = new Map<number, T>()
  for (const linea of lineas) {
    validarCantidadProducto(linea.cantidad)
    const existente = porProducto.get(linea.idProducto)
    if (existente) {
      if (
        existente.precioUnitario !== linea.precioUnitario ||
        existente.descuentoUnitario !== linea.descuentoUnitario ||
        existente.costoUnitario !== linea.costoUnitario
      ) {
        throw new WorkOrderProductError(
          "PRODUCTO_CON_VALORES_DISTINTOS",
          `El producto ${linea.idProducto} está repetido con distintos precios, descuentos o costos. Unifica sus valores antes de guardar.`,
        )
      }
      existente.cantidad += linea.cantidad
      validarCantidadProducto(existente.cantidad)
    } else {
      porProducto.set(linea.idProducto, { ...linea })
    }
  }
  return [...porProducto.values()]
}

/** Al elegir un producto repetido en el formulario se conserva el precio existente. */
export function seleccionarProductoOrden<T extends { idProducto: string; cantidad: number; precioUnitario: number }>(
  lineas: T[], index: number, idProducto: string, precioUnitario: number,
): T[] {
  const origen = lineas[index]
  if (!origen) return lineas
  const destino = lineas.findIndex((linea, i) => i !== index && linea.idProducto === idProducto)
  if (idProducto && destino !== -1) {
    const cantidad = lineas[destino].cantidad + origen.cantidad
    validarCantidadProducto(cantidad)
    return lineas.flatMap((linea, i) => i === index ? [] : [{ ...linea, ...(i === destino ? { cantidad } : {}) }])
  }
  return lineas.map((linea, i) => i === index ? { ...linea, idProducto, precioUnitario } : linea)
}
