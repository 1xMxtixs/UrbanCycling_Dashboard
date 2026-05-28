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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nombreCompleto = searchParams.get("nombreCompleto");

    if (!nombreCompleto) {
      return new NextResponse("Debe ingresar un nombre completo", {
        status: 400,
      });
    }

    const palabras = nombreCompleto
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const clientes = await db.cliente.findMany({
      where: {
        AND: palabras.map((palabra) => ({
          OR: [
            { primer_nombre: { contains: palabra } },
            { segundo_nombre: { contains: palabra } },
            { apellido_paterno: { contains: palabra } },
            { apellido_materno: { contains: palabra } },
          ],
        })),
      },
      orderBy: {
        fecha_creacion: "desc",
      },
    });

    if (clientes.length === 0) {
      return new NextResponse(
        "El cliente ingresado no está registrado en la base de datos",
        { status: 404 }
      );
    }

    return NextResponse.json(clientes);
  } catch (error) {
    console.log("[BUSCAR_CLIENTE]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}