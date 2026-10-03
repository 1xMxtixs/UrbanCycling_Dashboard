import { NextResponse } from "next/server";
import { z } from "zod";

import {
  EstadoReclamoGarantia,
  type Prisma,
} from "@/generated/prisma";

import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";

type RouteContext = {
  params: Promise<{
    idReclamoGarantia: string;
  }>;
};

const resolverGarantiaSchema = z
  .object({
    veredicto: z.enum(["APROBADA", "RECHAZADA"]),

    observaciones: z
      .string()
      .trim()
      .max(
        500,
        "Las observaciones no pueden superar los 500 caracteres"
      )
      .optional()
      .nullable(),
  })
  .strict();

const RESOLUCION_POR_VEREDICTO = {
  APROBADA: {
    estado: EstadoReclamoGarantia.APROBADO,
    tipoResolucion: "APROBADA",
  },

  RECHAZADA: {
    estado: EstadoReclamoGarantia.RECHAZADO,
    tipoResolucion: "RECHAZADA",
  },
} as const;

const ESTADOS_GARANTIA_PENDIENTES: EstadoReclamoGarantia[] = [
  EstadoReclamoGarantia.INGRESADO,
  EstadoReclamoGarantia.EN_REVISION,
  EstadoReclamoGarantia.EN_ESPERA,
];

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
} satisfies Prisma.ReclamoGarantiaSelect;

type GarantiaResuelta = Prisma.ReclamoGarantiaGetPayload<{
  select: typeof GARANTIA_RESUELTA_SELECT;
}>;

function obtenerIdGarantia(value: string) {
  const limpio = String(value).trim();

  if (!/^\d+$/.test(limpio)) {
    return null;
  }

  const id = Number(limpio);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function formatearFecha(fecha: Date) {
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = fecha.getFullYear();

  return `${dia}-${mes}-${anio}`;
}

function presentarEstado(
  estado: EstadoReclamoGarantia
) {
  switch (estado) {
    case EstadoReclamoGarantia.INGRESADO:
      return "Ingresado";

    case EstadoReclamoGarantia.EN_REVISION:
      return "En Revisión";

    case EstadoReclamoGarantia.EN_ESPERA:
      return "En Espera";

    case EstadoReclamoGarantia.APROBADO:
      return "Aprobado";

    case EstadoReclamoGarantia.RECHAZADO:
      return "Rechazado";

    default:
      return String(estado);
  }
}

function presentarGarantiaResuelta(
  solicitud: GarantiaResuelta
) {
  return {
    idGarantia:
      solicitud.idReclamoGarantia,

    idReclamoGarantia:
      solicitud.idReclamoGarantia,

    idOrdenDeTrabajo:
      solicitud.ventaReclamada.ordenDeTrabajo
        ?.idOrdenDeTrabajo ?? null,

    idVenta:
      solicitud.ventaReclamada.idVenta,

    fechaIngreso:
      formatearFecha(
        solicitud.fechaRegistro
      ),

    estado:
      presentarEstado(
        solicitud.estado
      ),

    motivoReclamo:
      solicitud.motivo,

    motivo:
      solicitud.motivo,

    veredicto:
      solicitud.tipoResolucion,

    observaciones:
      solicitud.justificacionResolucion,

    observacionesResolucion:
      solicitud.justificacionResolucion,

    idVentaGenerada:
      solicitud.idVentaGenerada,
  };
}

/**
 * PATCH
 *
 * /api/garantias/:idReclamoGarantia/resolucion
 *
 * Resuelve una solicitud de garantía.
 */
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    /*
     * ============================================================
     * PERMISO
     * ============================================================
     */

    const { response } =
      await requirePermission(
        PERMISSIONS.WARRANTIES_RESOLVE
      );

    if (response) {
      return response;
    }

    /*
     * ============================================================
     * ID
     * ============================================================
     */

    const {
      idReclamoGarantia: idParam,
    } = await context.params;

    const idReclamoGarantia =
      obtenerIdGarantia(idParam);

    if (!idReclamoGarantia) {
      return NextResponse.json(
        {
          code: "ID_GARANTIA_INVALIDO",

          message:
            "El identificador de la solicitud de garantía no es válido",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================================================
     * JSON
     * ============================================================
     */

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          code: "JSON_INVALIDO",

          message:
            "El cuerpo de la solicitud no contiene un JSON válido",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * ============================================================
     * VALIDACIÓN
     * ============================================================
     */

    const validation =
      resolverGarantiaSchema.safeParse(
        body
      );

    if (!validation.success) {
      return NextResponse.json(
        {
          code: "DATOS_INVALIDOS",

          message:
            "El veredicto debe ser APROBADA o RECHAZADA",

          errors:
            validation.error.flatten()
              .fieldErrors,
        },
        {
          status: 400,
        }
      );
    }

    const {
      veredicto,
      observaciones,
    } = validation.data;

    /*
     * ============================================================
     * RESOLUCIÓN
     * ============================================================
     */

    const resolucion =
      RESOLUCION_POR_VEREDICTO[
        veredicto
      ];

    /*
     * ============================================================
     * ACTUALIZACIÓN ATÓMICA
     *
     * Solo permite resolver garantías
     * que todavía estén pendientes.
     * ============================================================
     */

    const resultado =
      await db.reclamoGarantia.updateMany({
        where: {
          idReclamoGarantia,

          estado: {
            in: ESTADOS_GARANTIA_PENDIENTES,
          },

          tipoResolucion: null,
        },

        data: {
          estado:
            resolucion.estado,

          tipoResolucion:
            resolucion.tipoResolucion,

          justificacionResolucion:
            observaciones?.trim() || null,
        },
      });

    /*
     * ============================================================
     * NO SE ACTUALIZÓ
     * ============================================================
     */

    if (resultado.count === 0) {
      const solicitud =
        await db.reclamoGarantia.findUnique({
          where: {
            idReclamoGarantia,
          },

          select: {
            idReclamoGarantia: true,
            estado: true,
          },
        });

      if (!solicitud) {
        return NextResponse.json(
          {
            code:
              "GARANTIA_NO_ENCONTRADA",

            message:
              "La solicitud de garantía indicada no existe",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json(
        {
          code:
            "GARANTIA_YA_RESUELTA",

          message:
            "No es posible resolver una solicitud de garantía que ya fue resuelta",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * ============================================================
     * RECUPERAR GARANTÍA ACTUALIZADA
     * ============================================================
     */

    const garantiaResuelta =
      await db.reclamoGarantia.findUnique({
        where: {
          idReclamoGarantia,
        },

        select:
          GARANTIA_RESUELTA_SELECT,
      });

    if (!garantiaResuelta) {
      throw new Error(
        "La garantía resuelta no pudo recuperarse"
      );
    }

    /*
     * ============================================================
     * RESPUESTA
     * ============================================================
     */

    return NextResponse.json(
      {
        code:
          "GARANTIA_RESUELTA",

        message:
          "La solicitud de garantía fue resuelta correctamente",

        garantia:
          presentarGarantiaResuelta(
            garantiaResuelta
          ),
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "[GARANTIAS_RESOLUCION_PATCH]",
      error
    );

    return NextResponse.json(
      {
        code:
          "ERROR_RESOLVER_GARANTIA",

        message:
          "No fue posible resolver la solicitud de garantía",
      },
      {
        status: 500,
      }
    );
  }
}