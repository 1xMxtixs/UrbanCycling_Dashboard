// Endpoints para consultar y registrar bicicletas en historial trazable.
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

const ESTADOS_TRABAJO_FINALIZADO = ["Listo para entregar", "Entregado"]

type BicycleHistoryRecord = {
  idBicicleta: number
  idOrdenDeTrabajo: number
  tipo: string
  marca: string
  modelo: string
  color: string
  descripcionAdicional: string | null
  imagenes?: Array<{ urlImagen: string }>
  ordenDeTrabajo?: {
    estado: string
    montoTotal: unknown
    fechaIngreso?: Date | null
    fechaEntregaEstimada?: Date | null
    fechaEntregaReal?: Date | null
    venta?: {
      cliente: {
        primerNombre: string | null
        apellidoPaterno: string | null
        apellidoMaterno: string | null
        razonSocial: string | null
        rut: string
      } | null
    }
  }
}

function parseBicycleId(value: unknown): number {
  if (value === null || value === undefined || String(value).trim() === "") {
    return Number.NaN
  }

  const bicycleId = Number(value)

  if (!Number.isInteger(bicycleId) || bicycleId <= 0) {
    return Number.NaN
  }

  return bicycleId
}

function getBicycleIdFromBody(data: Record<string, unknown>) {
  return (
    data.idBicicleta ??
    data.id_bicicleta ??
    data.bicicletaId ??
    data.id
  )
}

function mapBicycleHistoryResponse(bicycle: BicycleHistoryRecord) {
  const ordenDeTrabajo = bicycle.ordenDeTrabajo
    ? {
        ...bicycle.ordenDeTrabajo,
        estadoOrden: bicycle.ordenDeTrabajo.estado,
        total: bicycle.ordenDeTrabajo.montoTotal,
        cliente: bicycle.ordenDeTrabajo.venta?.cliente ?? null,
      }
    : null

  return {
    ...bicycle,
    descripcion: bicycle.descripcionAdicional,
    imagenUrl: bicycle.imagenes?.[0]?.urlImagen ?? null,
    enHistorial: Boolean(
      bicycle.ordenDeTrabajo &&
        ESTADOS_TRABAJO_FINALIZADO.includes(bicycle.ordenDeTrabajo.estado)
    ),
    ordenDeTrabajo,
  }
}

function isFinishedWorkOrder(estado?: string) {
  return Boolean(estado && ESTADOS_TRABAJO_FINALIZADO.includes(estado))
}

const bicycleHistoryInclude = {
  imagenes: true,
  ordenDeTrabajo: {
    include: {
      venta: {
        include: {
          cliente: true,
        },
      },
    },
  },
}

export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.BICYCLES_READ)

    if (response) {
      return response
    }

    const bicycles = await db.bicicleta.findMany({
      where: {
        ordenDeTrabajo: {
          estado: {
            in: ESTADOS_TRABAJO_FINALIZADO,
          },
        },
      },
      orderBy: {
        idBicicleta: "desc",
      },
      include: bicycleHistoryInclude,
    })

    return NextResponse.json(bicycles.map(mapBicycleHistoryResponse))
  } catch (error) {
    console.log("[BICYCLES_HISTORY_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.BICYCLES_READ)

    if (response) {
      return response
    }

    const data = await request.json().catch(() => ({}))
    const rawBicycleId = getBicycleIdFromBody(data)

    if (
      rawBicycleId === null ||
      rawBicycleId === undefined ||
      String(rawBicycleId).trim() === ""
    ) {
      return NextResponse.json(
        {
          code: "BICICLETA_REQUERIDA",
          message:
            "Debe ingresar la bicicleta para guardarla en el historial",
        },
        { status: 400 }
      )
    }

    const bicycleId = parseBicycleId(rawBicycleId)

    if (Number.isNaN(bicycleId)) {
      return NextResponse.json(
        {
          code: "BICICLETA_INVALIDA",
          message: "Debe ingresar una bicicleta valida",
        },
        { status: 400 }
      )
    }

    const bicycle = await db.bicicleta.findUnique({
      where: {
        idBicicleta: bicycleId,
      },
      include: bicycleHistoryInclude,
    })

    if (!bicycle) {
      return NextResponse.json(
        {
          code: "BICICLETA_NO_ENCONTRADA",
          message: "La bicicleta no existe",
        },
        { status: 404 }
      )
    }

    if (!bicycle.ordenDeTrabajo) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_ASOCIADA",
          message: "La bicicleta no tiene una orden de trabajo asociada",
        },
        { status: 409 }
      )
    }

    if (!isFinishedWorkOrder(bicycle.ordenDeTrabajo.estado)) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_FINALIZADA",
          message: "La orden de trabajo asociada no esta finalizada",
        },
        { status: 409 }
      )
    }

    return NextResponse.json({
      code: "BICICLETA_EN_HISTORIAL",
      message: "Bicicleta registrada en el historial",
      bicicleta: mapBicycleHistoryResponse(bicycle),
    })
  } catch (error) {
    console.log("[BICYCLES_HISTORY_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
