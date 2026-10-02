import { db } from "@/lib/db"

export class WorkOrderNotFoundError extends Error {
  constructor() {
    super("ORDEN_TRABAJO_NO_ENCONTRADA")
    this.name = "WorkOrderNotFoundError"
  }
}

/** Obtiene y normaliza únicamente los datos necesarios para el PDF de una OT. */
export async function getWorkOrderDocumentData(idOrdenDeTrabajo: number) {
  const orden = await db.ordenDeTrabajo.findUnique({
    where: { idOrdenDeTrabajo },
    select: {
      idOrdenDeTrabajo: true,
      estado: true,
      fechaEntregaEstimada: true,
      fechaEntregaReal: true,
      observacionesIngreso: true,
      montoSubtotal: true,
      descuentoProductosServicios: true,
      descuentoGlobal: true,
      montoNeto: true,
      montoIva: true,
      montoTotal: true,
      estadoOrden: {
        select: {
          codigo: true,
          nombre: true,
        },
      },
      venta: {
        select: {
          fechaRegistro: true,
          estadoPago: true,
          cliente: {
            select: {
              rut: true,
              tipoCliente: true,
              primerNombre: true,
              segundoNombre: true,
              apellidoPaterno: true,
              apellidoMaterno: true,
              razonSocial: true,
            },
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
          },
        },
      },
      bicicletas: {
        select: {
          idBicicleta: true,
          tipo: true,
          marca: true,
          modelo: true,
          color: true,
          descripcionAdicional: true,
        },
      },
      lineasDeOrdenDeTrabajo: {
        select: {
          idLineaDeOrdenDeTrabajo: true,
          idServicio: true,
          idProducto: true,
          cantidad: true,
          precioUnitario: true,
          descuentoUnitario: true,
          servicio: {
            select: { nombre: true },
          },
          producto: {
            select: { nombre: true },
          },
        },
      },
    },
  })

  if (!orden) {
    throw new WorkOrderNotFoundError()
  }

  const pagos = orden.venta.asignacionesPago.map((asignacion) => ({
    idPago: asignacion.pago.idPago,
    fechaRegistro: asignacion.pago.fechaRegistro,
    estado: asignacion.pago.estado,
    metodoPago: asignacion.pago.metodoPagoRel.nombre,
    tipoAbono: asignacion.tipoAbono,
    monto: Number(asignacion.montoAsociado),
  }))

  return {
    idOrdenDeTrabajo: orden.idOrdenDeTrabajo,
    estado: {
      codigo: orden.estadoOrden.codigo,
      nombre: orden.estadoOrden.nombre,
    },
    estadoPago: orden.venta.estadoPago,
    fechaRecepcion: orden.venta.fechaRegistro,
    fechaEntregaEstimada: orden.fechaEntregaEstimada,
    fechaEntregaReal: orden.fechaEntregaReal,
    observacionesIngreso: orden.observacionesIngreso,
    cliente: orden.venta.cliente,
    bicicletas: orden.bicicletas,
    lineas: orden.lineasDeOrdenDeTrabajo.map((linea) => {
      const precioUnitario = Number(linea.precioUnitario)
      const descuentoUnitario = Number(linea.descuentoUnitario)

      return {
        descripcion:
          linea.servicio?.nombre ?? linea.producto?.nombre ?? "Ítem sin descripción",
        tipo: linea.idServicio ? "Servicio" : "Insumo",
        cantidad: linea.cantidad,
        precioUnitario,
        descuentoUnitario,
        descuentoTotal: linea.cantidad * descuentoUnitario,
        total: linea.cantidad * (precioUnitario - descuentoUnitario),
      }
    }),
    montos: {
      subtotal: Number(orden.montoSubtotal),
      descuentoLineas: Number(orden.descuentoProductosServicios),
      descuentoGlobal: Number(orden.descuentoGlobal),
      neto: Number(orden.montoNeto),
      iva: Number(orden.montoIva),
      total: Number(orden.montoTotal),
      totalPagado: pagos.reduce((total, pago) => total + pago.monto, 0),
    },
    pagos,
  }
}

export type WorkOrderDocumentData = Awaited<
  ReturnType<typeof getWorkOrderDocumentData>
>
