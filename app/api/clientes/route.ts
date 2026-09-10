//endpoints generales del inventario para registrar nuevos clientes.
import { db } from "@/lib/db"
import { separarApellidos, separarNombres } from "@/lib/client-helpers"
import type { Prisma } from "@/generated/prisma"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"
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
