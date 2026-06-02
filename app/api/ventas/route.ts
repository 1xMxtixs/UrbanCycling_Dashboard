// Endpoints generales para registrar y listar ventas directas de productos.
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

type ProductoVentaInput = {
  id_producto?: unknown
  idProducto?: unknown
  cantidad?: unknown
}

function toNumber(value: unknown) {
  return Number(value ?? 0)
}

function parsePositiveInteger(value: unknown) {
  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return Number.NaN
  }

  return parsedValue
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const idUsuario = parsePositiveInteger(data.id_usuario ?? data.idUsuario)
    const idCliente = parsePositiveInteger(data.id_cliente ?? data.idCliente)
    const idComprobanteInput = data.id_comprobante ?? data.idComprobante
    const descuento = Number(data.descuento ?? 0)
    const estadoPago = data.estado_pago ?? data.estadoPago ?? "pagado"
    const estadoVenta = data.estado_venta ?? data.estadoVenta ?? "confirmada"
    const productosInput = data.productos ?? data.lineas ?? []

    if (Number.isNaN(idUsuario) || Number.isNaN(idCliente)) {
      return NextResponse.json(
        {
          code: "FALTAN_DATOS",
          message: "Debe indicar usuario y cliente válidos",
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(productosInput) || productosInput.length === 0) {
      return NextResponse.json(
        {
          code: "VENTA_SIN_PRODUCTOS",
          message: "Debe ingresar al menos un producto para la venta",
        },
        { status: 400 }
      )
    }

    const productosSolicitados = productosInput.map(
      (item: ProductoVentaInput) => ({
        idProducto: parsePositiveInteger(item.id_producto ?? item.idProducto),
        cantidad: parsePositiveInteger(item.cantidad),
      })
    )

    const productoInvalido = productosSolicitados.find(
      (item) => Number.isNaN(item.idProducto) || Number.isNaN(item.cantidad)
    )

    if (productoInvalido) {
      return NextResponse.json(
        {
          code: "PRODUCTO_INVALIDO",
          message: "Todos los productos deben tener ID y cantidad válidos",
        },
        { status: 400 }
      )
    }

    const usuario = await db.usuario.findUnique({
      where: {
        idUsuario,
      },
    })

    if (!usuario) {
      return NextResponse.json(
        {
          code: "USUARIO_NO_EXISTE",
          message: "El usuario indicado no existe",
        },
        { status: 404 }
      )
    }

    const cliente = await db.cliente.findUnique({
      where: {
        idCliente,
      },
    })

    if (!cliente) {
      return NextResponse.json(
        {
          code: "CLIENTE_NO_EXISTE",
          message:
            "El cliente no está registrado. Debe registrarlo antes de crear la venta.",
        },
        { status: 404 }
      )
    }

    const productosAgrupados = Array.from(
      productosSolicitados
        .reduce((productosMap, item) => {
          productosMap.set(
            item.idProducto,
            (productosMap.get(item.idProducto) ?? 0) + item.cantidad
          )

          return productosMap
        }, new Map<number, number>())
        .entries()
    ).map(([idProducto, cantidad]) => ({
      idProducto,
      cantidad,
    }))

    const idsProductos = productosAgrupados.map((item) => item.idProducto)

    const productos = await db.producto.findMany({
      where: {
        idProducto: {
          in: idsProductos,
        },
      },
    })

    const productosPorId = new Map(
      productos.map((producto) => [producto.idProducto, producto])
    )

    const productoNoExiste = productosAgrupados.find(
      (item) => !productosPorId.has(item.idProducto)
    )

    if (productoNoExiste) {
      return NextResponse.json(
        {
          code: "PRODUCTO_NO_EXISTE",
          message: `El producto con ID ${productoNoExiste.idProducto} no existe`,
          id_producto: productoNoExiste.idProducto,
          idProducto: productoNoExiste.idProducto,
        },
        { status: 404 }
      )
    }

    const productoSinStock = productosAgrupados.find((item) => {
      const producto = productosPorId.get(item.idProducto)

      return producto && producto.stockActual < item.cantidad
    })

    if (productoSinStock) {
      const producto = productosPorId.get(productoSinStock.idProducto)!

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
      )
    }

    const lineasCalculadas = productosAgrupados.map((item) => {
      const producto = productosPorId.get(item.idProducto)!
      const precioUnitario = toNumber(producto.precioVenta)

      return {
        producto,
        cantidad: item.cantidad,
        precioUnitario,
        subtotal: item.cantidad * precioUnitario,
      }
    })

    const totalBruto = lineasCalculadas.reduce(
      (total, linea) => total + linea.subtotal,
      0
    )
    const total = Math.max(0, totalBruto - descuento)

    const venta = await db.$transaction(async (tx) => {
      const ventaCreada = await tx.venta.create({
        data: {
          idUsuario,
          idCliente,
          idComprobante: idComprobanteInput ? Number(idComprobanteInput) : null,
          total,
          descuento,
          estadoPago,
          estadoVenta,
          lineasDeVenta: {
            create: lineasCalculadas.map((linea) => ({
              idProducto: linea.producto.idProducto,
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

      for (const linea of lineasCalculadas) {
        await tx.producto.update({
          where: {
            idProducto: linea.producto.idProducto,
          },
          data: {
            stockActual: linea.producto.stockActual - linea.cantidad,
          },
        })
      }

      return ventaCreada
    })

    return NextResponse.json(
      {
        code: "VENTA_CONFIRMADA",
        message: "Venta registrada correctamente",
        venta,
        total_bruto: totalBruto,
        descuento,
        total,
      },
      { status: 201 }
    )
  } catch (error) {
    console.log("[VENTAS_POST]", error)

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const ventas = await db.venta.findMany({
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
    })

    return NextResponse.json(ventas)
  } catch (error) {
    console.log("[VENTAS_GET]", error)

    return NextResponse.json(
      { code: "ERROR_INTERNO", message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
