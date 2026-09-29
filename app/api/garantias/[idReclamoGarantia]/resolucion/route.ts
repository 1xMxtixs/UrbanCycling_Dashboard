import { NextResponse } from "next/server"
import { z } from "zod"

import { EstadoReclamoGarantia, type Prisma } from "@/generated/prisma"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{
    idReclamoGarantia: string
  }>
}

const resolverGarantiaSchema = z
  .object({
    veredicto: z.enum(["APROBADA", "RECHAZADA"]),
    observaciones: z.string().trim().max(500).optional(),
  })
  .strict()

const RESOLUCION_POR_VEREDICTO = {
  APROBADA: {
    estado: EstadoReclamoGarantia.APROBADO,
    tipoResolucion: "APROBADA",
  },
  RECHAZADA: {
    estado: EstadoReclamoGarantia.RECHAZADO,
    tipoResolucion: "RECHAZADA",
  },
} as const

// CU77 es autónomo respecto del detalle de CU75/CU76: conserva aquí el
// selector y el formato que necesita su respuesta para no arrastrar esos
// controladores cuando esta PR se revise directamente contra main.
const ESTADOS_GARANTIA_PENDIENTES: EstadoReclamoGarantia[] = [
  EstadoReclamoGarantia.INGRESADO,
  EstadoReclamoGarantia.EN_REVISION,
  EstadoReclamoGarantia.EN_ESPERA,
]

const GARANTIA_RESUELTA_SELECT = {
  idReclamoGarantia: true,
  idVentaGenerada: true,
  fechaRegistro: true,
  estado: true,
  motivo: true,
  tipoResolucion: true,
  justificacionResolucion: true,
  ventaReclamada: {
    select: {
      idVenta: true,
      ordenDeTrabajo: {
        select: {
          idOrdenDeTrabajo: true,
        },
      },
    },
  },
} satisfies Prisma.ReclamoGarantiaSelect

type GarantiaResuelta = Prisma.ReclamoGarantiaGetPayload<{
  select: typeof GARANTIA_RESUELTA_SELECT
}>

function obtenerIdGarantia(value: string) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const idReclamoGarantia = Number(value)

  return Number.isSafeInteger(idReclamoGarantia) && idReclamoGarantia > 0
    ? idReclamoGarantia
    : null
}

function presentarGarantiaResuelta(solicitud: GarantiaResuelta) {
  const fecha = solicitud.fechaRegistro
  const fechaIngreso = `${String(fecha.getUTCDate()).padStart(2, "0")}-${String(
    fecha.getUTCMonth() + 1
  ).padStart(2, "0")}-${fecha.getUTCFullYear()}`
  const estados: Record<EstadoReclamoGarantia, string> = {
    [EstadoReclamoGarantia.INGRESADO]: "Pendiente",
    [EstadoReclamoGarantia.EN_REVISION]: "Pendiente",
    [EstadoReclamoGarantia.EN_ESPERA]: "Pendiente",
    [EstadoReclamoGarantia.APROBADO]: "Aprobada",
    [EstadoReclamoGarantia.RECHAZADO]: "Rechazada",
  }

  return {
    idReclamoGarantia: solicitud.idReclamoGarantia,
    idOrdenDeTrabajo:
      solicitud.ventaReclamada.ordenDeTrabajo?.idOrdenDeTrabajo ?? null,
    idVenta: solicitud.ventaReclamada.idVenta,
    fechaIngreso,
    estado: { codigo: solicitud.estado, nombre: estados[solicitud.estado] },
    motivo: solicitud.motivo,
    veredicto: solicitud.tipoResolucion,
    observacionesResolucion: solicitud.justificacionResolucion,
    idVentaGenerada: solicitud.idVentaGenerada,
  }
}

