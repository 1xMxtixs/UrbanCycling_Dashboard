import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import { registrarAuditoriaOrdenTrabajo } from "@/lib/work-order-audit";
import { NextResponse } from "next/server";

const transicionesPermitidas: Record<string, string[]> = {
  "Por realizar": ["En curso", "En espera"],
  "En curso": ["Listo para entregar", "En espera"],
  "En espera": ["En curso", "Listo para entregar"],
  "Listo para entregar": ["Entregado", "En curso"],
  "Entregado": [],
  "Anulada": [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
    const { session, response } = await requirePermission(
      PERMISSIONS.WORK_ORDERS_UPDATE_STATUS
    )

    if (response || !session) {
      return response
    }

    const { idVenta } = await params;
    const { estado } = await req.json();
    const idOrdenDeTrabajo = Number(idVenta);

    if (!estado) {
      return NextResponse.json(
        { code: "FALTA_ESTADO", message: "Debe ingresar un estado" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(idOrdenDeTrabajo) || idOrdenDeTrabajo <= 0) {
      return NextResponse.json(
        { code: "ID_INVALIDO", message: "El ID de la orden no es válido" },
        { status: 400 }
      );
    }

    const ordenTrabajo = await db.ordenDeTrabajo.findUnique({
      where: {
        idOrdenDeTrabajo,
      },
    });

    if (!ordenTrabajo) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden no existe",
        },
        { status: 404 }
      );
    }

    if (estado === "Anulada") {
      if (["Entregado", "Anulada"].includes(ordenTrabajo.estado)) {
        return NextResponse.json(
          {
            code: "ANULACION_NO_PERMITIDA",
            message: "La orden ya se encuentra Entregada o Anulada",
          },
          { status: 409 }
        );
      }
    } else {
    const estadosSiguientes =
      transicionesPermitidas[ordenTrabajo.estado] ?? [];

    if (!estadosSiguientes.includes(estado)) {
      return NextResponse.json(
        {
          code: "CAMBIO_ESTADO_NO_PERMITIDO",
          message: `No se puede cambiar una orden desde "${ordenTrabajo.estado}" a "${estado}"`,
        },
        { status: 409 }
      );
    }
    }

    const ordenActualizada = await db.$transaction(async (tx) => {
      const orden = await tx.ordenDeTrabajo.update({
        where: {
          idOrdenDeTrabajo,
        },
        data: {
          estado,
          fechaEntregaReal: ["Listo para entregar", "Entregado"].includes(estado) ? new Date() : undefined,
        },
      });

      await registrarAuditoriaOrdenTrabajo(tx, {
        idUsuario: session.user.idUsuario,
        tipoOperacion: estado === "Anulada" ? "anulacion_orden" : "cambio_estado",
        idOrdenDeTrabajo,
        valorAnterior: {
          estado: ordenTrabajo.estado,
          fechaEntregaReal: ordenTrabajo.fechaEntregaReal,
        },
        valorNuevo: {
          estado: orden.estado,
          fechaEntregaReal: orden.fechaEntregaReal,
        },
        detalleCambio:
          estado === "Anulada"
            ? "Anulacion de orden de trabajo"
            : `Cambio de estado de orden a ${estado}`,
      });

      return orden;
    });

    return NextResponse.json({
      ...ordenActualizada,
      estadoOrden: ordenActualizada.estado,
    });
  } catch (error) {
    console.log("[ACTUALIZAR_ESTADO_ORDEN]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
