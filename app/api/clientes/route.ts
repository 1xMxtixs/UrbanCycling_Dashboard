import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      tipo_cliente,
      rut,
      estado,
      primer_nombre,
      segundo_nombre,
      apellido_paterno,
      apellido_materno,
      razon_social,
      giro,
      nombre_contacto,
    } = data;

    if (!tipo_cliente || !rut || !estado) {
      return new NextResponse("Faltan campos obligatorios", { status: 400 });
    }

    const rutNormalizado = String(rut).trim().toUpperCase();

    if (!rutRegex.test(rutNormalizado)) {
      return new NextResponse("El RUT debe tener formato 12.345.678-9", {
        status: 400,
      });
    }

    const clienteExistente = await db.cliente.findUnique({
      where: {
        rut: rutNormalizado,
      },
    });

    if (clienteExistente) {
      return new NextResponse("Ya existe un cliente con ese RUT", {
        status: 409,
      });
    }

    const cliente = await db.cliente.create({
      data: {
        tipo_cliente,
        rut: rutNormalizado,
        estado,
        primer_nombre,
        segundo_nombre,
        apellido_paterno,
        apellido_materno,
        razon_social,
        giro,
        nombre_contacto,
      },
    });

    return NextResponse.json(cliente);
  } catch (error) {
    console.log("[CLIENTE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}