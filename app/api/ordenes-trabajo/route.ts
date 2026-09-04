// Endpoints generales para registrar y listar ordenes de trabajo.
import {
  MAX_BICYCLE_IMAGES,
  normalizarImagenesBicicleta,
} from "@/lib/bicycle-images";
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import { NextResponse } from "next/server";
import { z } from "zod"

const imagenBicicletaSchema = z.union([
  z.string(),
  z.object({
    url: z.string().optional().nullable(),
    urlImagen: z.string().optional().nullable(),
  }),
]);

const bicicletaSchema = z.object({
  marca: z.string().min(1),
  modelo: z.string().min(1),
  color: z.string().min(1),
  descripcion: z.string().optional().nullable(),
  imagenUrl: z.string().optional().nullable(),
  imagenes: z.array(imagenBicicletaSchema).optional(),
  imagenesUrl: z.array(z.string()).optional(),
  imagenesUrls: z.array(z.string()).optional(),
})

const productoSchema = z.object({
  idProducto: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precioUnitario: z.number().min(0),
})

const servicioSchema = z.object({
  idServicio: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precioUnitario: z.number().min(0).optional(),
})

const ordenTrabajoSchema = z.object({
  idUsuario: z.number().int().positive(),

  idCliente: z.number().int().positive().optional(),

  nombreCompletoCliente: z.string().optional(),

  fechaEntregaEstimada: z.string().optional(),

  observacionesIngreso: z.string().optional(),

  estadoPago: z.string().default("pendiente"),

  estadoOrden: z.string().default("Por realizar"),

  descuento: z.number().min(0).default(0),

  bicicletas: z.array(bicicletaSchema).default([]),

  productos: z.array(productoSchema).default([]),

  servicios: z.array(servicioSchema).default([]),

  idComprobante: z.number().int().positive().optional(),
})
.refine(
  (data) =>
    data.idCliente ||
    data.nombreCompletoCliente,
  {
    message:
      "Debe indicar un cliente mediante idCliente o nombreCompletoCliente",
  }
)

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
  imagenes?: unknown;
  imagenesUrl?: unknown;
  imagenesUrls?: unknown;
};

type ProductoOrdenInput = {
  id_producto?: unknown;
  idProducto?: unknown;
  cantidad?: unknown;
  precio_unitario?: unknown;
  precioUnitario?: unknown;
};

type ServicioOrdenInput = {
  id_servicio?: unknown;
  idServicio?: unknown;
  cantidad?: unknown;
  precio_unitario?: unknown;
  precioUnitario?: unknown;
};

type ProductoSolicitado = {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
};

type ServicioSolicitado = {
  idServicio: number;
  cantidad: number;
  precioUnitario: number;
};

type ProductoAgrupado = {
  idProducto: number;
  cantidad: number;
};

type LineaOrdenData = {
  idServicio: number | null;
  idProducto: number | null;
  cantidad: number;
  precioUnitario: number;
  descuentoUnitario: number;
  costoUnitario: number;
};

type BicicletaData = {
  tipo: string;
  marca: string;
  modelo: string;
  color: string;
  descripcionAdicional: string | null;
  imagenes: string[];
};

function calcularMontos(montoSubtotal: number, descuentoGlobal: number) {
  const montoTotal = Math.max(0, montoSubtotal - descuentoGlobal);
  const montoNeto = Math.round(montoTotal / 1.19);
  const montoIva = montoTotal - montoNeto;

  return {
    montoSubtotal,
    descuentoGlobal,
    montoTotal,
    montoNeto,
    montoIva,
  };
}

function normalizarBicicletas(data: Record<string, unknown>) {
  const bicicletasInput = data.bicicletas ?? data.bicicleta;

  if (Array.isArray(bicicletasInput)) {
    return bicicletasInput as BicicletaInput[];
  }

  if (bicicletasInput && typeof bicicletasInput === "object") {
    return [bicicletasInput as BicicletaInput];
  }

  if (
    data.marca ||
    data.modelo ||
    data.color ||
    data.descripcion ||
    data.imagenUrl ||
    data.imagenes ||
    data.imagenesUrl ||
    data.imagenesUrls
  ) {
    return [data as BicicletaInput];
  }

  return [];
}

function mapearBicicleta(bicicleta: BicicletaInput): BicicletaData {
  return {
    tipo: "bicicleta",
    marca: String(bicicleta.marca).trim(),
    modelo: String(bicicleta.modelo).trim(),
    color: String(bicicleta.color).trim(),
    descripcionAdicional: bicicleta.descripcion
      ? String(bicicleta.descripcion).trim()
      : null,
    imagenes: normalizarImagenesBicicleta(bicicleta),
  };
}

