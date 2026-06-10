// Endpoint para generar documentos tributarios desde ventas u ordenes de trabajo.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import {
  DEFAULT_TAX_DOCUMENT_STATUS,
  calculateIncludedIva,
  normalizeTaxDocumentOrigin,
  normalizeTaxDocumentType,
  parsePositiveInteger,
  toNumber,
} from "@/lib/tax-document"

function getIssuerRut(data: Record<string, unknown>) {
  return String(data.rutEmisor ?? process.env.TAX_ISSUER_RUT ?? "").trim()
}

async function getNextFolio() {
  const lastDocument = await db.documentoTributario.findFirst({
    orderBy: {
      numeroFolio: "desc",
    },
    select: {
      numeroFolio: true,
    },
  })

  return (lastDocument?.numeroFolio ?? 0) + 1
}

export async function POST(request: Request) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.RECEIPTS_CREATE
    )

    if (response || !session) {
      return response
    }

    const data = (await request.json()) as Record<string, unknown>
    const origin = normalizeTaxDocumentOrigin(data.origen)
    const tipoDte = normalizeTaxDocumentType(data.tipoDte)
    const rutEmisor = getIssuerRut(data)

    if (!origin) {
      return NextResponse.json(
        {
          code: "ORIGEN_INVALIDO",
          message: "Debe indicar origen venta u orden-trabajo",
        },
        { status: 400 }
      )
    }

    if (!rutEmisor) {
      return NextResponse.json(
        {
          code: "RUT_EMISOR_REQUERIDO",
          message: "Debe indicar el RUT emisor del documento tributario",
        },
        { status: 400 }
      )
    }

    const idVenta = parsePositiveInteger(data.idVenta ?? data.id_venta)
    const idOrdenDeTrabajo = parsePositiveInteger(
      data.idOrdenDeTrabajo ?? data.id_orden_de_trabajo
    )

    if (origin === "venta" && Number.isNaN(idVenta)) {
      return NextResponse.json(
        {
          code: "VENTA_INVALIDA",
          message: "Debe indicar una venta valida",
        },
        { status: 400 }
      )
    }

    if (origin === "orden-trabajo" && Number.isNaN(idOrdenDeTrabajo)) {
      return NextResponse.json(
        {
          code: "ORDEN_TRABAJO_INVALIDA",
          message: "Debe indicar una orden de trabajo valida",
        },
        { status: 400 }
      )
    }

    const existingOrigin = await db.origenDocumentoTributario.findFirst({
      where:
        origin === "venta"
          ? {
              idVenta,
              documentoTributario: {
                tipoDte,
              },
            }
          : {
              venta: {
                ordenDeTrabajo: {
                  idOrdenDeTrabajo,
                },
              },
              documentoTributario: {
                tipoDte,
              },
            },
      include: {
        documentoTributario: true,
      },
    })

    if (existingOrigin) {
      return NextResponse.json(
        {
          code: "DOCUMENTO_YA_EXISTE",
          message: "Ya existe un documento tributario para este origen",
          documentoTributario: existingOrigin.documentoTributario,
        },
        { status: 409 }
      )
    }

    let linkedVentaId: number
    let linkedClientId: number
    let rutReceptor: string
    let montoSubtotal = 0
    let descuentoAcumulado = 0
    let totalOrigen = 0

    if (origin === "venta") {
      const venta = await db.venta.findUnique({
        where: {
          idVenta,
        },
        include: {
          cliente: true,
          ventaEnMostrador: true,
          ordenDeTrabajo: true,
        },
      })

      if (!venta) {
        return NextResponse.json(
          {
            code: "ORIGEN_NO_ENCONTRADO",
            message: "No se encontro el registro asociado al documento",
          },
          { status: 404 }
        )
      }

      const totalsSource = venta.ventaEnMostrador ?? venta.ordenDeTrabajo

      linkedVentaId = venta.idVenta
      linkedClientId = venta.idCliente
      rutReceptor = venta.cliente.rut
      montoSubtotal = Math.round(toNumber(totalsSource?.montoSubtotal))
      totalOrigen = toNumber(totalsSource?.montoTotal)

      if (venta.ventaEnMostrador) {
        descuentoAcumulado = Math.round(
          toNumber(venta.ventaEnMostrador.descuentoProductos) +
            toNumber(venta.ventaEnMostrador.descuentoGlobal)
        )
      } else if (venta.ordenDeTrabajo) {
        descuentoAcumulado = Math.round(
          toNumber(venta.ordenDeTrabajo.descuentoProductosServicios) +
            toNumber(venta.ordenDeTrabajo.descuentoGlobal)
        )
      }
    } else {
      const ordenDeTrabajo = await db.ordenDeTrabajo.findUnique({
        where: {
          idOrdenDeTrabajo,
        },
        include: {
          venta: {
            include: {
              cliente: true,
            },
          },
        },
      })

      if (!ordenDeTrabajo) {
        return NextResponse.json(
          {
            code: "ORIGEN_NO_ENCONTRADO",
            message: "No se encontro el registro asociado al documento",
          },
          { status: 404 }
        )
      }

      linkedVentaId = ordenDeTrabajo.idVenta
      linkedClientId = ordenDeTrabajo.venta.idCliente
      rutReceptor = ordenDeTrabajo.venta.cliente.rut
      montoSubtotal = Math.round(toNumber(ordenDeTrabajo.montoSubtotal))
      descuentoAcumulado = Math.round(
        toNumber(ordenDeTrabajo.descuentoProductosServicios) +
          toNumber(ordenDeTrabajo.descuentoGlobal)
      )
      totalOrigen = toNumber(ordenDeTrabajo.montoTotal)
    }

    const { montoTotal, montoNeto, montoIva } = calculateIncludedIva(totalOrigen)

    if (montoTotal <= 0) {
      return NextResponse.json(
        {
          code: "MONTO_INVALIDO",
          message: "El origen no tiene un monto valido para generar boleta",
        },
        { status: 400 }
      )
    }

    const documentoTributario = await db.$transaction(async (tx) => {
      const numeroFolio = await getNextFolio()

      return tx.documentoTributario.create({
        data: {
          idUsuario: session.user.idUsuario,
          idCliente: linkedClientId,
          tipoMovimiento: origin,
          tipoDte,
          numeroFolio,
          rutEmisor,
          rutReceptor,
          fechaEmision: new Date(),
          montoSubtotal,
          descuentoAcumulado,
          montoTotal,
          montoNeto,
          montoIva,
          estado: String(data.estado ?? DEFAULT_TAX_DOCUMENT_STATUS).trim(),
          origenes: {
            create: {
              idVenta: linkedVentaId,
            },
          },
        },
        include: {
          origenes: true,
        },
      })
    })

    return NextResponse.json(
      {
        code: "DOCUMENTO_TRIBUTARIO_CREADO",
        message: "Documento tributario generado correctamente",
        documentoTributario,
      },
      { status: 201 }
    )
  } catch (error) {
    console.log("[DOCUMENTOS_TRIBUTARIOS_POST]", error)

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
