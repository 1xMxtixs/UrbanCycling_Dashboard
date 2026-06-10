// Capa referencial del nuevo punto de venta.
// Mientras no exista una tabla punto_venta, registra ventas y ordenes en sus
// tablas actuales y responde con una forma unificada para el front.
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const prisma = db as any;

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

  return {
    ...ventaSegura,
    montoTotal: ventaSegura.total,
    descuentoGlobal: ventaSegura.descuento,
    estadoVenta: ventaSegura.estado,
    fechaRegistro: ventaSegura.fechaCreacion,
  };
}

function adaptarOrdenTrabajo(ordenTrabajo: any) {
  if (!ordenTrabajo) {
    return null;
  }

  const ordenTrabajoSegura = sanitizarActores(ordenTrabajo);

  return {
    ...ordenTrabajoSegura,
    montoTotal: ordenTrabajoSegura.total,
    descuentoGlobal: ordenTrabajoSegura.descuento,
    estado: ordenTrabajoSegura.estadoOrden,
    fechaRecepcion: ordenTrabajoSegura.fechaRegistro,
    fechaRegistro: ordenTrabajoSegura.fechaCreacion,
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
    marca: String(item.marca ?? "").trim(),
    modelo: String(item.modelo ?? "").trim(),
    color: String(item.color ?? "").trim(),
    descripcion: item.descripcion ? String(item.descripcion).trim() : null,
    imagenUrl: item.imagenUrl ? String(item.imagenUrl).trim() : null,
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

export async function POST(req: Request) {
  try {
    const rawData = await req.json();
    const idUsuario = parsePositiveInteger(rawData.id_usuario ?? rawData.idUsuario);
    const idCliente = parsePositiveInteger(rawData.id_cliente ?? rawData.idCliente);
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

    if (Number.isNaN(idUsuario) || Number.isNaN(idCliente)) {
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

    const resultado = await prisma.$transaction(async (tx: any) => {
      const venta = lineasVenta.length
        ? await tx.venta.create({
            data: {
              idUsuario,
              idCliente,
              idComprobante: rawData.id_comprobante
                ? Number(rawData.id_comprobante)
                : rawData.idComprobante
                  ? Number(rawData.idComprobante)
                  : null,
              estadoPago,
              estado: rawData.estado_venta ?? rawData.estadoVenta ?? "confirmada",
              total: montosVenta.montoTotal,
              descuento: montosVenta.descuentoGlobal,
              lineasDeVenta: {
                create: lineasVenta.map((linea) => ({
                  idProducto: linea.idProducto,
                  cantidad: linea.cantidad,
                  precioUnitario: linea.precioUnitario,
                })),
              },
            },
            include: {
              usuario: true,
              cliente: true,
              lineasDeVenta: {
                include: {
                  producto: true,
                },
              },
            },
          })
        : null;

      const ordenTrabajo = tieneOrden
        ? await tx.ordenDeTrabajo.create({
            data: {
              idUsuario,
              idCliente,
              idComprobante: ordenInput.id_comprobante
                ? Number(ordenInput.id_comprobante)
                : ordenInput.idComprobante
                  ? Number(ordenInput.idComprobante)
                  : null,
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
              total: montosOrden.montoTotal,
              descuento: montosOrden.descuentoGlobal,
              estadoPago,
              estadoOrden:
                ordenInput.estado_orden ??
                ordenInput.estadoOrden ??
                "Por realizar",
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
                      })),
                    }
                  : undefined,
            },
            include: {
              usuario: true,
              cliente: true,
              bicicletas: true,
              lineasDeOrdenDeTrabajo: {
                include: {
                  producto: true,
                  servicio: true,
                },
              },
            },
          })
        : null;

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

export async function GET() {
  try {
    const [ventas, ordenesTrabajo] = await Promise.all([
      prisma.venta.findMany({
        orderBy: {
          fechaCreacion: "desc",
        },
        include: {
          usuario: true,
          cliente: true,
          lineasDeVenta: {
            include: {
              producto: true,
            },
          },
        },
      }),
      prisma.ordenDeTrabajo.findMany({
        orderBy: {
          fechaCreacion: "desc",
        },
        include: {
          usuario: true,
          cliente: true,
          bicicletas: true,
          lineasDeOrdenDeTrabajo: {
            include: {
              producto: true,
              servicio: true,
            },
          },
        },
      }),
    ]);

    const operaciones = [
      ...ventas.map((venta: any) => {
        const ventaAdaptada = adaptarVenta(venta);

        return {
          idPuntoVenta: `venta-${venta.idVenta}`,
          tipoOperacion: "venta",
          fechaCreacion: venta.fechaCreacion,
          fechaRegistro: venta.fechaCreacion,
          total: venta.total,
          montoTotal: venta.total,
          estadoPago: venta.estadoPago,
          estadoVenta: venta.estado,
          cliente: venta.cliente,
          usuario: venta.usuario,
          venta: ventaAdaptada,
        };
      }),
      ...ordenesTrabajo.map((ordenTrabajo: any) => {
        const ordenTrabajoAdaptada = adaptarOrdenTrabajo(ordenTrabajo);

        return {
          idPuntoVenta: `orden-${ordenTrabajo.idOrdenDeTrabajo}`,
          tipoOperacion: "orden_trabajo",
          fechaCreacion: ordenTrabajo.fechaCreacion,
          fechaRegistro: ordenTrabajo.fechaCreacion,
          total: ordenTrabajo.total,
          montoTotal: ordenTrabajo.total,
          estadoPago: ordenTrabajo.estadoPago,
          estadoOrden: ordenTrabajo.estadoOrden,
          cliente: ordenTrabajo.cliente,
          usuario: ordenTrabajo.usuario,
          ordenTrabajo: ordenTrabajoAdaptada,
        };
      }),
    ].sort(
      (a, b) =>
        new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime()
    );

    return NextResponse.json(operaciones);
  } catch (error) {
    console.log("[PUNTO_VENTA_GET]", error);

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
