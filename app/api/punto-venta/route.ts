// Capa referencial del nuevo punto de venta.
// Mientras no exista una tabla punto_venta, registra ventas y ordenes en sus
// tablas actuales y responde con una forma unificada para el front.
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/lib/permissions";
import { requirePermission } from "@/lib/require-permission";
import { NextResponse } from "next/server";

const prisma = db;

type ProductoInput = {
  id_producto?: unknown;
  idProducto?: unknown;
  cantidad?: unknown;
  precio_unitario?: unknown;
  precioUnitario?: unknown;
  descuento_unitario?: unknown;
  descuentoUnitario?: unknown;
  costo_unitario?: unknown;
  costoUnitario?: unknown;
};

type ServicioInput = {
  id_servicio?: unknown;
  idServicio?: unknown;
  cantidad?: unknown;
  precio_unitario?: unknown;
  precioUnitario?: unknown;
  descuento_unitario?: unknown;
  descuentoUnitario?: unknown;
  costo_unitario?: unknown;
  costoUnitario?: unknown;
};

type BicicletaInput = {
  tipo?: unknown;
  marca?: unknown;
  modelo?: unknown;
  color?: unknown;
  descripcion?: unknown;
  imagenUrl?: unknown;
};

function parsePositiveInteger(value: unknown) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN;
  }

  return parsedValue;
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function normalizarProductos(input: unknown): ProductoInput[] {
  return Array.isArray(input) ? input : [];
}

function normalizarServicios(input: unknown): ServicioInput[] {
  return Array.isArray(input) ? input : [];
}

function normalizarBicicletas(input: unknown): BicicletaInput[] {
  return Array.isArray(input) ? input : [];
}

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

function sanitizarUsuario(usuario: any) {
  if (!usuario) {
    return usuario;
  }

  const {
    contrasena,
    contrasenaHash,
    contrasena_hash,
    password,
    ...usuarioSeguro
  } = usuario;

  return usuarioSeguro;
}

function sanitizarActores<T extends { usuario?: any; mecanico?: any }>(data: T) {
  return {
    ...data,
    usuario: sanitizarUsuario(data.usuario),
    mecanico: sanitizarUsuario(data.mecanico),
  };
}

function adaptarVenta(venta: any) {
  if (!venta) {
    return null;
  }

  const ventaSegura = sanitizarActores(venta);
  const ventaEnMostrador = ventaSegura.ventaEnMostrador ?? {};

  return {
    ...ventaSegura,
    ...ventaEnMostrador,
    idVenta: ventaSegura.idVenta,
    idUsuario: ventaSegura.idUsuario,
    idCliente: ventaSegura.idCliente,
    fechaCreacion: ventaSegura.fechaRegistro,
    total: ventaEnMostrador.montoTotal,
    descuento: ventaEnMostrador.descuentoGlobal,
    montoTotal: ventaEnMostrador.montoTotal,
    descuentoGlobal: ventaEnMostrador.descuentoGlobal,
    estadoVenta: ventaEnMostrador.estado,
    estadoPago: ventaEnMostrador.estadoPago,
    fechaRegistro: ventaSegura.fechaRegistro,
  };
}

