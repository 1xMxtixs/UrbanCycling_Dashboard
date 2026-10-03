import { NextResponse } from "next/server";
import { z } from "zod";

import { EstadoReclamoGarantia } from "@/generated/prisma";
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";

const actualizarGarantiaSchema = z
  .object({
    motivo: z
      .string()
      .trim()
      .min(1, "El motivo del reclamo es obligatorio")
      .max(
        500,
        "El motivo del reclamo no puede superar los 500 caracteres"
      ),

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

/**
 * PATCH /api/garantias/[id]
 *
 * Permite modificar una solicitud de garantía
 * mientras permanezca en estado INGRESADO.
 */
export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    /*
     * Permiso necesario para modificar garantías.
     */
    const { response } = await requirePermission(
      PERMISSIONS.WARRANTIES_UPDATE
    );

    if (response) {
      return response;
    }

    /*
     * Obtener ID.
     */
    const { id } = await context.params;

    const idGarantia = Number(id);

    if (
      !Number.isInteger(idGarantia) ||
      idGarantia <= 0
    ) {
      return NextResponse.json(
        {
          code: "ID_INVALIDO",
          message:
            "El identificador de la garantía no es válido",
        },
        { status: 400 }
      );
    }

    /*
     * Leer JSON.
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
        { status: 400 }
      );
    }

    /*
     * Validar datos.
     */
    const validation =
      actualizarGarantiaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          code: "DATOS_INVALIDOS",
          message:
            "Los datos enviados no son válidos",
          errors:
            validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      motivo,
      observaciones,
    } = validation.data;

    /*
     * Buscar garantía.
     */
    const garantia =
      await db.reclamoGarantia.findUnique({
        where: {
          idReclamoGarantia: idGarantia,
        },
        select: {
          idReclamoGarantia: true,
          idVentaReclamada: true,
          fechaRegistro: true,
          estado: true,
          motivo: true,
          tipoResolucion: true,
          justificacionResolucion: true,
        },
      });

    if (!garantia) {
      return NextResponse.json(
        {
          code: "GARANTIA_NO_EXISTE",
          message:
            "No se encontró la solicitud de garantía indicada",
        },
        { status: 404 }
      );
    }

    /*
     * Una garantía solo puede modificarse
     * mientras está INGRESADA.
     */
    if (
      garantia.estado !==
      EstadoReclamoGarantia.INGRESADO
    ) {
      return NextResponse.json(
        {
          code: "GARANTIA_NO_MODIFICABLE",
          message:
            "La solicitud de garantía solo puede modificarse mientras está ingresada",
        },
        { status: 409 }
      );
    }

    /*
     * Actualizar.
     */
    const garantiaActualizada =
      await db.reclamoGarantia.update({
        where: {
          idReclamoGarantia: idGarantia,
        },

        data: {
          motivo,
          /*
           * En el modelo actual las observaciones
           * de resolución utilizan este campo.
           *
           * Mientras la garantía está INGRESADA,
           * lo utilizamos para conservar las
           * observaciones de la solicitud.
           */
          justificacionResolucion:
            observaciones?.trim() || null,
        },

        select: {
          idReclamoGarantia: true,
          idVentaReclamada: true,
          fechaRegistro: true,
          estado: true,
          motivo: true,
          tipoResolucion: true,
          justificacionResolucion: true,
        },
      });

    return NextResponse.json(
      {
        code: "GARANTIA_ACTUALIZADA",
        message:
          "La solicitud de garantía fue modificada correctamente",

        garantia: {
          idGarantia:
            garantiaActualizada.idReclamoGarantia,

          idVenta:
            garantiaActualizada.idVentaReclamada,

          motivoReclamo:
            garantiaActualizada.motivo,

          observaciones:
            garantiaActualizada.justificacionResolucion,

          estado:
            garantiaActualizada.estado,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[GARANTIAS_PATCH]",
      error
    );

    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message:
          "No fue posible modificar la solicitud de garantía",
      },
      { status: 500 }
    );
  }
}