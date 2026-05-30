import { inventoryRepository } from "@/lib/inventory/repository";
import { productoServicioRepository } from "@/lib/producto-servicio/repository";
import { serviciosRepository } from "@/lib/servicios/repository";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ idServicio: string }> }
) {
  try {
    const { idServicio } = await params;
    const { id_producto, cantidad, precio_unitario } = await req.json();

    if (!id_producto || !cantidad) {
      return NextResponse.json(
        { code: "FALTAN_DATOS", message: "Producto y cantidad son obligatorios" },
        { status: 400 }
      );
    }

    const servicio = await serviciosRepository.findById(Number(idServicio));

    if (!servicio) {
      return NextResponse.json(
        { code: "SERVICIO_NO_EXISTE", message: "El servicio no existe" },
        { status: 404 }
      );
    }

    const producto = await inventoryRepository.findById(Number(id_producto));

    if (!producto) {
      return NextResponse.json(
        { code: "PRODUCTO_NO_EXISTE", message: "El producto no existe" },
        { status: 404 }
      );
    }

    const relaciones = await productoServicioRepository.findByServicioId(
      servicio.id_servicio
    );

    const yaExiste = relaciones.some(
      (relacion) => relacion.id_producto === producto.id_producto
    );

    if (yaExiste) {
      return NextResponse.json(
        { code: "PRODUCTO_YA_ASOCIADO", message: "Ese producto ya está asociado al servicio" },
        { status: 409 }
      );
    }

    const relacion = await productoServicioRepository.create({
      id_servicio: servicio.id_servicio,
      id_producto: producto.id_producto,
      cantidad: Number(cantidad),
      precio_unitario: Number(precio_unitario ?? producto.precio_venta),
    });

    return NextResponse.json({ relacion, servicio, producto }, { status: 201 });
  } catch (error) {
    console.log("[SERVICIO_PRODUCTO_POST]", error);
    return NextResponse.json({ code: "ERROR_INTERNO" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ idServicio: string }> }
) {
  const { idServicio } = await params;

  const relaciones = await productoServicioRepository.findByServicioId(
    Number(idServicio)
  );

  return NextResponse.json(relaciones);
}