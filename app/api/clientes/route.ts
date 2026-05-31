import { NextResponse } from "next/server";

function formatearRut(rut: string) {
  const rutLimpio = rut
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/-/g, "");

  if (!/^\d+[\dK]$/.test(rutLimpio)) {
    return {
      rutFormateado: null,
      error: "El RUT solo puede contener números y dígito verificador K",
    };
  }

  const cuerpo = rutLimpio.slice(0, -1);
  const dv = rutLimpio.slice(-1);

  if (cuerpo.length < 7) {
    return {
      rutFormateado: null,
      error:
        "El RUT ingresado tiene menos de 7 dígitos sin contar el verificador",
    };
  }

  if (cuerpo.length > 8) {
    return {
      rutFormateado: null,
      error:
        "El RUT ingresado tiene más de 8 dígitos sin contar el verificador",
    };
  }

  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return {
    rutFormateado: `${cuerpoFormateado}-${dv}`,
    error: null,
  };
}

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

    const { rutFormateado, error } = formatearRut(String(rut));

    if (error || !rutFormateado) {
      return new NextResponse(error ?? "El RUT ingresado no es válido", {
        status: 400,
      });
    }

    const clienteExistente = await clientesRepository.findByRut(rutFormateado);

    if (clienteExistente) {
      return new NextResponse("Ya existe un cliente con ese RUT", {
        status: 409,
      });
    }

    const cliente = await clientesRepository.create({
      tipo_cliente,
      rut: rutFormateado,
      estado,
      primer_nombre,
      segundo_nombre,
      apellido_paterno,
      apellido_materno,
      razon_social,
      giro,
      nombre_contacto,
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.log("[CLIENTES_POST]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}