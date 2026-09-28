import { NextResponse } from "next/server"
import { z } from "zod"

import { EstadoReclamoGarantia } from "@/generated/prisma"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { ESTADO_OT } from "@/lib/work-order-status"

const FORMATO_FECHA_INGRESO = /^(\d{2})-(\d{2})-(\d{4})$/

/**
 * Convierte la fecha visible del formulario (DD-MM-YYYY) a una fecha UTC.
 * También comprueba que el día exista realmente, evitando fechas como 31-02.
 */
function convertirFechaIngreso(value: string) {
  const coincidencia = FORMATO_FECHA_INGRESO.exec(value)

  if (!coincidencia) {
    return null
  }

  const dia = Number(coincidencia[1])
  const mes = Number(coincidencia[2])
  const anio = Number(coincidencia[3])

  if (anio < 1000) {
    return null
  }

  const fecha = new Date(Date.UTC(anio, mes - 1, dia))

  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null
  }

  return fecha
}

const crearGarantiaSchema = z
  .object({
    idOrdenDeTrabajo: z.coerce.number().int().positive(),
    fechaIngreso: z
      .string()
      .trim()
      .refine((value) => convertirFechaIngreso(value) !== null),
    motivo: z.string().trim().min(1).max(500),
  })
  .strict()

function obtenerMotivo(body: unknown) {
  if (!body || typeof body !== "object" || !("motivo" in body)) {
    return null
  }

  return typeof body.motivo === "string" ? body.motivo.trim() : null
}

/**
 * POST /api/garantias
 * Registra una solicitud de garantía para una orden de trabajo entregada.
 * El frontend envía el identificador visible de la OT, pero el reclamo se
 * relaciona con su Venta raíz mediante ReclamoGarantia.idVentaReclamada.
 */
export async function POST(request: Request) {
  try {
    // CU74 permite registrar solicitudes al Administrador y al Asesor Técnico.
    const { response } = await requirePermission(PERMISSIONS.WARRANTIES_CREATE)

    if (response) {
      return response
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

    // El motivo corresponde a la observación de ingreso definida por CU74.
    const motivo = obtenerMotivo(body)

    if (!motivo) {
      return NextResponse.json(
        {
          code: "MOTIVO_REQUERIDO",
          message: "Debe ingresar un motivo para la solicitud de garantía",
        },
        { status: 400 }
      )
    }

    const validation = crearGarantiaSchema.safeParse(body)

    if (!validation.success) {
      const fechaInvalida = validation.error.issues.some(
        (issue) => issue.path[0] === "fechaIngreso"
      )

      return NextResponse.json(
        {
          code: fechaInvalida ? "FECHA_INGRESO_INVALIDA" : "DATOS_INVALIDOS",
          message: fechaInvalida
            ? "La fecha de ingreso debe ser una fecha válida en formato DD-MM-YYYY"
            : "Los datos de la solicitud de garantía no son válidos",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { idOrdenDeTrabajo, fechaIngreso } = validation.data
    const fechaRegistro = convertirFechaIngreso(fechaIngreso)

    // La validación anterior garantiza que la conversión produzca una fecha.
    if (!fechaRegistro) {
      return NextResponse.json(
        {
          code: "FECHA_INGRESO_INVALIDA",
          message:
            "La fecha de ingreso debe ser una fecha válida en formato DD-MM-YYYY",
        },
        { status: 400 }
      )
    }

    // Solo se requieren la venta raíz y el estado para aplicar las reglas del CU.
    const orden = await db.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo,
      },
      select: {
        idOrdenDeTrabajo: true,
        idVenta: true,
        estado: true,
      },
    })

    if (!orden) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "No se encontró la orden de trabajo indicada",
        },
        { status: 404 }
      )
    }

    // Una garantía solo puede originarse desde una reparación ya entregada.
    if (orden.estado !== ESTADO_OT.ENTREGADO) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_ENTREGADA",
          message:
            "La solicitud de garantía solo puede registrarse para una orden entregada",
        },
        { status: 409 }
      )
    }

    // El modelo unifica ventas y OTs bajo Venta; por eso se persiste idVenta.
    const garantia = await db.reclamoGarantia.create({
      data: {
        idVentaReclamada: orden.idVenta,
        fechaRegistro,
        estado: EstadoReclamoGarantia.INGRESADO,
        motivo: validation.data.motivo,
      },
      select: {
        idReclamoGarantia: true,
        idVentaReclamada: true,
        fechaRegistro: true,
        estado: true,
        motivo: true,
      },
    })

    // Se incluyen ambos identificadores para que el frontend mantenga la OT
    // visible mientras la base conserva la relación normalizada con Venta.
    return NextResponse.json(
      {
        code: "GARANTIA_REGISTRADA",
        message: "La solicitud de garantía fue registrada correctamente",
        garantia: {
          idReclamoGarantia: garantia.idReclamoGarantia,
          idOrdenDeTrabajo: orden.idOrdenDeTrabajo,
          idVenta: garantia.idVentaReclamada,
          fechaIngreso,
          estado: garantia.estado,
          motivo: garantia.motivo,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[GARANTIAS_POST]", error)

    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message: "No fue posible registrar la solicitud de garantía",
      },
      { status: 500 }
    )
  }
}
