import { NextResponse } from "next/server"
import { z } from "zod"

import { EstadoReclamoGarantia, type Prisma } from "@/generated/prisma"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import {
  formatearFechaGarantia,
  presentarEstadoGarantia,
} from "@/lib/warranty-response"

type RouteContext = {
  params: Promise<{
    idReclamoGarantia: string
  }>
}

const ESTADOS_GARANTIA_EDITABLES: EstadoReclamoGarantia[] = [
  EstadoReclamoGarantia.INGRESADO,
  EstadoReclamoGarantia.EN_REVISION,
  EstadoReclamoGarantia.EN_ESPERA,
]

const actualizarGarantiaSchema = z
  .object({
    motivo: z.string().trim().min(1).max(500),
  })
  .strict()

// El detalle y la edición comparten esta forma para que el frontend pueda
// reutilizar la misma ficha después de guardar los cambios.
const GARANTIA_DETALLE_SELECT = {
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

type GarantiaDetalle = Prisma.ReclamoGarantiaGetPayload<{
  select: typeof GARANTIA_DETALLE_SELECT
}>

/** Construye el contrato uniforme que consumen las vistas de garantías. */
function presentarDetalleGarantia(solicitud: GarantiaDetalle) {
  return {
    idReclamoGarantia: solicitud.idReclamoGarantia,
    idOrdenDeTrabajo:
      solicitud.ventaReclamada.ordenDeTrabajo?.idOrdenDeTrabajo ?? null,
    idVenta: solicitud.ventaReclamada.idVenta,
    fechaIngreso: formatearFechaGarantia(solicitud.fechaRegistro),
    estado: presentarEstadoGarantia(solicitud.estado),
    motivo: solicitud.motivo,
    veredicto: solicitud.tipoResolucion,
    observacionesResolucion: solicitud.justificacionResolucion,
    idVentaGenerada: solicitud.idVentaGenerada,
  }
}

/** Valida el ID recibido en la URL antes de enviarlo a Prisma. */
function obtenerIdGarantia(value: string) {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const idReclamoGarantia = Number(value)

  if (!Number.isSafeInteger(idReclamoGarantia) || idReclamoGarantia <= 0) {
    return null
  }

  return idReclamoGarantia
}

/**
 * GET /api/garantias/:idReclamoGarantia
 * Entrega la ficha que utiliza la vista de detalle de una solicitud. Incluye
 * la información de ingreso y los campos de resolución, que permanecen nulos
 * hasta que un CU posterior registre el veredicto.
 *
 * Contrato para el frontend:
 * - motivo corresponde a la observación ingresada al crear la solicitud.
 * - veredicto y observacionesResolucion son opcionales mientras esté pendiente.
 * - idVentaGenerada será nulo hasta que una resolución origine otra venta.
 * - estado incluye codigo para decisiones y nombre para presentación visual.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    // Consultar una garantía requiere el mismo permiso que alimenta el listado.
    // Si el usuario no lo posee, requirePermission responde 403 antes de que se
    // consulte o exponga cualquier dato de la solicitud.
    const { response } = await requirePermission(PERMISSIONS.WARRANTIES_READ)

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

    // La garantía guarda idVentaReclamada. Desde esa venta se obtiene la OT
    // original para que el frontend pueda enlazar su ficha o historial.
    const solicitud = await db.reclamoGarantia.findUnique({
      where: {
        idReclamoGarantia,
      },
      select: GARANTIA_DETALLE_SELECT,
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

    // motivo corresponde a la observación de ingreso definida para CU74. Los
    // campos de resolución quedan disponibles para que la misma vista sirva
    // cuando un caso de uso posterior registre el veredicto.
    return NextResponse.json(
      {
        code: "GARANTIA_CARGADA",
        garantia: presentarDetalleGarantia(solicitud),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[GARANTIAS_ID_GET]", error)

    return NextResponse.json(
      {
        code: "ERROR_CARGAR_GARANTIA",
        message: "No fue posible cargar la solicitud de garantía",
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/garantias/:idReclamoGarantia
 * Modifica la observación de ingreso de una solicitud que todavía está
 * pendiente. En CU74 ese contenido se persiste en el campo motivo.
 *
 * Contrato para el frontend:
 * - Enviar { motivo: string }; fecha, estado y resolución no son editables.
 * - Los estados INGRESADO, EN_REVISION y EN_ESPERA se muestran como Pendiente.
 * - Un 409 indica que la solicitud fue resuelta y la vista debe dejar de
 *   ofrecer la acción de modificación.
 * - La respuesta exitosa usa la misma forma que GET /api/garantias/:id.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    // CU76 autoriza la modificación únicamente mediante el permiso específico;
    // requirePermission responde 403 antes de consultar datos de la garantía.
    const { response } = await requirePermission(PERMISSIONS.WARRANTIES_UPDATE)

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

    // Se entrega un mensaje específico cuando el formulario omite la única
    // observación editable o la envía vacía después de eliminar espacios.
    const motivoRecibido =
      body && typeof body === "object" && "motivo" in body
        ? body.motivo
        : undefined

    if (
      motivoRecibido === undefined ||
      (typeof motivoRecibido === "string" && motivoRecibido.trim() === "")
    ) {
      return NextResponse.json(
        {
          code: "MOTIVO_REQUERIDO",
          message: "Debe ingresar un motivo para la solicitud de garantía",
        },
        { status: 400 }
      )
    }

    const validation = actualizarGarantiaSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          code: "DATOS_INVALIDOS",
          message: "Los datos de la solicitud de garantía no son válidos",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    // updateMany convierte la precondición del CU en parte de la escritura. Si
    // otro proceso resuelve la solicitud, esta operación no puede sobrescribirla.
    const resultado = await db.reclamoGarantia.updateMany({
      where: {
        idReclamoGarantia,
        estado: {
          in: ESTADOS_GARANTIA_EDITABLES,
        },
        tipoResolucion: null,
      },
      data: {
        motivo: validation.data.motivo,
      },
    })

    if (resultado.count === 0) {
      // Solo se consulta la existencia cuando la escritura no ocurrió, lo que
      // permite distinguir el 404 del bloqueo de una solicitud ya resuelta.
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
          code: "GARANTIA_NO_EDITABLE",
          message:
            "No es posible modificar una solicitud de garantía que ya fue resuelta",
        },
        { status: 409 }
      )
    }

    // Recuperar la ficha después de la escritura mantiene sincronizados el
    // formulario, el detalle y la fila del listado sin conversiones adicionales.
    const solicitudActualizada = await db.reclamoGarantia.findUnique({
      where: {
        idReclamoGarantia,
      },
      select: GARANTIA_DETALLE_SELECT,
    })

    if (!solicitudActualizada) {
      throw new Error("La garantía actualizada no pudo recuperarse")
    }

    return NextResponse.json(
      {
        code: "GARANTIA_ACTUALIZADA",
        message: "La solicitud de garantía fue actualizada correctamente",
        garantia: presentarDetalleGarantia(solicitudActualizada),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[GARANTIAS_ID_PATCH]", error)

    return NextResponse.json(
      {
        code: "ERROR_ACTUALIZAR_GARANTIA",
        message: "No fue posible actualizar la solicitud de garantía",
      },
      { status: 500 }
    )
  }
}
