import { NextResponse } from "next/server"

/**
 * POST /api/auth/register
 *
 * Informa que el autorregistro público fue retirado. Se conserva temporalmente
 * la ruta con estado 410 para que consumidores antiguos reciban una respuesta
 * controlada sin disponer de una vía alternativa para crear cuentas.
 */
export async function POST() {
  return NextResponse.json(
    {
      code: "REGISTRO_PUBLICO_DESHABILITADO",
      message:
        "La creación de usuarios debe ser realizada por un administrador.",
    },
    { status: 410 }
  )
}