function parsePositiveInteger(value: unknown) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN;
  }

  return parsedValue;
}

const etapasOrdenTrabajo = [
  "Por realizar",
  "En curso",
  "En espera",
  "Listo para entregar",
  "Entregado",
  "Anulada",
];

function normalizarTextoFiltro(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function obtenerEtapaFiltro(req: Request) {
  const { searchParams } = new URL(req.url);
  const etapaInput =
    searchParams.get("etapa") ??
    searchParams.get("estadoOrden") ??
    searchParams.get("estado_orden") ??
    searchParams.get("estado");

  if (!etapaInput) {
    return {
      fueSolicitada: false,
      etapa: null,
    };
  }

  const etapaNormalizada = normalizarTextoFiltro(etapaInput);

  return {
    fueSolicitada: true,
    etapa:
      etapasOrdenTrabajo.find(
        (etapa) => normalizarTextoFiltro(etapa) === etapaNormalizada
      ) ?? null,
  };
}

function obtenerParametroFecha(searchParams: URLSearchParams, keys: string[]) {
  for (const key of keys) {
    if (searchParams.has(key)) {
      return searchParams.get(key);
    }
  }

  return null;
}

function parseFechaFiltro(value: string | null) {
  if (!value?.trim()) {
    return null;
  }

  const fechaInput = value.trim();
  const [, datePart] = fechaInput.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/) ?? [];

  if (!datePart) {
    return null;
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const fecha = new Date(Date.UTC(year, month - 1, day));

  if (
    fecha.getUTCFullYear() !== year ||
    fecha.getUTCMonth() !== month - 1 ||
    fecha.getUTCDate() !== day
  ) {
    return null;
  }

  return fecha;
}

function obtenerPeriodoFiltro(req: Request) {
  const { searchParams } = new URL(req.url);
  const fechaInicioInput = obtenerParametroFecha(searchParams, [
    "fechaInicio",
    "fecha_inicio",
    "fechaDesde",
    "fecha_desde",
    "desde",
    "inicio",
  ]);
  const fechaFinInput = obtenerParametroFecha(searchParams, [
    "fechaFin",
    "fecha_fin",
    "fechaHasta",
    "fecha_hasta",
    "hasta",
    "fin",
  ]);
  const fueSolicitado = fechaInicioInput !== null || fechaFinInput !== null;

  if (!fueSolicitado) {
    return {
      fueSolicitado,
      error: null,
      inicio: null,
      finExclusivo: null,
    };
  }

  if (!fechaInicioInput?.trim() || !fechaFinInput?.trim()) {
    return {
      fueSolicitado,
      error: {
        code: "FECHAS_INCOMPLETAS",
        message: "Debe completar fecha de inicio y fecha de fin",
      },
      inicio: null,
      finExclusivo: null,
    };
  }

  const inicio = parseFechaFiltro(fechaInicioInput);
  const fin = parseFechaFiltro(fechaFinInput);

  if (!inicio || !fin || inicio > fin) {
    return {
      fueSolicitado,
      error: {
        code: "RANGO_FECHAS_INVALIDO",
        message: "El rango de fechas no es valido. Corrija las fechas ingresadas",
      },
      inicio: null,
      finExclusivo: null,
    };
  }

  const finExclusivo = new Date(fin);
  finExclusivo.setUTCDate(finExclusivo.getUTCDate() + 1);

  return {
    fueSolicitado,
    error: null,
    inicio,
    finExclusivo,
  };
}

export async function POST(req: Request) {
  try {
    const { session, response } = await requirePermission(PERMISSIONS.WORK_ORDERS_CREATE)

    if (response || !session) {
      return response || new NextResponse("No autorizado", { status: 401 })
    }

    const rawData = await req.json();

    const dataNormalizada = {
      idUsuario: session.user.idUsuario,

      idCliente:
        rawData.id_cliente ??
        rawData.idCliente,

      nombreCompletoCliente:
        rawData.nombre_completo_cliente ??
        rawData.nombreCompletoCliente,

      idComprobante:
        rawData.id_comprobante ??
        rawData.idComprobante,

      fechaEntregaEstimada:
        rawData.fecha_entrega_estimada ??
        rawData.fechaEntregaEstimada,

      observacionesIngreso:
        rawData.observaciones_ingreso ??
        rawData.observacionesIngreso,

      estadoPago:
        rawData.estado_pago ??
        rawData.estadoPago ??
        "pendiente",

      estadoOrden:
        rawData.estado_orden ??
        rawData.estadoOrden ??
        "Por realizar",

      descuento: Number(
        rawData.descuento ?? 0
      ),

      bicicletas:
        normalizarBicicletas(rawData),

      productos: Array.isArray(rawData.productos)
        ? rawData.productos.map(
            (item: ProductoOrdenInput) => ({
              idProducto: Number(
                item.id_producto ??
                item.idProducto
              ),
              cantidad: Number(item.cantidad),
              precioUnitario: Number(
                item.precio_unitario ??
                item.precioUnitario ??
                0
              ),
            })
          )
        : [],

      servicios: Array.isArray(rawData.servicios)
        ? rawData.servicios.map(
            (item: ServicioOrdenInput) => ({
              idServicio: Number(
                item.id_servicio ?? item.idServicio
              ),
              cantidad: Number(item.cantidad),
              precioUnitario: Number(
                item.precio_unitario ?? item.precioUnitario ?? 0
              ),
            })
          )
        : [],
    };

    const validation =
      ordenTrabajoSchema.safeParse(
        dataNormalizada
      );

    if (!validation.success) {
      console.log(validation.error.flatten());

      return new NextResponse(
        validation.error.issues[0]?.message ??
          "Error de validación",
        {
          status: 400,
        }
      );
    }

    const data = validation.data;

    const nombreCompletoClienteInput =
      data.nombreCompletoCliente;

    const idUsuario =
      data.idUsuario;

    const idClienteInput =
      data.idCliente;

    const fechaEntregaEstimadaInput =
      data.fechaEntregaEstimada;

    const observacionesIngreso =
      data.observacionesIngreso ?? null;

    const estadoPago =
      data.estadoPago;

    const estadoOrden =
      data.estadoOrden;

    const descuento =
      data.descuento;

    const bicicletasInput =
      data.bicicletas;

    const productosInput =
      data.productos;

    const serviciosInput =
      data.servicios;

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

    const bicicletas = bicicletasInput.map(mapearBicicleta);
    const bicicletaConDemasiadasImagenes = bicicletas.find(
      (bicicleta) => bicicleta.imagenes.length > MAX_BICYCLE_IMAGES
    );

    if (bicicletaConDemasiadasImagenes) {
      return NextResponse.json(
        {
          code: "MAX_IMAGENES_BICICLETA",
          message: `Solo se pueden asociar hasta ${MAX_BICYCLE_IMAGES} imagenes por bicicleta`,
        },
        { status: 400 }
      );
    }

    const productosSolicitados: ProductoSolicitado[] = productosInput.map(
      (item: ProductoOrdenInput) => ({
        idProducto: parsePositiveInteger(item.id_producto ?? item.idProducto),
        cantidad: parsePositiveInteger(item.cantidad),
        precioUnitario: Number(item.precio_unitario ?? item.precioUnitario ?? 0),
      })
    );

    const serviciosSolicitados: ServicioSolicitado[] = serviciosInput.map(
      (item: ServicioOrdenInput) => ({
        idServicio: parsePositiveInteger(item.id_servicio ?? item.idServicio),
        cantidad: parsePositiveInteger(item.cantidad),
        precioUnitario: Number(item.precio_unitario ?? item.precioUnitario ?? 0),
      })
    );

    const productosAgrupados: ProductoAgrupado[] = Array.from(
      productosSolicitados.reduce((productosMap, item) => {
        productosMap.set(
          item.idProducto,
          (productosMap.get(item.idProducto) ?? 0) + item.cantidad
        );

        return productosMap;
      }, new Map<number, number>())
    ).map(([idProducto, cantidad]) => ({
      idProducto,
      cantidad,
    }));

    const productos = productosAgrupados.length
      ? await db.producto.findMany({
          where: {
            idProducto: {
              in: productosAgrupados.map((item) => item.idProducto),
            },
          },
        })
      : [];

    const productosPorId = new Map(
      productos.map((producto) => [producto.idProducto, producto])
    );

    const productoNoExiste = productosAgrupados.find(
      (item) => !productosPorId.has(item.idProducto)
    );

    if (productoNoExiste) {
      return NextResponse.json(
        {
          code: "PRODUCTO_NO_EXISTE",
          message: `El producto con ID ${productoNoExiste.idProducto} no existe`,
          id_producto: productoNoExiste.idProducto,
          idProducto: productoNoExiste.idProducto,
        },
        { status: 404 }
      );
    }

    const productoSinStock = productosAgrupados.find((item) => {
      const producto = productosPorId.get(item.idProducto);

      return producto && producto.stockActual < item.cantidad;
    });

    if (productoSinStock) {
      const producto = productosPorId.get(productoSinStock.idProducto)!;

      return NextResponse.json(
        {
          code: "STOCK_INSUFICIENTE",
          message: `No hay stock suficiente para ${producto.nombre}`,
          producto: {
            id_producto: producto.idProducto,
            idProducto: producto.idProducto,
            nombre: producto.nombre,
            stock_actual: producto.stockActual,
            stockActual: producto.stockActual,
          },
          cantidad_requerida: productoSinStock.cantidad,
          cantidad_disponible: producto.stockActual,
        },
        { status: 409 }
      );
    }

    const servicios = serviciosSolicitados.length
      ? await db.servicio.findMany({
          where: {
            idServicio: {
              in: serviciosSolicitados.map((item) => item.idServicio),
            },
          },
        })
      : [];

    const serviciosPorId = new Map(
      servicios.map((servicio) => [servicio.idServicio, servicio])
    );

    const servicioNoExiste = serviciosSolicitados.find(
      (item) => !serviciosPorId.has(item.idServicio)
    );

    if (servicioNoExiste) {
      return NextResponse.json(
        {
          code: "SERVICIO_NO_EXISTE",
          message: `El servicio con ID ${servicioNoExiste.idServicio} no existe`,
        },
        { status: 404 }
      );
    }

    const servicioInactivo = serviciosSolicitados.find((item) => {
      const servicio = serviciosPorId.get(item.idServicio);

      return servicio && servicio.estado !== "activo";
    });

    if (servicioInactivo) {
      const servicio = serviciosPorId.get(servicioInactivo.idServicio)!;

      return NextResponse.json(
        {
          code: "SERVICIO_INACTIVO",
          message: `El servicio ${servicio.nombre} no esta activo`,
        },
        { status: 409 }
      );
    }

    const lineasData: LineaOrdenData[] = [];

    for (const servicioSolicitado of serviciosSolicitados) {
      const servicio = serviciosPorId.get(servicioSolicitado.idServicio)!;

      lineasData.push({
        idServicio: servicio.idServicio,
        idProducto: null,
        cantidad: servicioSolicitado.cantidad,
        precioUnitario: servicioSolicitado.precioUnitario,
        descuentoUnitario: 0,
        costoUnitario: 0,
      });
    }

    for (const productoSolicitado of productosSolicitados) {
      lineasData.push({
        idServicio: null,
        idProducto: productoSolicitado.idProducto,
        cantidad: productoSolicitado.cantidad,
        precioUnitario: productoSolicitado.precioUnitario,
        descuentoUnitario: 0,
        costoUnitario: toNumber(
          productosPorId.get(productoSolicitado.idProducto)?.costoPromedio
        ),
      });
    }

    // Calculate grand total
    const calculatedTotal = lineasData.reduce((sum, line) => sum + (line.cantidad * line.precioUnitario), 0);
    const montos = calcularMontos(calculatedTotal, descuento);

    const ordenTrabajo = await db.$transaction(async (tx) => {
      const ventaCreada = await tx.venta.create({
        data: {
          idUsuario: usuario.idUsuario,
          idCliente: cliente.idCliente,
          ordenDeTrabajo: {
            create: {
              idMecanicoAsignado: null,
              fechaEntregaEstimada,
              fechaEntregaReal: null,
              observacionesIngreso,
              montoSubtotal: montos.montoSubtotal,
              descuentoProductosServicios: 0,
              descuentoGlobal: montos.descuentoGlobal,
              montoTotal: montos.montoTotal,
              montoNeto: montos.montoNeto,
              montoIva: montos.montoIva,
              estadoPago,
              estado: estadoOrden,
              bicicletas: bicicletas.length
                ? {
                    create: bicicletas.map((bicicleta) => ({
                      tipo: bicicleta.tipo,
                      marca: bicicleta.marca,
                      modelo: bicicleta.modelo,
                      color: bicicleta.color,
                      descripcionAdicional: bicicleta.descripcionAdicional,
                      imagenes: bicicleta.imagenes.length
                        ? {
                            create: bicicleta.imagenes.map((urlImagen) => ({
                              urlImagen,
                            })),
                          }
                        : undefined,
                    })),
                  }
                : undefined,
              lineasDeOrdenDeTrabajo: lineasData.length
                ? {
                    create: lineasData,
                  }
                : undefined,
            },
          },
        },
        include: {
          usuario: true,
          cliente: true,
          ordenDeTrabajo: {
            include: {
              bicicletas: {
                include: {
                  imagenes: true,
                },
              },
              lineasDeOrdenDeTrabajo: {
                include: {
                  servicio: true,
                  producto: true,
                },
              },
            },
          },
        },
      });

      for (const item of productosAgrupados) {
        const producto = productosPorId.get(item.idProducto)!;

        await tx.producto.update({
          where: {
            idProducto: item.idProducto,
          },
          data: {
            stockActual: producto.stockActual - item.cantidad,
          },
        });
      }

      return {
        ...ventaCreada.ordenDeTrabajo!,
        venta: ventaCreada,
        usuario: ventaCreada.usuario,
        cliente: ventaCreada.cliente,
      };
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

export async function GET(req: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.WORK_ORDERS_READ)

    if (response) {
      return response
    }

    const etapaFiltro = obtenerEtapaFiltro(req);
    const periodoFiltro = obtenerPeriodoFiltro(req);

    if (etapaFiltro.fueSolicitada && !etapaFiltro.etapa) {
      return NextResponse.json(
        {
          code: "ETAPA_INVALIDA",
          message: "La etapa seleccionada no es valida",
          etapasDisponibles: etapasOrdenTrabajo,
        },
        { status: 400 }
      );
    }

    if (periodoFiltro.error) {
      return NextResponse.json(periodoFiltro.error, { status: 400 });
    }

    const filtrosOrden = [];

    if (etapaFiltro.etapa) {
      filtrosOrden.push({
        estado: etapaFiltro.etapa,
      });
    }

    if (periodoFiltro.inicio && periodoFiltro.finExclusivo) {
      filtrosOrden.push({
        venta: {
          fechaRegistro: {
            gte: periodoFiltro.inicio,
            lt: periodoFiltro.finExclusivo,
          },
        },
      });
    }

    const ordenes = await db.ordenDeTrabajo.findMany({
      where: filtrosOrden.length
        ? {
            AND: filtrosOrden,
          }
        : undefined,
      orderBy: {
        venta: {
          fechaRegistro: "desc",
        },
      },
      include: {
        venta: {
          include: {
            usuario: true,
            cliente: true,
            ventaEnMostrador: {
              include: {
                asignacionesPago: {
                  include: {
                    pago: true,
                  },
                },
              },
            },
          },
        },
        mecanico: true,
        bicicletas: {
          include: {
            imagenes: true,
          },
        },
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
        (total: number, linea) =>
          total + linea.cantidad * toNumber(linea.precioUnitario),
        0
      );

      const asignaciones = (orden.venta as any)?.ventaEnMostrador?.asignacionesPago ?? [];
      const totalPagado = asignaciones.reduce(
        (sum: number, a: any) => sum + toNumber(a.montoAsociado),
        0
      );

      return {
        ...orden,
        fechaCreacion: orden.venta.fechaRegistro,
        fechaRecepcion: orden.venta.fechaRegistro,
        usuario: orden.venta.usuario,
        cliente: orden.venta.cliente,
        total: orden.montoTotal,
        descuento: orden.descuentoGlobal,
        estadoOrden: orden.estado,
        lineas: orden.lineasDeOrdenDeTrabajo,
        total_servicios: totalServicios,
        totalPagado,
        pagos: asignaciones.map((a: any) => ({
          idPago: a.pago?.idPago,
          fechaRegistro: a.pago?.fechaRegistro,
          estado: a.pago?.estado,
          metodoPago: a.pago?.metodoPago,
          monto: a.pago?.monto,
          tipoAbono: a.tipoAbono,
        })),
      };
    });

    if (etapaFiltro.etapa && ordenesConDetalle.length === 0) {
      if (periodoFiltro.fueSolicitado) {
        return NextResponse.json(
          {
            code: "SIN_ORDENES_EN_PERIODO",
            message: "No hay ordenes de trabajo dentro del rango ingresado",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          code: "SIN_TRABAJOS_EN_ETAPA",
          message: "No se encontraron trabajos en esa etapa",
          etapa: etapaFiltro.etapa,
        },
        { status: 404 }
      );
    }

    if (periodoFiltro.fueSolicitado && ordenesConDetalle.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_ORDENES_EN_PERIODO",
          message: "No hay ordenes de trabajo dentro del rango ingresado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(ordenesConDetalle);
  } catch (error) {
    console.log("[ORDENES_TRABAJO_GET]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
