// Endpoint para actualizar parcialmente la ficha de un cliente por ID.
import type { Prisma } from "@/generated/prisma"
import { NextResponse } from "next/server"

import {
  normalizarTexto,
  normalizarTextoOpcional,
  separarApellidos,
  separarNombres,
} from "@/lib/client-helpers"
import { db } from "@/lib/db"
import { PERMISSIONS } from "@/lib/permissions"
import { requirePermission } from "@/lib/require-permission"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type UpdateClienteBody = {
  nombre?: unknown
  apellido?: unknown
  razonSocial?: unknown
  giro?: unknown
  nombreContacto?: unknown
  correo?: unknown
  telefono?: unknown
  idTelefonoCliente?: unknown
}

function parseClienteId(id: string): number {
  const idCliente = Number(id)

  if (!Number.isInteger(idCliente) || idCliente <= 0) {
    return Number.NaN
  }

  return idCliente
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { response } = await requirePermission(PERMISSIONS.CLIENTS_UPDATE)

    if (response) {
      return response
    }

    const { id } = await context.params
    const idCliente = parseClienteId(id)

    if (Number.isNaN(idCliente)) {
      return new NextResponse("El ID del cliente no es válido", {
        status: 400,
      })
    }

    let data: UpdateClienteBody

    try {
      data = await request.json()
    } catch {
      return new NextResponse(
        "El cuerpo de la solicitud no contiene un JSON válido",
        {
          status: 400,
        }
      )
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return new NextResponse("Los datos enviados no son válidos", {
        status: 400,
      })
    }

    const clienteActual = await db.cliente.findUnique({
      where: {
        idCliente,
      },
      include: {
        telefonos: true,
      },
    })

    if (!clienteActual) {
      return new NextResponse("El cliente no existe", { status: 404 })
    }

    const esPersonaNatural = clienteActual.tipoCliente === "natural"
    const esPersonaJuridica = ["juridica", "juridico"].includes(
      clienteActual.tipoCliente
    )

    if (!esPersonaNatural && !esPersonaJuridica) {
      return new NextResponse("El cliente posee un tipo no reconocido", {
        status: 409,
      })
    }

    const clienteData: Prisma.ClienteUpdateInput = {}

    if (esPersonaNatural) {
      if (data.nombre !== undefined) {
        const nombres = normalizarTexto(data.nombre)

        if (!nombres) {
          return new NextResponse("El nombre no puede quedar vacío", {
            status: 400,
          })
        }

        Object.assign(clienteData, separarNombres(nombres))
      }

      if (data.apellido !== undefined) {
        const apellidos = normalizarTexto(data.apellido)

        if (!apellidos) {
          return new NextResponse("El apellido no puede quedar vacío", {
            status: 400,
          })
        }

        Object.assign(clienteData, separarApellidos(apellidos))
      }
    }

    if (esPersonaJuridica) {
      if (data.razonSocial !== undefined) {
        const razonSocial = normalizarTexto(data.razonSocial)

        if (!razonSocial) {
          return new NextResponse("La razón social no puede quedar vacía", {
            status: 400,
          })
        }

        clienteData.razonSocial = razonSocial
      }

      if (data.giro !== undefined) {
        clienteData.giro = normalizarTextoOpcional(data.giro)
      }

      if (data.nombreContacto !== undefined) {
        clienteData.nombreContacto = normalizarTextoOpcional(
          data.nombreContacto
        )
      }
    }

    if (data.correo !== undefined) {
      const correo = normalizarTexto(data.correo).toLowerCase()

      if (!correo) {
        return new NextResponse("El correo no puede quedar vacío", {
          status: 400,
        })
      }

      clienteData.correo = correo
    }

    const actualizaTelefono = data.telefono !== undefined
    let telefono: string | undefined
    let telefonoActual: (typeof clienteActual.telefonos)[number] | undefined

    if (actualizaTelefono) {
      telefono = normalizarTexto(data.telefono)

      if (!telefono) {
        return new NextResponse("El teléfono no puede quedar vacío", {
          status: 400,
        })
      }

      telefonoActual = clienteActual.telefonos[0]

      if (data.idTelefonoCliente !== undefined) {
        const idTelefonoCliente = Number(data.idTelefonoCliente)

        if (!Number.isInteger(idTelefonoCliente) || idTelefonoCliente <= 0) {
          return new NextResponse("El ID del teléfono no es válido", {
            status: 400,
          })
        }

        telefonoActual = clienteActual.telefonos.find(
          (item) => item.idTelefonoCliente === idTelefonoCliente
        )

        if (!telefonoActual) {
          return new NextResponse("El teléfono no pertenece al cliente", {
            status: 404,
          })
        }
      }
    } else if (data.idTelefonoCliente !== undefined) {
      return new NextResponse("Debe enviar un teléfono para actualizarlo", {
        status: 400,
      })
    }

    const hayCambiosCliente = Object.keys(clienteData).length > 0

    if (!hayCambiosCliente && !actualizaTelefono) {
      return new NextResponse("No se enviaron campos para actualizar", {
        status: 400,
      })
    }

    const clienteActualizado = await db.$transaction(async (tx) => {
      if (hayCambiosCliente) {
        await tx.cliente.update({
          where: {
            idCliente,
          },
          data: clienteData,
        })
      }

      if (actualizaTelefono && telefono) {
        if (telefonoActual) {
          await tx.telefonoCliente.update({
            where: {
              idTelefonoCliente: telefonoActual.idTelefonoCliente,
            },
            data: {
              telefono,
            },
          })
        } else {
          await tx.telefonoCliente.create({
            data: {
              idCliente,
              telefono,
              descripcion: "Principal",
            },
          })
        }
      }

      return tx.cliente.findUniqueOrThrow({
        where: {
          idCliente,
        },
        include: {
          telefonos: true,
          direcciones: true,
        },
      })
    })

    return NextResponse.json(clienteActualizado)
  } catch (error) {
    console.log("[CLIENTES_ID_PATCH]", error)

    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
