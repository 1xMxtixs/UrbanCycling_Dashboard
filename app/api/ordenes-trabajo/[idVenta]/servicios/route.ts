import { inventoryRepository } from "@/lib/inventory/repository";
import { lineasOrdenTrabajoRepository } from "@/lib/lineas-orden-trabajo/repository";
import { ordenesTrabajoRepository } from "@/lib/ordenes-trabajo/repository";
import { productoServicioRepository } from "@/lib/producto-servicio/repository";
import { serviciosRepository } from "@/lib/servicios/repository";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ idVenta: string }> }
) {
  try {
    const { idVenta } = await params;
    const { id_servicio, cantidad } = await req.json();

    if (!id_servicio || !cantidad) {
      return NextResponse.json(
        {
          code: "FALTAN_DATOS",
          message: "Servicio y cantidad son obligatorios",
        },
        { status: 400 }
      );
    }

    const id_venta = Number(idVenta);
    const cantidadServicio = Number(cantidad);

    const orden = await ordenesTrabajoRepository.findByVentaId(id_venta);

    if (!orden) {
      return NextResponse.json(
        {
          code: "ORDEN_NO_EXISTE",
          message: "La orden de trabajo no existe",
        },
        { status: 404 }
      );
    }

    const servicio = await serviciosRepository.findById(Number(id_servicio));

    if (!servicio) {
      return NextResponse.json(
        {
          code: "SERVICIO_NO_EXISTE",
          message: "El servicio no existe",
        },
        { status: 404 }
      );
    }

    const productosServicio =
      await productoServicioRepository.findByServicioId(servicio.id_servicio);

    if (productosServicio.length === 0) {
      return NextResponse.json(
        {
          code: "SERVICIO_SIN_INSUMOS",
          message: "El servicio no tiene insumos asociados",
        },
        { status: 409 }
      );
    }

    const productosAUtilizar = [];

    for (const item of productosServicio) {
      const producto = await inventoryRepository.findById(item.id_producto);

      if (!producto) {
        return NextResponse.json(
          {
            code: "INSUMO_NO_EXISTE",
            message: `El insumo con ID ${item.id_producto} no existe`,
            id_producto: item.id_producto,
          },
          { status: 404 }
        );
      }

      const cantidadNecesaria = item.cantidad * cantidadServicio;

      if (producto.stock_actual < cantidadNecesaria) {
        return NextResponse.json(
          {
            code: "STOCK_INSUFICIENTE",
            message: `No hay stock suficiente para ${producto.nombre}`,
            producto: {
              id_producto: producto.id_producto,
              nombre: producto.nombre,
              stock_actual: producto.stock_actual,
            },
            cantidad_requerida: cantidadNecesaria,
            cantidad_disponible: producto.stock_actual,
          },
          { status: 409 }
        );
      }

      productosAUtilizar.push({
        producto,
        cantidadNecesaria,
      });
    }

    const linea = await lineasOrdenTrabajoRepository.create({
      id_venta,
      id_servicio: servicio.id_servicio,
      cantidad: cantidadServicio,
      precio_unitario: servicio.precio_venta,
    });

    for (const item of productosAUtilizar) {
      await inventoryRepository.update(item.producto.id_producto, {
        stock_actual: item.producto.stock_actual - item.cantidadNecesaria,
      });
    }

    return NextResponse.json(
      {
        linea,
        servicio,
        productos_utilizados: productosAUtilizar.map((item) => ({
          id_producto: item.producto.id_producto,
          nombre: item.producto.nombre,
          cantidad_utilizada: item.cantidadNecesaria,
          stock_anterior: item.producto.stock_actual,
          stock_nuevo: item.producto.stock_actual - item.cantidadNecesaria,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("[AGREGAR_SERVICIO_ORDEN]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}