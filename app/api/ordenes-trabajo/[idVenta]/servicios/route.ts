import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma"
import {
  agregarServicioOrden,
  WorkOrderServiceError,
} from "@/lib/add-work-order-service"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import {
  InventoryStockError,
  WorkOrderTotalsError,
} from "@/lib/stored-procedures"
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit"
import { ESTADO_OT } from "@/lib/work-order-status"
import { NextResponse } from "next/server"

function parseIdOrden(idVenta: string) {
  const idOrdenDeTrabajo = Number(idVenta)

  if (!Number.isInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
    return Number.NaN
  }

  return idOrdenDeTrabajo
}

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

function calcularMontos(montoSubtotal: number) {
  const montoNeto = Math.round(montoSubtotal / 1.19)
  const montoIva = montoSubtotal - montoNeto

  return {
    montoSubtotal,
    montoTotal: montoSubtotal,
    montoNeto,
    montoIva,
  }
}

function parsePositiveInteger(value: unknown) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN
  }

  return parsedValue
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function getFirstDefined(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return data[key]
    }
  }

  return undefined
}

async function recalcularMontosOrden(
  tx: Prisma.TransactionClient,
  idOrdenDeTrabajo: number
) {
  const lineas = await tx.lineaDeOrdenDeTrabajo.findMany({
    where: {
      idOrdenDeTrabajo,
    },
  })

  const totalServicios = lineas.reduce(
    (total, linea) => total + linea.cantidad * toNumber(linea.precioUnitario),
    0
  )
  const montos = calcularMontos(totalServicios)

  const ordenActualizada = await tx.ordenDeTrabajo.update({
    where: {
      idOrdenDeTrabajo,
    },
    data: {
      montoSubtotal: montos.montoSubtotal,
      montoTotal: montos.montoTotal,
      montoNeto: montos.montoNeto,
      montoIva: montos.montoIva,
    },
  })

  return {
    orden: ordenActualizada,
    totalServicios,
  }
}

// Agrega un servicio con insumos opcionales dentro de una transaccion auditada.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.WORK_ORDERS_UPDATE
    )

    if (response || !session) {
      return response ?? new NextResponse("No autorizado", { status: 401 })
    }

    const { idVenta } = await params
    const idOrdenDeTrabajo = parseIdOrden(idVenta)

    if (Number.isNaN(idOrdenDeTrabajo)) {
      throw new WorkOrderServiceError(
        "ID_INVALIDO",
        "El ID de la orden no es válido"
      )
    }

    const rawData: unknown = await req.json().catch(() => null)
    if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
      throw new WorkOrderServiceError(
        "JSON_INVALIDO",
        "Debe enviar un objeto JSON válido"
      )
    }

    const body = rawData as Record<string, unknown>
    const servicioId = parsePositiveInteger(body.id_servicio ?? body.idServicio)
    const cantidadServicio = parsePositiveInteger(body.cantidad)

    if (Number.isNaN(servicioId) || Number.isNaN(cantidadServicio)) {
      throw new WorkOrderServiceError(
        "FALTAN_DATOS",
        "Servicio y cantidad son obligatorios"
      )
    }

    const resultado = await db.$transaction((tx) =>
      agregarServicioOrden(tx, {
        idOrdenDeTrabajo,
        idServicio: servicioId,
        cantidad: cantidadServicio,
        idUsuario: session.user.idUsuario,
      })
    )

    return NextResponse.json(
      {
        code: "SERVICIO_AGREGADO",
        message: "Servicio agregado correctamente a la orden",
        linea: resultado.linea,
        servicio: resultado.servicio,
        orden: resultado.orden,
        total_servicios: resultado.totalServicios,
        productos_utilizados: resultado.productosUtilizados,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof WorkOrderServiceError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status }
      )
    }
    if (
      error instanceof InventoryStockError ||
      error instanceof WorkOrderTotalsError
    ) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.code === "PRODUCTO_NO_EXISTE" ? 404 : 409 }
      )
    }

    console.error("[AGREGAR_SERVICIO_ORDEN]", error)

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "No se pudo agregar el servicio" },
      { status: 500 }
    )
  }
}

