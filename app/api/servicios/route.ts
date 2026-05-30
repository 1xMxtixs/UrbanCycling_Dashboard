import { serviciosRepository } from "@/lib/servicios/repository";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { nombre, descripcion, precio_venta, estado } = await req.json();

    if (!nombre || precio_venta === undefined) {
      return NextResponse.json(
        { code: "FALTAN_DATOS", message: "Nombre y precio son obligatorios" },
        { status: 400 }
      );
    }

    const servicioExistente = await serviciosRepository.findByName(nombre);

    if (servicioExistente) {
      return NextResponse.json(
        { code: "SERVICIO_DUPLICADO", message: "Ya existe un servicio con ese nombre" },
        { status: 409 }
      );
    }

    const servicio = await serviciosRepository.create({
      nombre,
      descripcion: descripcion ?? "",
      precio_venta: Number(precio_venta),
      estado: estado ?? "activo",
    });

    return NextResponse.json(servicio, { status: 201 });
  } catch (error) {
    console.log("[SERVICIOS_POST]", error);
    return NextResponse.json({ code: "ERROR_INTERNO" }, { status: 500 });
  }
}

export async function GET() {
  const servicios = await serviciosRepository.findMany();
  return NextResponse.json(servicios);
}