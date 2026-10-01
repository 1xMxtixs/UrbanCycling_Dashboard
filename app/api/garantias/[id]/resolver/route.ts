import { NextResponse } from "next/server";
import { z } from "zod";

import { EstadoReclamoGarantia } from "@/generated/prisma";
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";

const resolverGarantiaSchema = z
  .object({
    veredicto: z.enum(["Aprobado", "Rechazado"]),
    observaciones: z
      .string()
      .trim()
      .max(500, "Las observaciones no pueden superar los 500 caracteres")
      .optional()
      .nullable(),
  })
  .strict();

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    // Solo el Administrador puede resolver solicitudes de garantía.
    const { response } = await requirePermission(
      PERMISSIONS.WARRANTIES_RESOLVE
    );

    if (response) {
      return response;
    }

    const { id } = await context.params;
    const idGarantia = Number(id);

    if (!Number.isInteger(idGarantia) || idGarantia <= 0) {
      return NextResponse.json(
        {
          code: "ID_INVALIDO",
          message: "El identificador de la garantía no es válido",
        },
        { status: 400 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          code: "JSON_INVALIDO",
          message: "El cuerpo de la solicitud no contiene un JSON válido",
        },
        { status: 400 }
      );
    }

    const validation = resolverGarantiaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          code: "DATOS_INVALIDOS",
          message:
            "Debe seleccionar un veredicto válido: Aprobado o Rechazado",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { veredicto, observaciones } = validation.data;

    /*
     * Buscar la solicitud de garantía.
     */
    const garantia = await db.reclamoGarantia.findUnique({
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
     * Una garantía ya resuelta no puede volver a resolverse.
     *
     * Los estados finales son APROBADO y RECHAZADO.
     */
    if (
      garantia.estado === EstadoReclamoGarantia.APROBADO ||
      garantia.estado === EstadoReclamoGarantia.RECHAZADO
    ) {
      return NextResponse.json(
        {
          code: "GARANTIA_YA_RESUELTA",
          message:
            "La solicitud de garantía ya fue resuelta y no puede modificarse",
        },
        { status: 409 }
      );
    }

    /*
     * Convertir el veredicto recibido desde el frontend
     * al enum utilizado por Prisma.
     */
    const nuevoEstado =
      veredicto === "Aprobado"
        ? EstadoReclamoGarantia.APROBADO
        : EstadoReclamoGarantia.RECHAZADO;

    /*
     * Guardar la resolución.
     */
    const garantiaActualizada =
      await db.reclamoGarantia.update({
        where: {
          idReclamoGarantia: idGarantia,
        },
        data: {
          estado: nuevoEstado,
          tipoResolucion: veredicto,
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
        code: "GARANTIA_RESUELTA",
        message:
          "La solicitud de garantía fue resuelta correctamente",
        garantia: garantiaActualizada,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GARANTIAS_RESOLVER_PATCH]", error);

    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message:
          "No fue posible resolver la solicitud de garantía",
      },
      { status: 500 }
    );
  }
}