// Obtiene los servicios asociados a una orden de trabajo para su consulta y posterior modificacion.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
    const { response } = await requirePermission(PERMISSIONS.WORK_ORDERS_READ)

    if (response) {
      return response
    }

    const { idVenta } = await params
    const idOrdenDeTrabajo = parseIdOrden(idVenta)

    if (Number.isNaN(idOrdenDeTrabajo)) {
      return NextResponse.json(
        { code: "ID_INVALIDO", message: "El ID de la orden no es válido" },
        { status: 400 }
      )
    }

    const orden = await db.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo,
      },
    })

    if (!orden) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden de trabajo no existe",
        },
        { status: 404 }
      )
    }

    const lineas = await db.lineaDeOrdenDeTrabajo.findMany({
      where: {
        idOrdenDeTrabajo,
      },
      include: {
        servicio: true,
        producto: true,
      },
    })

    const total = lineas.reduce(
      (acumulado, linea) =>
        acumulado + linea.cantidad * toNumber(linea.precioUnitario),
      0
    )

    return NextResponse.json({
      id_orden_de_trabajo: idOrdenDeTrabajo,
      idOrdenDeTrabajo,
      lineas,
      total,
    })
  } catch (error) {
    console.log("[LISTAR_SERVICIOS_ORDEN]", error)

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    )
  }
}