/**
 * PATCH /api/garantias/:idReclamoGarantia/resolucion
 * Formaliza el veredicto de una solicitud pendiente. La acción está separada
 * de la edición de motivo para que el frontend pueda mostrarla solo a un
 * Administrador y porque una resolución no puede deshacerse desde CU77.
 *
 * Contrato para el frontend:
 * - Enviar { veredicto: "APROBADA" | "RECHAZADA", observaciones?: string }.
 * - La respuesta exitosa entrega la misma ficha que GET y PATCH de garantía.
 * - Un 409 significa que otra acción ya resolvió la solicitud y la vista debe
 *   ocultar el formulario de resolución.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    // El permiso propio de CU77 evita que Asesor Técnico, aunque pueda editar
    // datos de ingreso, apruebe o rechace una solicitud de garantía.
    const { response } = await requirePermission(PERMISSIONS.WARRANTIES_RESOLVE)

    if (response) {
      return response
    }

    const { idReclamoGarantia: idParam } = await context.params
    const idReclamoGarantia = obtenerIdGarantia(idParam)

    if (!idReclamoGarantia) {
      return NextResponse.json(
        {
          code: "ID_GARANTIA_INVALIDO",
          message: "El identificador de la solicitud de garantía no es válido",
        },
        { status: 400 }
      )
    }

    let body: unknown

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          code: "JSON_INVALIDO",
          message: "El cuerpo de la solicitud no contiene un JSON válido",
        },
        { status: 400 }
      )
    }

    const veredictoRecibido =
      body && typeof body === "object" && "veredicto" in body
        ? body.veredicto
        : undefined

    // El caso de uso exige informar claramente que falta el veredicto antes de
    // aplicar la validación general de los demás campos del formulario.
    if (
      veredictoRecibido === undefined ||
      (typeof veredictoRecibido === "string" && veredictoRecibido.trim() === "")
    ) {
      return NextResponse.json(
        {
          code: "VEREDICTO_REQUERIDO",
          message: "Debe seleccionar un veredicto para resolver la solicitud",
        },
        { status: 400 }
      )
    }

    const validation = resolverGarantiaSchema.safeParse(body)

    if (!validation.success) {
      const veredictoInvalido = validation.error.issues.some(
        (issue) => issue.path[0] === "veredicto"
      )

      return NextResponse.json(
        {
          code: veredictoInvalido ? "VEREDICTO_INVALIDO" : "DATOS_INVALIDOS",
          message: veredictoInvalido
            ? "El veredicto debe ser APROBADA o RECHAZADA"
            : "Los datos de resolución de la garantía no son válidos",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const resolucion = RESOLUCION_POR_VEREDICTO[validation.data.veredicto]

    // La condición forma parte de la escritura: solo una petición puede pasar
    // desde pendiente a resuelta, incluso si dos administradores actúan a la vez.
    const resultado = await db.reclamoGarantia.updateMany({
      where: {
        idReclamoGarantia,
        estado: {
          in: ESTADOS_GARANTIA_PENDIENTES,
        },
        tipoResolucion: null,
      },
      data: {
        estado: resolucion.estado,
        tipoResolucion: resolucion.tipoResolucion,
        justificacionResolucion: validation.data.observaciones || null,
      },
    })

    if (resultado.count === 0) {
      // Consultar solo después del fallo permite distinguir una URL inexistente
      // de una garantía que ya fue resuelta y no puede modificarse otra vez.
      const solicitud = await db.reclamoGarantia.findUnique({
        where: {
          idReclamoGarantia,
        },
        select: {
          idReclamoGarantia: true,
        },
      })

      if (!solicitud) {
        return NextResponse.json(
          {
            code: "GARANTIA_NO_ENCONTRADA",
            message: "La solicitud de garantía indicada no existe",
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          code: "GARANTIA_YA_RESUELTA",
          message:
            "No es posible resolver una solicitud de garantía que ya fue resuelta",
        },
        { status: 409 }
      )
    }

    // La recarga usa el selector común, por lo que el frontend recibe estado,
    // veredicto y observaciones listos para actualizar su detalle y listado.
    const garantiaResuelta = await db.reclamoGarantia.findUnique({
      where: {
        idReclamoGarantia,
      },
      select: GARANTIA_RESUELTA_SELECT,
    })

    if (!garantiaResuelta) {
      throw new Error("La garantía resuelta no pudo recuperarse")
    }

    return NextResponse.json(
      {
        code: "GARANTIA_RESUELTA",
        message: "La solicitud de garantía fue resuelta correctamente",
        garantia: presentarGarantiaResuelta(garantiaResuelta),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[GARANTIAS_RESOLUCION_PATCH]", error)

    return NextResponse.json(
      {
        code: "ERROR_RESOLVER_GARANTIA",
        message: "No fue posible resolver la solicitud de garantía",
      },
      { status: 500 }
    )
  }
}
