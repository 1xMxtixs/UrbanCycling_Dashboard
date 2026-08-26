// Endpoint para actualizar la ficha de un cliente por ID.
import type { Prisma } from "@/generated/prisma"
import { NextResponse } from "next/server"

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

function normalizarTexto(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim().replace(/\s+/g, " ")
}

function normalizarTextoOpcional(value: unknown): string | null {
  const texto = normalizarTexto(value)
  return texto || null
}

function separarNombres(nombres: string) {
  const partes = nombres.split(" ")

  return {
    primerNombre: partes[0],
    segundoNombre: partes.slice(1).join(" ") || null,
  }
}

function separarApellidos(apellidos: string) {
  const partes = apellidos.split(" ")

  return {
    apellidoPaterno: partes[0],
    apellidoMaterno: partes.slice(1).join(" ") || null,
  }
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status })
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
      return errorResponse(
        "ID_CLIENTE_INVALIDO",
        "El ID del cliente no es válido",
        400
      )
    }

    let data: UpdateClienteBody

    try {
      data = await request.json()
    } catch {
      return errorResponse(
        "JSON_INVALIDO",
        "El cuerpo de la solicitud no contiene un JSON válido",
        400
      )
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return errorResponse(
        "CUERPO_INVALIDO",
        "Los datos enviados no son válidos",
        400
      )
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
      return errorResponse("CLIENTE_NO_ENCONTRADO", "El cliente no existe", 404)
    }

    const telefono = normalizarTexto(data.telefono)

    if (!telefono) {
      return errorResponse(
        "CAMPOS_OBLIGATORIOS_VACIOS",
        "Debe ingresar el teléfono del cliente",
        400
      )
    }

    const esPersonaNatural = clienteActual.tipoCliente === "natural"
    const esPersonaJuridica = ["juridica", "juridico"].includes(
      clienteActual.tipoCliente
    )

    if (!esPersonaNatural && !esPersonaJuridica) {
      return errorResponse(
        "TIPO_CLIENTE_INVALIDO",
        "El cliente posee un tipo no reconocido",
        409
      )
    }

    let clienteData: Prisma.ClienteUpdateInput

    if (esPersonaNatural) {
      const nombres = normalizarTexto(data.nombre)
      const apellidos = normalizarTexto(data.apellido)

      if (!nombres || !apellidos) {
        return errorResponse(
          "CAMPOS_OBLIGATORIOS_VACIOS",
          "Debe ingresar el nombre y apellido del cliente",
          400
        )
      }

      const { primerNombre, segundoNombre } = separarNombres(nombres)
      const { apellidoPaterno, apellidoMaterno } = separarApellidos(apellidos)

      clienteData = {
        primerNombre,
        segundoNombre,
        apellidoPaterno,
        apellidoMaterno,
      }
    } else {
      const razonSocial = normalizarTexto(data.razonSocial)

      if (!razonSocial) {
        return errorResponse(
          "CAMPOS_OBLIGATORIOS_VACIOS",
          "Debe ingresar la razón social del cliente",
          400
        )
      }

      clienteData = {
        razonSocial,
        giro: normalizarTextoOpcional(data.giro),
        nombreContacto: normalizarTextoOpcional(data.nombreContacto),
      }
    }

    if (data.correo !== undefined) {
      const correo = normalizarTexto(data.correo).toLowerCase()

      if (!correo) {
        return errorResponse(
          "CORREO_VACIO",
          "El correo no puede quedar vacío",
          400
        )
      }

      clienteData.correo = correo
    }

    let telefonoActual: (typeof clienteActual.telefonos)[number] | undefined =
      clienteActual.telefonos[0]

    if (data.idTelefonoCliente !== undefined) {
      const idTelefonoCliente = Number(data.idTelefonoCliente)

      if (!Number.isInteger(idTelefonoCliente) || idTelefonoCliente <= 0) {
        return errorResponse(
          "ID_TELEFONO_INVALIDO",
          "El ID del teléfono no es válido",
          400
        )
      }

      telefonoActual = clienteActual.telefonos.find(
        (item) => item.idTelefonoCliente === idTelefonoCliente
      )

      if (!telefonoActual) {
        return errorResponse(
          "TELEFONO_NO_ENCONTRADO",
          "El teléfono no pertenece al cliente",
          404
        )
      }
    }

    const clienteActualizado = await db.$transaction(async (tx) => {
      await tx.cliente.update({
        where: {
          idCliente,
        },
        data: clienteData,
      })

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

    return errorResponse("ERROR_INTERNO", "Internal Server Error", 500)
  }
}
