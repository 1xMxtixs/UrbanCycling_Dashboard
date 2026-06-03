// Endpoints generales para registrar y listar ordenes de trabajo.
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

function normalizarTexto(texto: string) {
  return texto.trim().replace(/\s+/g, " ").toLowerCase();
}

function nombreCompletoCliente(cliente: {
  primerNombre: string | null;
  segundoNombre: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  razonSocial: string | null;
}) {
  if (cliente.razonSocial) {
    return cliente.razonSocial;
  }

  return [
    cliente.primerNombre,
    cliente.segundoNombre,
    cliente.apellidoPaterno,
    cliente.apellidoMaterno,
  ]
    .filter(Boolean)
    .join(" ");
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

type BicicletaInput = {
  marca?: unknown;
  modelo?: unknown;
  color?: unknown;
  descripcion?: unknown;
  imagenUrl?: unknown;
};

function normalizarBicicletas(data: Record<string, unknown>) {
  const bicicletasInput = data.bicicletas ?? data.bicicleta;

  if (Array.isArray(bicicletasInput)) {
    return bicicletasInput as BicicletaInput[];
  }

  if (bicicletasInput && typeof bicicletasInput === "object") {
    return [bicicletasInput as BicicletaInput];
  }

  if (data.marca || data.modelo || data.color || data.descripcion || data.imagenUrl) {
    return [data as BicicletaInput];
  }

  return [];
}

function mapearBicicleta(bicicleta: BicicletaInput) {
  return {
    marca: String(bicicleta.marca).trim(),
    modelo: String(bicicleta.modelo).trim(),
    color: String(bicicleta.color).trim(),
    descripcion: bicicleta.descripcion
      ? String(bicicleta.descripcion).trim()
      : null,
    imagenUrl: bicicleta.imagenUrl
      ? String(bicicleta.imagenUrl).trim()
      : null,
  };
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const nombreCompletoClienteInput =
      data.nombre_completo_cliente ?? data.nombreCompletoCliente;
    const idUsuario = Number(data.id_usuario ?? data.idUsuario);
    const idClienteInput = data.id_cliente ?? data.idCliente;
    const idComprobanteInput = data.id_comprobante ?? data.idComprobante;
    const fechaEntregaEstimadaInput =
      data.fecha_entrega_estimada ?? data.fechaEntregaEstimada;
    const observacionesIngreso =
      data.observaciones_ingreso ?? data.observacionesIngreso ?? null;
    const estadoPago = data.estado_pago ?? data.estadoPago ?? "pendiente";
    const estadoOrden =
      data.estado_orden ?? data.estadoOrden ?? "Por realizar";
    const descuento = Number(data.descuento ?? 0);
    
    // Parse service labor cost and products list
    const montoServicio = Number(data.montoServicio ?? data.monto_servicio ?? 0);
    const productosInput = Array.isArray(data.productos) ? data.productos : [];
    
    const bicicletasInput = normalizarBicicletas(data);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      return NextResponse.json(
        { code: "FALTA_USUARIO", message: "Debe indicar un usuario válido" },
        { status: 400 }
      );
    }

    const usuario = await db.usuario.findUnique({
      where: {
        idUsuario,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        {
          code: "USUARIO_NO_EXISTE",
          message: "El usuario indicado no existe",
        },
        { status: 404 }
      );
    }

    let cliente = null;

    if (idClienteInput) {
      const idCliente = Number(idClienteInput);

      if (!Number.isInteger(idCliente) || idCliente <= 0) {
        return NextResponse.json(
          { code: "CLIENTE_INVALIDO", message: "El cliente no es válido" },
          { status: 400 }
        );
      }

      cliente = await db.cliente.findUnique({
        where: {
          idCliente,
        },
      });
    } else if (nombreCompletoClienteInput) {
      const clientes = await db.cliente.findMany();
      const nombreBuscado = normalizarTexto(String(nombreCompletoClienteInput));
      const coincidencias = clientes.filter(
        (clienteItem) =>
          normalizarTexto(nombreCompletoCliente(clienteItem)) === nombreBuscado
      );

      if (coincidencias.length > 1) {
        return NextResponse.json(
          {
            code: "CLIENTE_AMBIGUO",
            message:
              "Hay más de un cliente con ese nombre. Seleccione uno específico.",
            clientes: coincidencias,
          },
          { status: 409 }
        );
      }

      cliente = coincidencias[0] ?? null;
    }

    if (!cliente) {
      return NextResponse.json(
        {
          code: "CLIENTE_NO_EXISTE",
          message:
            "El cliente no está registrado. Debe registrarlo antes de crear la orden.",
        },
        { status: 404 }
      );
    }

    const fechaEntregaEstimada = fechaEntregaEstimadaInput
      ? new Date(fechaEntregaEstimadaInput)
      : new Date();

    if (Number.isNaN(fechaEntregaEstimada.getTime())) {
      return NextResponse.json(
        {
          code: "FECHA_INVALIDA",
          message: "La fecha de entrega estimada no es válida",
        },
        { status: 400 }
      );
    }

    const bicicletaIncompleta = bicicletasInput.find(
      (bicicleta) => !bicicleta.marca || !bicicleta.modelo || !bicicleta.color
    );

    if (bicicletaIncompleta) {
      return NextResponse.json(
        {
          code: "BICICLETA_INCOMPLETA",
          message: "Cada bicicleta debe tener marca, modelo y color",
        },
        { status: 400 }
      );
    }

    const bicicletas = bicicletasInput.map(mapearBicicleta);

    // 1. Fetch or create generic service "Servicio de Taller"
    let genericService = await db.servicio.findUnique({
      where: { nombre: "Servicio de Taller" }
    });

    if (!genericService) {
      genericService = await db.servicio.create({
        data: {
          nombre: "Servicio de Taller",
          descripcion: "Mano de obra y servicios técnicos generales",
          precioVenta: 0,
          estado: "activo"
        }
      });
    }

    // 2. Build lines array
    const lineasData = [];

    // Add service line if montoServicio > 0
    if (montoServicio > 0) {
      lineasData.push({
        idServicio: genericService.idServicio,
        idProducto: null,
        cantidad: 1,
        precioUnitario: montoServicio
      });
    }

    // Add product lines
    for (const p of productosInput) {
      const idProducto = Number(p.idProducto ?? p.id_producto);
      const cantidad = Number(p.cantidad ?? 1);
      const precioUnitario = Number(p.precioUnitario ?? p.precio_unitario ?? 0);

      if (idProducto > 0 && cantidad > 0) {
        lineasData.push({
          idServicio: null,
          idProducto,
          cantidad,
          precioUnitario
        });
      }
    }

    // Calculate grand total
    const calculatedTotal = lineasData.reduce((sum, line) => sum + (line.cantidad * line.precioUnitario), 0);

    const ordenTrabajo = await db.ordenDeTrabajo.create({
      data: {
        idUsuario: usuario.idUsuario,
        idCliente: cliente.idCliente,
        idComprobante: idComprobanteInput ? Number(idComprobanteInput) : null,
        fechaEntregaEstimada,
        fechaEntregaReal: null,
        observacionesIngreso,
        total: calculatedTotal,
        descuento,
        estadoPago,
        estadoOrden,
        bicicletas: bicicletas.length
          ? {
              create: bicicletas,
            }
          : undefined,
        lineasDeOrdenDeTrabajo: lineasData.length
          ? {
              create: lineasData
            }
          : undefined,
      },
      include: {
        usuario: true,
        cliente: true,
        bicicletas: true,
        lineasDeOrdenDeTrabajo: {
          include: {
            servicio: true,
            producto: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ordenTrabajo,
        cliente,
        bicicletas: ordenTrabajo.bicicletas,
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
    const ordenes = await db.ordenDeTrabajo.findMany({
      orderBy: {
        fechaCreacion: "desc",
      },
      include: {
        usuario: true,
        cliente: true,
        bicicletas: true,
        lineasDeOrdenDeTrabajo: {
          include: {
            servicio: true,
            producto: true,
          },
        },
      },
    });

    const ordenesConDetalle = ordenes.map((orden) => {
      const totalServicios = orden.lineasDeOrdenDeTrabajo.reduce(
        (total, linea) =>
          total + linea.cantidad * toNumber(linea.precioUnitario),
        0
      );

      return {
        ...orden,
        lineas: orden.lineasDeOrdenDeTrabajo,
        total_servicios: totalServicios,
      };
    });

    return NextResponse.json(ordenesConDetalle);
  } catch (error) {
    console.log("[ORDENES_TRABAJO_GET]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
