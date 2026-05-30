import { bicicletasRepository } from "@/lib/bicicletas/repository";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const { marca, modelo, color, descripcion_adicional } = data;

    if (!marca || !modelo || !color) {
      return NextResponse.json(
        {
          code: "FALTAN_DATOS",
          message: "Marca, modelo y color son obligatorios",
        },
        { status: 400 }
      );
    }

    const bicicleta = await bicicletasRepository.create({
      id_venta: 0,
      marca,
      modelo,
      color,
      descripcion_adicional: descripcion_adicional ?? null,
    });

    return NextResponse.json(bicicleta, { status: 201 });
  } catch (error) {
    console.log("[CREAR_BICICLETA]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}