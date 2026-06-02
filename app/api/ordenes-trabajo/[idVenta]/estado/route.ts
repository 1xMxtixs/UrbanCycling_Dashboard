import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const transicionesPermitidas: Record<string, string[]> = {
  "Por realizar": ["En curso"],
  "En curso": ["Listo para entregar"],
  "Listo para entregar": ["Entregado"],
  "Entregado": [],
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
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
          message: "La orden de trabajo no existe",
        },
        { status: 404 }
      );
    }

    const estadosSiguientes =
      transicionesPermitidas[ordenTrabajo.estadoOrden] ?? [];

    if (!estadosSiguientes.includes(estado)) {
      return NextResponse.json(
        {
          code: "CAMBIO_ESTADO_NO_PERMITIDO",
          message: `No se puede cambiar una orden desde "${ordenTrabajo.estadoOrden}" a "${estado}"`,
        },
        { status: 409 }
      );
    }

    const ordenActualizada = await db.ordenDeTrabajo.update({
      where: {
        idOrdenDeTrabajo,
      },
      data: {
        estadoOrden: estado,
        fechaEntregaReal: estado === "Entregado" ? new Date() : undefined,
      },
    });

    return NextResponse.json(ordenActualizada);
  } catch (error) {
    console.log("[ACTUALIZAR_ESTADO_ORDEN]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
