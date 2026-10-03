import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { ESTADO_OT } from "@/lib/work-order-status"

/**
 * GET /api/garantias/ordenes-disponibles
 *
 * Obtiene las órdenes de trabajo que pueden ser
 * utilizadas para registrar una solicitud de garantía.
 *
 * Regla:
 * Solo se consideran órdenes cuyo estado sea ENTREGADO.
 */
export async function GET() {
  try {
    const { response } = await requirePermission(
      PERMISSIONS.WARRANTIES_CREATE
    )

    if (response) {
      return response
    }

    const ordenes = await db.ordenDeTrabajo.findMany({
      where: {
        estado: ESTADO_OT.ENTREGADO,
      },

      orderBy: {
        idOrdenDeTrabajo: "desc",
      },

      select: {
        idOrdenDeTrabajo: true,
        idVenta: true,
        estado: true,

        venta: {
          select: {
            cliente: {
              select: {
                idCliente: true,
                rut: true,
                primerNombre: true,
                segundoNombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                razonSocial: true,
              },
            },

            ordenDeTrabajo: {
              select: {
                bicicletas: {
                  select: {
                    idBicicleta: true,
                    marca: true,
                    modelo: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    const resultado = ordenes.map((orden) => {
      const cliente = orden.venta.cliente

      let nombreCliente = "Cliente sin nombre"

      if (cliente) {
        if (cliente.razonSocial) {
          nombreCliente = cliente.razonSocial
        } else {
          nombreCliente = [
            cliente.primerNombre,
            cliente.segundoNombre,
            cliente.apellidoPaterno,
            cliente.apellidoMaterno,
          ]
            .filter(Boolean)
            .join(" ")
        }
      }

      return {
        idOrdenDeTrabajo: orden.idOrdenDeTrabajo,

        idVenta: orden.idVenta,

        estado: orden.estado,

        cliente: cliente
          ? {
              idCliente: cliente.idCliente,
              nombre: nombreCliente,
              rut: cliente.rut,
            }
          : null,

        bicicletas:
          orden.venta.ordenDeTrabajo?.bicicletas ?? [],
      }
    })

    return NextResponse.json(
      {
        ordenes: resultado,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(
      "[GARANTIAS_ORDENES_DISPONIBLES_GET]",
      error
    )

    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message:
          "No fue posible obtener las órdenes de trabajo disponibles",
      },
      { status: 500 }
    )
  }
}