// Sustituye o ajusta un servicio existente solo cuando la orden se encuentra en curso.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.WORK_ORDERS_UPDATE
    )

    if (response || !session) {
      return response
    }

    const { idVenta } = await params
    const idOrdenDeTrabajo = parseIdOrden(idVenta)
    const data = (await req.json()) as Record<string, unknown>

    if (Number.isNaN(idOrdenDeTrabajo)) {
      return NextResponse.json(
        { code: "ID_INVALIDO", message: "El ID de la orden no es válido" },
        { status: 400 }
      )
    }

    const idLineaDeOrdenDeTrabajoInput = getFirstDefined(data, [
      "id_linea_de_orden_de_trabajo",
      "idLineaDeOrdenDeTrabajo",
      "id_linea",
      "idLinea",
    ])
    const idServicioInput = getFirstDefined(data, [
      "id_servicio",
      "idServicio",
      "nuevo_servicio",
      "nuevoServicio",
      "id_nuevo_servicio",
      "idNuevoServicio",
    ])
    const diagnostico = getText(
      getFirstDefined(data, [
        "observaciones_ingreso",
        "observacionesIngreso",
        "diagnostico",
        "nuevoDiagnostico",
        "descripcion",
      ])
    )
    const idLineaDeOrdenDeTrabajo =
      idLineaDeOrdenDeTrabajoInput === undefined ||
      idLineaDeOrdenDeTrabajoInput === null ||
      idLineaDeOrdenDeTrabajoInput === ""
        ? undefined
        : parsePositiveInteger(idLineaDeOrdenDeTrabajoInput)
    const idServicio = parsePositiveInteger(idServicioInput)

    if (!diagnostico || Number.isNaN(idServicio)) {
      return NextResponse.json(
        {
          code: "CAMPOS_MODIFICACION_VACIOS",
          message: "Debe agregar una descripción para el cambio",
        },
        { status: 400 }
      )
    }

    if (
      idLineaDeOrdenDeTrabajo !== undefined &&
      Number.isNaN(idLineaDeOrdenDeTrabajo)
    ) {
      return NextResponse.json(
        {
          code: "LINEA_INVALIDA",
          message: "La linea de servicio no es válida",
        },
        { status: 400 }
      )
    }

    const orden = await db.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo,
      },
    })

    if (!orden) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden de trabajo no existe",
        },
        { status: 404 }
      )
    }

    if (orden.estado !== ESTADO_OT.EN_CURSO) {
      return NextResponse.json(
        {
          code: "ESTADO_ORDEN_NO_PERMITE_MODIFICACION",
          message: "La orden debe estar en estado En curso",
        },
        { status: 409 }
      )
    }

    const servicio = await db.servicio.findUnique({
      where: {
        idServicio,
      },
    })

    if (!servicio) {
      return NextResponse.json(
        {
          code: "SERVICIO_NO_EXISTE",
          message: "El servicio no existe",
        },
        { status: 404 }
      )
    }

    const lineasServicio = await db.lineaDeOrdenDeTrabajo.findMany({
      where: {
        idOrdenDeTrabajo,
        idServicio: {
          not: null,
        },
      },
    })

    const lineaServicio = idLineaDeOrdenDeTrabajo
      ? lineasServicio.find(
          (linea) => linea.idLineaDeOrdenDeTrabajo === idLineaDeOrdenDeTrabajo
        )
      : lineasServicio.length === 1
        ? lineasServicio[0]
        : null

    if (!lineaServicio) {
      return NextResponse.json(
        {
          code: idLineaDeOrdenDeTrabajo
            ? "LINEA_SERVICIO_NO_EXISTE"
            : "LINEA_SERVICIO_REQUERIDA",
          message: idLineaDeOrdenDeTrabajo
            ? "La linea de servicio no existe en la orden"
            : "Debe indicar la linea de servicio a modificar",
        },
        { status: idLineaDeOrdenDeTrabajo ? 404 : 400 }
      )
    }

    const resultado = await db.$transaction(async (tx) => {
      const lineaActualizada = await tx.lineaDeOrdenDeTrabajo.update({
        where: {
          idLineaDeOrdenDeTrabajo: lineaServicio.idLineaDeOrdenDeTrabajo,
        },
        data: {
          idServicio: servicio.idServicio,
          precioUnitario: servicio.precioVenta,
        },
        include: {
          servicio: true,
          producto: true,
        },
      })

      const ordenConDiagnostico = await tx.ordenDeTrabajo.update({
        where: {
          idOrdenDeTrabajo,
        },
        data: {
          observacionesIngreso: diagnostico,
        },
      })

      const montos = await recalcularMontosOrden(tx, idOrdenDeTrabajo)

      await registrarAuditoriaOrdenTrabajo(tx, {
        idUsuario: session.user.idUsuario,
        tipoOperacion: "modificacion_servicio",
        idOrdenDeTrabajo,
        valorAnterior: {
          idLineaDeOrdenDeTrabajo: lineaServicio.idLineaDeOrdenDeTrabajo,
          idServicio: lineaServicio.idServicio,
          precioUnitario: lineaServicio.precioUnitario,
          observacionesIngreso: orden.observacionesIngreso,
        },
        valorNuevo: {
          idLineaDeOrdenDeTrabajo: lineaActualizada.idLineaDeOrdenDeTrabajo,
          idServicio: lineaActualizada.idServicio,
          precioUnitario: lineaActualizada.precioUnitario,
          observacionesIngreso: diagnostico,
        },
        detalleCambio: "Modificacion de servicio tecnico de la orden",
      })

      return {
        linea: lineaActualizada,
        servicio,
        orden: {
          ...ordenConDiagnostico,
          ...montos.orden,
          observacionesIngreso: diagnostico,
        },
        totalServicios: montos.totalServicios,
      }
    })

    return NextResponse.json({
      code: "SERVICIO_ORDEN_MODIFICADO",
      message: "Modificación de servicio registrada correctamente",
      linea: resultado.linea,
      servicio: resultado.servicio,
      orden: resultado.orden,
      total_servicios: resultado.totalServicios,
    })
  } catch (error) {
    console.log("[MODIFICAR_SERVICIO_ORDEN]", error)

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
