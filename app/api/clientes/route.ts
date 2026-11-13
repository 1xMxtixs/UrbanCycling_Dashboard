//endpoints generales del inventario para registrar nuevos clientes.
import { randomUUID } from "node:crypto"
import { db } from "@/lib/db"
import {
  normalizarTexto,
  separarApellidos,
  separarNombres,
} from "@/lib/client-helpers"
import { validarRutOpcional } from "@/app/api/_lib/client-rut"
import { validarYFormatearRut } from "@/lib/client-rut"
import { EstadoRegistro, Prisma } from "@/generated/prisma"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
import { ACTIVE_WORK_ORDER_STATUSES } from "@/lib/work-order-status"
import { NextResponse } from "next/server"

function crearCorreoRespaldo(rut: string | null) {
  const identificador = rut ? rut.replace(/[.\-]/g, "").toLowerCase() : randomUUID()
  return `cliente.${identificador}@urbancycling.local`
}

/**
 * POST /api/clientes
 * Registra una persona o empresa y devuelve la ficha creada para refrescar
 * formularios y selectores de clientes sin una segunda consulta.
 */
export async function POST(req: Request) {
  try {
    const { response } = await requirePermission(PERMISSIONS.CLIENTS_CREATE)

    if (response) {
      return response
    }

    let data
    try {
      data = await req.json()
    } catch {
      return new NextResponse("El cuerpo debe contener un JSON válido", { status: 400 })
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return new NextResponse("Los datos enviados no son válidos", { status: 400 })
    }
    const tipoCliente = data.tipoCliente || "natural"
    const rut = data.rut
    const telefono = data.telefono
    const correo = data.correo || data.email || data.correoElectronico

    if (!telefono || !String(telefono).trim()) {
      return new NextResponse("Falta el teléfono obligatorio", { status: 400 })
    }
    const resultadoRut = validarRutOpcional(rut)
    if (!resultadoRut.valid) {
      return new NextResponse(resultadoRut.error, { status: 400 })
    }
    const rutFormateado = resultadoRut.formatted
    if (rutFormateado) {
      const clienteExistente = await db.cliente.findFirst({
        where: { OR: [{ rut: rutFormateado }, { rut: resultadoRut.compact }] },
      })
      if (clienteExistente) {
        return new NextResponse("Ya existe un cliente con ese RUT", { status: 409 })
      }
    }

    let insertData: Prisma.ClienteCreateInput = {
      tipoCliente,
      rut: rutFormateado,
      correo: correo
        ? String(correo).trim().toLowerCase()
        : crearCorreoRespaldo(rutFormateado),
      estado: EstadoRegistro.ACTIVO,
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
      const razonSocial = normalizarTexto(
        data.razon || data.razonSocial || data.RazonSocial
      )
      const giro = normalizarTexto(data.giro || null) || null
      const nombreContacto = normalizarTexto(data.nombreContacto || null) || null

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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
      && JSON.stringify(error.meta?.target ?? "").includes("rut")) {
      return new NextResponse("Ya existe un cliente con ese RUT", { status: 409 })
    }
    console.log("[CLIENTES_POST]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

/**
 * GET /api/clientes
 * Lista clientes activos con sus datos de contacto y un indicador de órdenes
 * de trabajo activas para la tabla principal de clientes.
 */
export async function GET() {
  try {
    const { response } = await requirePermission(PERMISSIONS.CLIENTS_READ)

    if (response) {
      return response
    }

    const clientes = await db.cliente.findMany({
      where: {
        estado: {
          in: [EstadoRegistro.ACTIVO, EstadoRegistro.INACTIVO]
        }
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
            // El estado financiero pertenece a la venta y es compartido por todos sus subtipos.
            estadoPago: venta.estadoPago,
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

/**
 * DELETE /api/clientes?idCliente=...
 * Desactiva lógicamente un cliente cuando no tiene órdenes activas. La vista
 * debe retirarlo de los listados de clientes disponibles al recibir 200.
 */
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

      if (cliente.estado !== EstadoRegistro.ACTIVO) {
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

      // Los códigos compartidos mantienen esta regla alineada con el flujo de las OT.
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
          estado: EstadoRegistro.INACTIVO,
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
