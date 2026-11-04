import { EstadoPago } from "@/generated/prisma"
import { db } from "@/lib/db"

export class PurchaseOrderNotFoundError extends Error {
  constructor() {
    super("ORDEN_COMPRA_NO_ENCONTRADA")
    this.name = "PurchaseOrderNotFoundError"
  }
}

function fullName(user: {
  primerNombre: string
  segundoNombre: string | null
  apellidoPaterno: string
  apellidoMaterno: string | null
}) {
  return [
    user.primerNombre,
    user.segundoNombre,
    user.apellidoPaterno,
    user.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ")
}

/** Compara fechas por día calendario en Chile, sin marcar como vencido el mismo día. */
function calendarDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ""

  return `${part("year")}-${part("month")}-${part("day")}`
}

/** Obtiene y normaliza los datos necesarios para el reporte interno de una OC. */
export async function getPurchaseOrderDocumentData(
  idOrdenDeCompra: number,
  referenceDate = new Date(),
) {
  const orden = await db.ordenDeCompra.findUnique({
    where: { idOrdenDeCompra },
    select: {
      idOrdenDeCompra: true,
      fechaRegistro: true,
      fechaEntregaEstimada: true,
      fechaEntregaReal: true,
      estado: true,
      estadoPago: true,
      estadoRecepcion: true,
      montoSubtotal: true,
      descuentoProductos: true,
      descuentoGlobal: true,
      montoNeto: true,
      montoIva: true,
      montoTotal: true,
      usuario: {
        select: {
          primerNombre: true,
          segundoNombre: true,
          apellidoPaterno: true,
          apellidoMaterno: true,
          correo: true,
        },
      },
      proveedor: {
        select: {
          idProveedor: true,
          razonSocial: true,
          nombreFantasia: true,
          rut: true,
          giro: true,
          condicionesDePago: true,
          nombreContacto: true,
          telefonos: {
            select: {
              telefono: true,
              descripcion: true,
            },
            orderBy: { idTelefonoProveedor: "asc" },
          },
          correos: {
            select: {
              correo: true,
              descripcion: true,
            },
            orderBy: { idCorreoProveedor: "asc" },
          },
          direcciones: {
            select: {
              region: true,
              ciudad: true,
              comuna: true,
              calle: true,
              numero: true,
              unidad: true,
              descripcion: true,
            },
            orderBy: { idDireccionProveedor: "asc" },
          },
        },
      },
      lineas: {
        select: {
          idLineaDeOrdenDeCompra: true,
          cantidadOrdenada: true,
          cantidadRecibida: true,
          precioCostoUnitario: true,
          producto: {
            select: {
              idProducto: true,
              nombre: true,
              codigoProveedor: true,
            },
          },
        },
        orderBy: { idLineaDeOrdenDeCompra: "asc" },
      },
      asignacionesPago: {
        select: {
          montoAsociado: true,
          tipoAbono: true,
          pago: {
            select: {
              idPago: true,
              fechaRegistro: true,
              estado: true,
              metodoPagoRel: {
                select: { nombre: true },
              },
            },
          },
        },
        orderBy: { idAsignacionPago: "asc" },
      },
    },
  })

  if (!orden) {
    throw new PurchaseOrderNotFoundError()
  }

  const lineas = orden.lineas.map((linea) => {
    const cantidadPendiente = Math.max(
      0,
      linea.cantidadOrdenada - linea.cantidadRecibida,
    )
    const precioUnitario = Number(linea.precioCostoUnitario)

    return {
      idLineaDeOrdenDeCompra: linea.idLineaDeOrdenDeCompra,
      idProducto: linea.producto.idProducto,
      codigoProveedor: linea.producto.codigoProveedor,
      descripcion: linea.producto.nombre,
      cantidadOrdenada: linea.cantidadOrdenada,
      cantidadRecibida: linea.cantidadRecibida,
      cantidadPendiente,
      porcentajeRecepcion:
        (linea.cantidadRecibida / linea.cantidadOrdenada) * 100,
      precioUnitario,
      total: linea.cantidadOrdenada * precioUnitario,
    }
  })

  const pagos = orden.asignacionesPago.map((asignacion) => ({
    idPago: asignacion.pago.idPago,
    fechaRegistro: asignacion.pago.fechaRegistro,
    estado: asignacion.pago.estado,
    metodoPago: asignacion.pago.metodoPagoRel.nombre,
    tipoAbono: asignacion.tipoAbono,
    monto: Number(asignacion.montoAsociado),
  }))
  const totalPagado = pagos
    .filter((pago) => pago.estado === EstadoPago.COMPLETADO)
    .reduce((total, pago) => total + pago.monto, 0)
  const montoTotal = Number(orden.montoTotal)
  const productosPendientes = lineas.filter(
    (linea) => linea.cantidadPendiente > 0,
  ).length
  const recepcionCerrada = ["RECIBIDA", "ANULADA"].includes(
    orden.estadoRecepcion,
  )

  return {
    idOrdenDeCompra: orden.idOrdenDeCompra,
    fechaRegistro: orden.fechaRegistro,
    fechaEntregaEstimada: orden.fechaEntregaEstimada,
    fechaEntregaReal: orden.fechaEntregaReal,
    estado: orden.estado,
    estadoPago: orden.estadoPago,
    estadoRecepcion: orden.estadoRecepcion,
    creador: {
      nombre: fullName(orden.usuario),
      correo: orden.usuario.correo,
    },
    proveedor: orden.proveedor,
    lineas,
    pagos,
    montos: {
      subtotal: Number(orden.montoSubtotal),
      descuentoProductos: Number(orden.descuentoProductos),
      descuentoGlobal: Number(orden.descuentoGlobal),
      neto: Number(orden.montoNeto),
      iva: Number(orden.montoIva),
      total: montoTotal,
      totalPagado,
      saldoPendiente: Math.max(0, montoTotal - totalPagado),
    },
    indicadores: {
      productosPendientes,
      recepcionCompleta: productosPendientes === 0,
      vencida:
        orden.estado !== "ANULADA" &&
        !recepcionCerrada &&
        calendarDateKey(orden.fechaEntregaEstimada) <
          calendarDateKey(referenceDate),
    },
  }
}

export type PurchaseOrderDocumentData = Awaited<
  ReturnType<typeof getPurchaseOrderDocumentData>
>
