//endpoints generales del inventario para registrar nuevos clientes.
import { db } from "@/lib/db"
import { separarApellidos, separarNombres } from "@/lib/client-helpers"
import { validarYFormatearRut } from "@/lib/client-rut"
import { Prisma } from "@/generated/prisma"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { ACTIVE_WORK_ORDER_STATUSES } from "@/lib/work-order-status"
import { NextResponse } from "next/server"

function formatearRut(rut: string) {
  const rutLimpio = rut
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/-/g, "")

  if (!/^\d+[\dK]$/.test(rutLimpio)) {
    return {
      rutFormateado: null,
      error: "El RUT solo puede contener números y dígito verificador K",
    }
  }

  const cuerpo = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1)

  if (cuerpo.length < 7) {
    return {
      rutFormateado: null,
      error:
        "El RUT ingresado tiene menos de 7 dígitos sin contar el verificador",
    }
  }

  if (cuerpo.length > 8) {
    return {
      rutFormateado: null,
      error:
        "El RUT ingresado tiene más de 8 dígitos sin contar el verificador",
    }
  }

  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return {
    rutFormateado: `${cuerpoFormateado}-${dv}`,
    error: null,
  }
}

function crearCorreoRespaldo(rut: string) {
  const rutLimpio = rut.replace(/\./g, "").replace(/-/g, "").toLowerCase()

  return `cliente.${rutLimpio}@urbancycling.local`
}