function adaptarOrdenTrabajo(ordenTrabajo: any) {
  if (!ordenTrabajo) {
    return null;
  }

  const ordenTrabajoSegura = sanitizarActores(ordenTrabajo);
  
  const asignaciones = ordenTrabajoSegura.venta?.ventaEnMostrador?.asignacionesPago ?? [];
  const totalPagado = asignaciones.reduce(
    (sum: number, a: any) => sum + Number(a.montoAsociado ?? 0),
    0
  );

  return {
    ...ordenTrabajoSegura,
    total: ordenTrabajoSegura.montoTotal,
    descuento: ordenTrabajoSegura.descuentoGlobal,
    estadoOrden: ordenTrabajoSegura.estado,
    fechaCreacion: ordenTrabajoSegura.venta?.fechaRegistro,
    fechaRecepcion: ordenTrabajoSegura.venta?.fechaRegistro,
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
}

function mapearProducto(item: ProductoInput) {
  return {
    idProducto: parsePositiveInteger(item.id_producto ?? item.idProducto),
    cantidad: parsePositiveInteger(item.cantidad),
    precioUnitario: Number(item.precio_unitario ?? item.precioUnitario ?? 0),
    descuentoUnitario: Number(
      item.descuento_unitario ?? item.descuentoUnitario ?? 0
    ),
    costoUnitario: Number(item.costo_unitario ?? item.costoUnitario ?? 0),
  };
}

function mapearServicio(item: ServicioInput) {
  return {
    idServicio: parsePositiveInteger(item.id_servicio ?? item.idServicio),
    cantidad: parsePositiveInteger(item.cantidad),
    precioUnitario: Number(item.precio_unitario ?? item.precioUnitario ?? 0),
    descuentoUnitario: Number(
      item.descuento_unitario ?? item.descuentoUnitario ?? 0
    ),
    costoUnitario: Number(item.costo_unitario ?? item.costoUnitario ?? 0),
  };
}

function mapearBicicleta(item: BicicletaInput) {
  return {
    tipo: String(item.tipo ?? "bicicleta").trim(),
    marca: String(item.marca ?? "").trim(),
    modelo: String(item.modelo ?? "").trim(),
    color: String(item.color ?? "").trim(),
    descripcionAdicional: item.descripcion ? String(item.descripcion).trim() : null,
  };
}

function agruparProductos(productos: ReturnType<typeof mapearProducto>[]) {
  return Array.from(
    productos.reduce((productosMap, item) => {
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
}

function calcularTipoOperacion(tieneVenta: boolean, tieneOrden: boolean) {
  if (tieneVenta && tieneOrden) {
    return "mixta";
  }

  if (tieneOrden) {
    return "orden_trabajo";
  }

  return "venta";
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

function obtenerMetodoPago(rawData: any) {
  return rawData.pago?.metodo_pago ??
    rawData.pago?.metodoPago ??
    rawData.metodo_pago ??
    rawData.metodoPago ??
    null;
}

function obtenerMontoPago(rawData: any, montoPorDefecto: number) {
  const monto =
    rawData.pago?.monto_pagado ??
    rawData.pago?.montoPagado ??
    rawData.pago?.monto ??
    rawData.monto_pagado ??
    rawData.montoPagado ??
    null;

  return monto === null || monto === undefined ? montoPorDefecto : Number(monto);
}

function obtenerEstadoPago(rawData: any, estadoPorDefecto: string) {
  return rawData.pago?.estado ?? rawData.estado_pago_detalle ?? estadoPorDefecto;
}

export async function POST(req: Request) {
  try {
    const { session, response } = await requirePermission(PERMISSIONS.SALES_CREATE)

    if (response || !session) {
      return response || new NextResponse("No autorizado", { status: 401 })
    }

    const rawData = await req.json();
    const idUsuario = session.user.idUsuario;
    const rawIdCliente = rawData.id_cliente ?? rawData.idCliente;
    const idCliente = rawIdCliente !== null && rawIdCliente !== undefined && rawIdCliente !== ""
      ? parsePositiveInteger(rawIdCliente)
      : null;

    const descuento = Number(rawData.descuento ?? rawData.descuentoGlobal ?? 0);
    const estadoPago = rawData.estado_pago ?? rawData.estadoPago ?? "pendiente";
    const productosVenta = normalizarProductos(rawData.productos).map(mapearProducto);
    const ordenInput = rawData.orden_trabajo ?? rawData.ordenTrabajo ?? null;
    const tieneOrden = Boolean(ordenInput);
    const montoServicioOrden = tieneOrden
      ? Number(ordenInput.monto_servicio ?? ordenInput.montoServicio ?? 0)
      : 0;
    const productosOrden = tieneOrden
      ? normalizarProductos(ordenInput.productos).map(mapearProducto)
      : [];
    const serviciosOrden = tieneOrden
      ? normalizarServicios(ordenInput.servicios).map(mapearServicio)
      : [];
    const bicicletas = tieneOrden
      ? normalizarBicicletas(ordenInput.bicicletas).map(mapearBicicleta)
      : [];

    if (Number.isNaN(idUsuario) || (idCliente !== null && Number.isNaN(idCliente))) {
      return NextResponse.json(
        {
          code: "FALTAN_DATOS",
          message: "Debe indicar usuario y cliente validos",
        },
        { status: 400 }
      );
    }

    const productosInvalidos = [...productosVenta, ...productosOrden].find(
      (item) =>
        Number.isNaN(item.idProducto) ||
        Number.isNaN(item.cantidad) ||
        Number.isNaN(item.precioUnitario)
    );

    if (productosInvalidos) {
      return NextResponse.json(
        {
          code: "PRODUCTO_INVALIDO",
          message: "Todos los productos deben tener ID, cantidad y precio validos",
        },
        { status: 400 }
      );
    }

    const serviciosInvalidos = serviciosOrden.find(
      (item) =>
        Number.isNaN(item.idServicio) ||
        Number.isNaN(item.cantidad) ||
        Number.isNaN(item.precioUnitario)
    );

    if (serviciosInvalidos) {
      return NextResponse.json(
        {
          code: "SERVICIO_INVALIDO",
          message: "Todos los servicios deben tener ID, cantidad y precio validos",
        },
        { status: 400 }
      );
    }

    if (Number.isNaN(montoServicioOrden) || montoServicioOrden < 0) {
      return NextResponse.json(
        {
          code: "MONTO_SERVICIO_INVALIDO",
          message: "El monto del servicio debe ser un numero valido",
        },
        { status: 400 }
      );
    }

    const bicicletasInvalidas = bicicletas.find(
      (item) => !item.marca || !item.modelo || !item.color
    );

    if (bicicletasInvalidas) {
      return NextResponse.json(
        {
          code: "BICICLETA_INVALIDA",
          message: "Cada bicicleta debe tener marca, modelo y color",
        },
        { status: 400 }
      );
    }

    if (!productosVenta.length && !tieneOrden) {
      return NextResponse.json(
        {
          code: "PUNTO_VENTA_SIN_LINEAS",
          message: "Debe ingresar productos o una orden de trabajo",
        },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({
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

    if (idCliente !== null) {
      const cliente = await prisma.cliente.findUnique({
        where: {
          idCliente,
        },
      });

      if (!cliente) {
        return NextResponse.json(
          {
            code: "CLIENTE_NO_EXISTE",
            message: "El cliente no esta registrado",
          },
          { status: 404 }
        );
      }
    }

    const productosAgrupados = agruparProductos([...productosVenta, ...productosOrden]);
    const productos: any[] = productosAgrupados.length
      ? await prisma.producto.findMany({
          where: {
            idProducto: {
              in: productosAgrupados.map((item) => item.idProducto),
            },
          },
        })
      : [];
    const productosPorId = new Map<number, any>(
      productos.map((producto: any) => [producto.idProducto, producto])
    );
    const productoNoExiste = productosAgrupados.find(
      (item) => !productosPorId.has(item.idProducto)
    );

    if (productoNoExiste) {
      return NextResponse.json(
        {
          code: "PRODUCTO_NO_EXISTE",
          message: `El producto con ID ${productoNoExiste.idProducto} no existe`,
          idProducto: productoNoExiste.idProducto,
          id_producto: productoNoExiste.idProducto,
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
            idProducto: producto.idProducto,
            id_producto: producto.idProducto,
            nombre: producto.nombre,
            stockActual: producto.stockActual,
            stock_actual: producto.stockActual,
          },
          cantidadRequerida: productoSinStock.cantidad,
          cantidadDisponible: producto.stockActual,
        },
        { status: 409 }
      );
    }

    const servicios: any[] = serviciosOrden.length
      ? await prisma.servicio.findMany({
          where: {
            idServicio: {
              in: serviciosOrden.map((item) => item.idServicio),
            },
          },
        })
      : [];
    const serviciosPorId = new Map<number, any>(
      servicios.map((servicio: any) => [servicio.idServicio, servicio])
    );
    const servicioNoExiste = serviciosOrden.find(
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

    let servicioGenerico = null;

    if (montoServicioOrden > 0) {
      servicioGenerico = await prisma.servicio.findUnique({
        where: {
          nombre: "Servicio de Taller",
        },
      });

      if (!servicioGenerico) {
        servicioGenerico = await prisma.servicio.create({
          data: {
            nombre: "Servicio de Taller",
            descripcion: "Mano de obra y servicios tecnicos generales",
            precioVenta: 0,
            estado: "activo",
          },
        });
      }
    }

    const lineasVenta = productosVenta.map((item) => {
      const producto = productosPorId.get(item.idProducto)!;
      const precioUnitario = item.precioUnitario || toNumber(producto.precioVenta);

      return {
        idProducto: producto.idProducto,
        cantidad: item.cantidad,
        precioUnitario,
        descuentoUnitario: item.descuentoUnitario,
        costoUnitario: item.costoUnitario,
      };
    });
    const lineasOrdenProductos = productosOrden.map((item) => {
      const producto = productosPorId.get(item.idProducto)!;
      const precioUnitario = item.precioUnitario || toNumber(producto.precioVenta);

      return {
        idProducto: producto.idProducto,
        idServicio: null,
        cantidad: item.cantidad,
        precioUnitario,
        descuentoUnitario: item.descuentoUnitario,
        costoUnitario: item.costoUnitario,
      };
    });
    const lineasOrdenServicios = [
      ...serviciosOrden.map((item) => {
        const servicio = serviciosPorId.get(item.idServicio)!;
        const precioUnitario = item.precioUnitario || toNumber(servicio.precioVenta);

        return {
          idProducto: null,
          idServicio: servicio.idServicio,
          cantidad: item.cantidad,
          precioUnitario,
          descuentoUnitario: item.descuentoUnitario,
          costoUnitario: item.costoUnitario,
        };
      }),
      ...(servicioGenerico
        ? [
            {
              idProducto: null,
              idServicio: servicioGenerico.idServicio,
              cantidad: 1,
              precioUnitario: montoServicioOrden,
              descuentoUnitario: 0,
              costoUnitario: 0,
            },
          ]
        : []),
    ];
    const totalVenta = lineasVenta.reduce(
      (total, linea) =>
        total + linea.cantidad * (linea.precioUnitario - linea.descuentoUnitario),
      0
    );
    const totalOrden = [...lineasOrdenProductos, ...lineasOrdenServicios].reduce(
      (total, linea) =>
        total + linea.cantidad * (linea.precioUnitario - linea.descuentoUnitario),
      0
    );
    const totalBruto = totalVenta + totalOrden;
    const ventaDescuentoGlobal = tieneOrden ? 0 : descuento;
    const ordenDescuentoGlobal = tieneOrden ? descuento : 0;
    const montosVenta = calcularMontos(totalVenta, ventaDescuentoGlobal);
    const montosOrden = calcularMontos(totalOrden, ordenDescuentoGlobal);
    const montosOperacion = calcularMontos(totalBruto, descuento);
    const metodoPago = obtenerMetodoPago(rawData);
    const montoPago = obtenerMontoPago(rawData, montosOperacion.montoTotal);
    const estadoRegistroPago = obtenerEstadoPago(rawData, estadoPago);

    if (metodoPago && (Number.isNaN(montoPago) || montoPago <= 0)) {
      return NextResponse.json(
        {
          code: "MONTO_PAGO_INVALIDO",
          message: "El monto pagado debe ser un numero mayor a cero",
        },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(async (tx: any) => {
      const ventaBase = await tx.venta.create({
        data: {
          idUsuario,
          idCliente,
          ventaEnMostrador: (lineasVenta.length > 0 || tieneOrden)
            ? {
                create: {
                  estado:
                    rawData.estado_venta ?? rawData.estadoVenta ?? "confirmada",
                  estadoPago,
                  montoSubtotal: montosVenta.montoSubtotal,
                  descuentoProductos: 0,
                  descuentoGlobal: montosVenta.descuentoGlobal,
                  montoTotal: montosVenta.montoTotal,
                  montoNeto: montosVenta.montoNeto,
                  montoIva: montosVenta.montoIva,
                  lineasDeVenta: {
                    create: lineasVenta.map((linea) => ({
                      idProducto: linea.idProducto,
                      cantidad: linea.cantidad,
                      precioUnitario: linea.precioUnitario,
                      descuentoUnitario: linea.descuentoUnitario,
                      costoUnitario: linea.costoUnitario,
                    })),
                  },
                },
              }
            : undefined,
          ordenDeTrabajo: tieneOrden
            ? {
                create: {
                  idMecanicoAsignado:
                    ordenInput.id_mecanico_asignado ??
                    ordenInput.idMecanicoAsignado
                      ? Number(
                          ordenInput.id_mecanico_asignado ??
                            ordenInput.idMecanicoAsignado
                        )
                      : null,
                  estado:
                    ordenInput.estado_orden ??
                    ordenInput.estadoOrden ??
                    "Por realizar",
                  estadoPago,
                  fechaEntregaEstimada: ordenInput.fecha_entrega_estimada
                    ? new Date(ordenInput.fecha_entrega_estimada)
                    : ordenInput.fechaEntregaEstimada
                      ? new Date(ordenInput.fechaEntregaEstimada)
                      : new Date(),
                  fechaEntregaReal: null,
                  observacionesIngreso:
                    ordenInput.observaciones_ingreso ??
                    ordenInput.observacionesIngreso ??
                    null,
                  montoSubtotal: montosOrden.montoSubtotal,
                  descuentoProductosServicios: 0,
                  descuentoGlobal: montosOrden.descuentoGlobal,
                  montoTotal: montosOrden.montoTotal,
                  montoNeto: montosOrden.montoNeto,
                  montoIva: montosOrden.montoIva,
                  bicicletas: bicicletas.length
                    ? {
                        create: bicicletas,
                      }
                    : undefined,
                  lineasDeOrdenDeTrabajo:
                    lineasOrdenProductos.length || lineasOrdenServicios.length
                      ? {
                          create: [
                            ...lineasOrdenProductos,
                            ...lineasOrdenServicios,
                          ].map((linea) => ({
                            idProducto: linea.idProducto,
                            idServicio: linea.idServicio,
                            cantidad: linea.cantidad,
                            precioUnitario: linea.precioUnitario,
                            descuentoUnitario: linea.descuentoUnitario,
                            costoUnitario: linea.costoUnitario,
                          })),
                        }
                      : undefined,
                },
              }
            : undefined,
        },
        include: {
          usuario: true,
          cliente: true,
          ventaEnMostrador: {
            include: {
              lineasDeVenta: {
                include: {
                  producto: true,
                },
              },
            },
          },
          ordenDeTrabajo: {
            include: {
              mecanico: true,
              bicicletas: true,
              lineasDeOrdenDeTrabajo: {
                include: {
                  producto: true,
                  servicio: true,
                },
              },
            },
          },
        },
      });

      const venta = ventaBase.ventaEnMostrador ? ventaBase : null;
      const ordenTrabajo = ventaBase.ordenDeTrabajo
        ? {
            ...ventaBase.ordenDeTrabajo,
            venta: ventaBase,
            usuario: ventaBase.usuario,
            cliente: ventaBase.cliente,
          }
        : null;

      const pago = metodoPago
        ? await tx.pago.create({
            data: {
              idUsuario,
              fechaRegistro: new Date(),
              estado: estadoRegistroPago,
              metodoPago: String(metodoPago),
              monto: montoPago,
            },
          })
        : null;

      if (pago && venta?.ventaEnMostrador) {
        await tx.asignacionPago.create({
          data: {
            idPago: pago.idPago,
            idVentaEnMostrador: venta.ventaEnMostrador.idVentaEnMostrador,
            idOrdenDeCompra: null,
            montoAsociado: montoPago,
            tipoAbono:
              montoPago >= montosOperacion.montoTotal ? "pago_total" : "abono",
          },
        });
      }

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
        venta,
        ordenTrabajo,
        pago,
      };
    });

    const venta = adaptarVenta(resultado.venta);
    const ordenTrabajo = adaptarOrdenTrabajo(resultado.ordenTrabajo);
    const tipoOperacion = calcularTipoOperacion(Boolean(venta), Boolean(ordenTrabajo));

    return NextResponse.json(
      {
        code: "PUNTO_VENTA_CONFIRMADO",
        message: "Operacion de punto de venta registrada correctamente",
        tipoOperacion,
        idPuntoVenta:
          tipoOperacion === "venta"
            ? `venta-${venta?.idVenta}`
            : tipoOperacion === "orden_trabajo"
              ? `orden-${ordenTrabajo?.idOrdenDeTrabajo}`
              : null,
        idsReferenciales: {
          idVenta: venta?.idVenta ?? null,
          idOrdenDeTrabajo: ordenTrabajo?.idOrdenDeTrabajo ?? null,
        },
        totalBruto,
        descuento,
        total: montosOperacion.montoTotal,
        montoSubtotal: montosOperacion.montoSubtotal,
        montoTotal: montosOperacion.montoTotal,
        montoNeto: montosOperacion.montoNeto,
        montoIva: montosOperacion.montoIva,
        venta,
        ordenTrabajo,
        pago: resultado.pago,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("[PUNTO_VENTA_POST]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.SALES_READ)

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

    const filtrosVenta = [];

    if (etapaFiltro.etapa) {
      filtrosVenta.push({
        ordenDeTrabajo: {
          is: {
            estado: etapaFiltro.etapa,
          },
        },
      });
    }

    if (periodoFiltro.inicio && periodoFiltro.finExclusivo) {
      filtrosVenta.push({
        ordenDeTrabajo: {
          isNot: null,
        },
        fechaRegistro: {
          gte: periodoFiltro.inicio,
          lt: periodoFiltro.finExclusivo,
        },
      });
    }

    const ventas = await prisma.venta.findMany({
      where: filtrosVenta.length
        ? {
            AND: filtrosVenta,
          }
        : undefined,
      orderBy: {
        fechaRegistro: "desc",
      },
      include: {
        usuario: true,
        cliente: true,
        ventaEnMostrador: {
          include: {
            lineasDeVenta: {
              include: {
                producto: true,
              },
            },
            asignacionesPago: {
              include: {
                pago: true,
              },
            },
          },
        },
        ordenDeTrabajo: {
          include: {
            mecanico: true,
            bicicletas: true,
            lineasDeOrdenDeTrabajo: {
              include: {
                producto: true,
                servicio: true,
              },
            },
          },
        },
      },
    });

    const operaciones = ventas.flatMap((venta: any) => {
      const items = [];

      if (!etapaFiltro.etapa && !periodoFiltro.fueSolicitado && venta.ventaEnMostrador && (venta.ventaEnMostrador.lineasDeVenta?.length > 0)) {
        const ventaAdaptada = adaptarVenta(venta);

        items.push({
          idPuntoVenta: `venta-${venta.idVenta}`,
          tipoOperacion: "venta",
          fechaCreacion: venta.fechaRegistro,
          fechaRegistro: venta.fechaRegistro,
          total: venta.ventaEnMostrador.montoTotal,
          montoTotal: venta.ventaEnMostrador.montoTotal,
          estadoPago: venta.ventaEnMostrador.estadoPago,
          estadoVenta: venta.ventaEnMostrador.estado,
          cliente: venta.cliente,
          usuario: sanitizarUsuario(venta.usuario),
          venta: ventaAdaptada,
        });
      }

      if (
        venta.ordenDeTrabajo &&
        (!etapaFiltro.etapa || venta.ordenDeTrabajo.estado === etapaFiltro.etapa)
      ) {
        const ordenTrabajo = {
          ...venta.ordenDeTrabajo,
          venta,
          usuario: venta.usuario,
          cliente: venta.cliente,
        };
        const ordenTrabajoAdaptada = adaptarOrdenTrabajo(ordenTrabajo);

        items.push({
          idPuntoVenta: `orden-${venta.ordenDeTrabajo.idOrdenDeTrabajo}`,
          tipoOperacion: "orden_trabajo",
          fechaCreacion: venta.fechaRegistro,
          fechaRegistro: venta.fechaRegistro,
          total: venta.ordenDeTrabajo.montoTotal,
          montoTotal: venta.ordenDeTrabajo.montoTotal,
          estadoPago: venta.ordenDeTrabajo.estadoPago,
          estadoOrden: venta.ordenDeTrabajo.estado,
          cliente: venta.cliente,
          usuario: sanitizarUsuario(venta.usuario),
          ordenTrabajo: ordenTrabajoAdaptada,
        });
      }

      return items;
    }).sort(
      (a: any, b: any) =>
        new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()
    );

    if (etapaFiltro.etapa && operaciones.length === 0) {
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

    if (periodoFiltro.fueSolicitado && operaciones.length === 0) {
      return NextResponse.json(
        {
          code: "SIN_ORDENES_EN_PERIODO",
          message: "No hay ordenes de trabajo dentro del rango ingresado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(operaciones);
  } catch (error) {
    console.log("[PUNTO_VENTA_GET]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
