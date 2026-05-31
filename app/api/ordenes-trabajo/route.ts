import { bicicletasRepository } from "@/lib/bicicletas/repository";
import { clientesRepository } from "@/lib/clientes/repository";
import { ordenesTrabajoRepository } from "@/lib/ordenes-trabajo/repository";
import { lineasOrdenTrabajoRepository } from "@/lib/lineas-orden-trabajo/repository";
import { ventasRepository } from "@/lib/ventas/repository";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      nombre_completo_cliente,
      id_bicicleta,
      id_usuario,
      id_comprobante,
      estado_pago,
      descuento,
      total,
      estado_orden,
      fecha_entrega_estimada,
      observaciones_ingreso,
    } = data;

    if (
      !nombre_completo_cliente ||
      !id_bicicleta ||
      !id_usuario ||
      !id_comprobante
    ) {
      return NextResponse.json(
        { code: "FALTAN_DATOS", message: "Faltan datos obligatorios" },
        { status: 400 }
      );
    }

    const clientes = await clientesRepository.findByNombreCompleto(
      nombre_completo_cliente
    );

    if (clientes.length === 0) {
      return NextResponse.json(
        {
          code: "CLIENTE_NO_EXISTE",
          message:
            "El cliente no está registrado. Debe registrarlo antes de crear la orden.",
        },
        { status: 404 }
      );
    }

    if (clientes.length > 1) {
      return NextResponse.json(
        {
          code: "CLIENTE_AMBIGUO",
          message:
            "Hay más de un cliente con ese nombre. Seleccione uno específico.",
          clientes,
        },
        { status: 409 }
      );
    }

    const cliente = clientes[0];

    const bicicleta = await bicicletasRepository.findById(Number(id_bicicleta));

    if (!bicicleta) {
      return NextResponse.json(
        {
          code: "BICICLETA_NO_EXISTE",
          message:
            "La bicicleta no está registrada. Debe registrarla antes de crear la orden.",
        },
        { status: 404 }
      );
    }

    const venta = await ventasRepository.create({
      id_usuario: Number(id_usuario),
      id_cliente: cliente.id_cliente,
      id_comprobante: Number(id_comprobante),
      estado_pago: estado_pago ?? "pendiente",
      descuento: Number(descuento ?? 0),
      total: 0,
    });

    const bicicletaActualizada = await bicicletasRepository.update(
      bicicleta.id_bicicleta,
      {
        id_venta: venta.id_venta,
      }
    );

    const ordenTrabajo = await ordenesTrabajoRepository.create({
      id_venta: venta.id_venta,
      fecha_entrega_estimada: fecha_entrega_estimada
        ? new Date(fecha_entrega_estimada)
        : null,
      fecha_entrega_real: null,
      observaciones_ingreso: observaciones_ingreso ?? null,
    });

    return NextResponse.json(
      {
        venta,
        ordenTrabajo,
        cliente,
        bicicleta: bicicletaActualizada ?? bicicleta,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("[CREAR_ORDEN_TRABAJO]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const ordenes = await ordenesTrabajoRepository.findMany();

    const ordenesConDetalle = await Promise.all(
      ordenes.map(async (orden) => {
        const venta = await ventasRepository.findById(orden.id_venta);
        const lineas = await lineasOrdenTrabajoRepository.findByVentaId(
          orden.id_venta
        );

        const totalServicios = lineas.reduce(
          (total, linea) => total + linea.cantidad * linea.precio_unitario,
          0
        );

        const bicicleta = await bicicletasRepository.findMany({
          id_venta: orden.id_venta,
        });

        return {
          ...orden,
          venta,
          bicicletas: bicicleta,
          lineas,
          total_servicios: totalServicios,
        };
      })
    );

    return NextResponse.json(ordenesConDetalle);
  } catch (error) {
    console.log("[ORDENES_TRABAJO_GET]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}