export async function POST(req: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.CLIENTS_CREATE)

    if (response) {
      return response
    }

    const data = await req.json()
    const tipoCliente = data.tipoCliente || "natural"
    const rut = data.rut
    const telefono = data.telefono
    const correo = data.correo || data.email || data.correoElectronico

    if (!rut || !telefono) {
      return new NextResponse("Faltan campos obligatorios (RUT y Teléfono)", {
        status: 400,
      })
    }

    const { rutFormateado, error } = formatearRut(String(rut))

    if (error || !rutFormateado) {
      return new NextResponse(error ?? "El RUT ingresado no es válido", {
        status: 400,
      })
    }

    const clienteExistente = await db.cliente.findUnique({
      where: {
        rut: rutFormateado,
      },
    })

    if (clienteExistente) {
      return new NextResponse("Ya existe un cliente con ese RUT", {
        status: 409,
      })
    }

    let insertData: Prisma.ClienteCreateInput = {
      tipoCliente,
      rut: rutFormateado,
      correo: correo
        ? String(correo).trim().toLowerCase()
        : crearCorreoRespaldo(rutFormateado),
      estado: "activo",
      telefonos: {
        create: {
          telefono: String(telefono).trim(),
        },
      },
    }

    if (tipoCliente === "natural") {
      const nombres = data.nombre || data.nombres || data.Nombres
      const apellidos = data.apellido || data.apellidos || data.Apellidos

      if (!nombres || !apellidos) {
        return new NextResponse(
          "Faltan campos obligatorios para persona natural (nombres y apellidos)",
          { status: 400 }
        )
      }

      const { primerNombre, segundoNombre } = separarNombres(String(nombres))
      const { apellidoPaterno, apellidoMaterno } = separarApellidos(
        String(apellidos)
      )

      insertData = {
        ...insertData,
        primerNombre,
        segundoNombre,
        apellidoPaterno,
        apellidoMaterno,
        razonSocial: null,
        giro: null,
        nombreContacto: null,
      }
    } else if (tipoCliente === "juridica") {
      const razonSocial = data.razon || data.razonSocial || data.RazonSocial
      const giro = data.giro || null
      const nombreContacto = data.nombreContacto || null

      if (!razonSocial) {
        return new NextResponse("Falta la Razón Social para persona jurídica", {
          status: 400,
        })
      }

      insertData = {
        ...insertData,
        primerNombre: null,
        segundoNombre: null,
        apellidoPaterno: null,
        apellidoMaterno: null,
        razonSocial,
        giro,
        nombreContacto,
      }
    } else {
      return new NextResponse("Tipo de cliente no válido", { status: 400 })
    }

    const cliente = await db.cliente.create({
      data: insertData,
      include: {
        telefonos: true,
      },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.log("[CLIENTES_POST]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.CLIENTS_READ)

    if (response) {
      return response
    }

    const clientes = await db.cliente.findMany({
      where: {
        estado: "activo",
      },
      orderBy: {
        fechaRegistro: "desc",
      },
      include: {
        telefonos: true,
        direcciones: true,
        ventas: {
          orderBy: {
            fechaRegistro: "desc",
          },
          include: {
            ordenDeTrabajo: true,
          },
        },
      },
    })

    const clientesFormateados = clientes.map((cliente) => {
      const ordenesDeTrabajo = cliente.ventas
        .filter((venta) => venta.ordenDeTrabajo)
        .map((venta) => {
          const orden = venta.ordenDeTrabajo!

          return {
            idOrdenDeTrabajo: orden.idOrdenDeTrabajo,
            idUsuario: venta.idUsuario,
            idCliente: venta.idCliente,
            fechaRecepcion: venta.fechaRegistro,
            fechaEntregaEstimada: orden.fechaEntregaEstimada,
            fechaEntregaReal: orden.fechaEntregaReal,
            observacionesIngreso: orden.observacionesIngreso,
            total: orden.montoTotal,
            descuento: orden.descuentoGlobal,
            estadoPago: orden.estadoPago,
            estadoOrden: orden.estado,
            fechaCreacion: venta.fechaRegistro,
          }
        })

      return {
        idCliente: cliente.idCliente,
        tipoCliente: cliente.tipoCliente,
        rut: cliente.rut,
        fechaRegistro: cliente.fechaRegistro,
        fechaCreacion: cliente.fechaRegistro,
        estado: cliente.estado,
        primerNombre: cliente.primerNombre,
        segundoNombre: cliente.segundoNombre,
        apellidoPaterno: cliente.apellidoPaterno,
        apellidoMaterno: cliente.apellidoMaterno,
        razonSocial: cliente.razonSocial,
        giro: cliente.giro,
        nombreContacto: cliente.nombreContacto,
        correo: cliente.correo,
        telefonos: cliente.telefonos,
        direcciones: cliente.direcciones,
        correos: cliente.correo
          ? [
              {
                idCorreoCliente: cliente.idCliente,
                idCliente: cliente.idCliente,
                correo: cliente.correo,
                descripcion: "Principal",
              },
            ]
          : [],
        ordenesDeTrabajo,
      }
    })

    return NextResponse.json(clientesFormateados)
  } catch (error) {
    console.log("[CLIENTES_GET]", error)
    return new NextResponse("Internal Server Error", {
      status: 500,
    })
  }
}

class ClienteNoExisteError extends Error {
  constructor() {
    super("No existe un cliente registrado con el RUT indicado")
    this.name = "ClienteNoExisteError"
  }
}

class ClienteConOrdenActivaError extends Error {
  ordenDeTrabajo: {
    idOrdenDeTrabajo: number
    estado: string
  }

  constructor(ordenDeTrabajo: {
    idOrdenDeTrabajo: number
    estado: string
  }) {
    super(
      "No se puede eliminar el cliente porque tiene órdenes de trabajo activas"
    )
    this.name = "ClienteConOrdenActivaError"
    this.ordenDeTrabajo = ordenDeTrabajo
  }
}

class ClienteYaInactivoError extends Error {
  constructor() {
    super("El cliente ya se encuentra eliminado")
    this.name = "ClienteYaInactivoError"
  }
}

export async function DELETE(request: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.CLIENTS_DELETE)

    if (response) {
      return response
    }

    const { searchParams } = new URL(request.url)
    const rutParametro = searchParams.get("rut")
    const resultadoRut = validarYFormatearRut(rutParametro ?? "")

    if (!resultadoRut.valid) {
      return NextResponse.json(
        {
          code: "RUT_INVALIDO",
          message: resultadoRut.error,
        },
        { status: 400 }
      )
    }

    await db.$transaction(async (tx) => {
      const cliente = await tx.cliente.findFirst({
        where: {
          rut: {
            in: [resultadoRut.formatted, resultadoRut.compact],
          },
        },
        select: {
          idCliente: true,
          estado: true,
        },
      })

      if (!cliente) {
        throw new ClienteNoExisteError()
      }

      if (cliente.estado !== "activo") {
        throw new ClienteYaInactivoError()
      }

      // Bloquea el cliente durante toda la transacción para evitar que una
      // operación concurrente cree una venta/OT mientras se valida y elimina.
      await tx.$queryRaw<{ id_cliente: number }[]>(
        Prisma.sql`
          SELECT id_cliente
          FROM clientes
          WHERE id_cliente = ${cliente.idCliente}
          FOR UPDATE
        `
      )

      const ordenActiva = await tx.venta.findFirst({
        where: {
          idCliente: cliente.idCliente,
          ordenDeTrabajo: {
            is: {
              estado: {
                in: [...ACTIVE_WORK_ORDER_STATUSES],
              },
            },
          },
        },
        select: {
          ordenDeTrabajo: {
            select: {
              idOrdenDeTrabajo: true,
              estado: true,
            },
          },
        },
      })

      if (ordenActiva?.ordenDeTrabajo) {
        throw new ClienteConOrdenActivaError(ordenActiva.ordenDeTrabajo)
      }

      await tx.cliente.update({
        where: {
          idCliente: cliente.idCliente,
        },
        data: {
          estado: "inactivo",
        },
      })
    })

    return NextResponse.json(
      {
        code: "CLIENTE_ELIMINADO",
        message: "El cliente fue eliminado correctamente",
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof ClienteNoExisteError) {
      return NextResponse.json(
        {
          code: "CLIENTE_NO_EXISTE",
          message: error.message,
        },
        { status: 404 }
      )
    }

    if (error instanceof ClienteConOrdenActivaError) {
      return NextResponse.json(
        {
          code: "CLIENTE_CON_OT_ACTIVA",
          message: error.message,
          ordenDeTrabajo: error.ordenDeTrabajo,
        },
        { status: 409 }
      )
    }

    if (error instanceof ClienteYaInactivoError) {
      return NextResponse.json(
        {
          code: "CLIENTE_YA_INACTIVO",
          message: error.message,
        },
        { status: 409 }
      )
    }

    console.error("[CLIENTES_DELETE]", error)

    return NextResponse.json(
      {
        code: "ERROR_INTERNO",
        message: "No fue posible eliminar el cliente",
      },
      { status: 500 }
    )
  }
}
