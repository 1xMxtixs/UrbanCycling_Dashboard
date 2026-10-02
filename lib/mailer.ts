import { Resend } from "resend"

type PasswordResetEmailParams = {
  to: string
  resetUrl: string
  expiresInMinutes?: number
}

type WorkOrderPdfEmailParams = {
  /** Correo registrado para el cliente propietario de la orden. */
  to: string
  /** Identificador visible en el asunto, contenido y nombre del adjunto. */
  workOrderId: number
  /** PDF generado en memoria por lib/work-order-pdf.ts. */
  pdf: Buffer
}

let resendClient: Resend | null = null

function getResendClient() {
  if (resendClient) {
    return resendClient
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()

  if (!apiKey) {
    throw new Error("RESEND_API_KEY no está configurada")
  }

  resendClient = new Resend(apiKey)

  return resendClient
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Falta configurar la variable de entorno ${name}`)
  }

  return value
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  expiresInMinutes = 30,
}: PasswordResetEmailParams) {
  const { error } = await getResendClient().emails.send({
    from: getRequiredEnv("MAIL_FROM"),
    to: [to],
    subject: "Recuperación de contraseña - Urban Cycling",
    text: [
      "Solicitaste recuperar tu contraseña de Urban Cycling.",
      "",
      `Utiliza el siguiente enlace: ${resetUrl}`,
      `El enlace expirará en ${expiresInMinutes} minutos.`,
      "",
      "Si no realizaste esta solicitud, puedes ignorar este correo.",
    ].join("\n"),
    html: `
      <main>
        <h1>Recuperación de contraseña</h1>
        <p>Solicitaste recuperar tu contraseña de Urban Cycling.</p>
        <p>
          <a href="${resetUrl}">Establecer nueva contraseña</a>
        </p>
        <p>Este enlace expirará en ${expiresInMinutes} minutos.</p>
        <p>Si no realizaste esta solicitud, puedes ignorar este correo.</p>
      </main>
    `,
  })

  if (error) {
    throw new Error("No se pudo enviar el correo de recuperación")
  }
}

/**
 * Envía al cliente el PDF ya generado de una orden de trabajo.
 *
 * La generación del documento permanece fuera de este módulo para que el
 * correo solo se ocupe de la entrega y pueda reutilizarse desde rutas API.
 */
export async function sendWorkOrderPdfEmail({
  to,
  workOrderId,
  pdf,
}: WorkOrderPdfEmailParams) {
  const { error } = await getResendClient().emails.send({
    from: getRequiredEnv("MAIL_FROM"),
    to: [to],
    subject: `Orden de trabajo #${workOrderId} - Urban Cycling`,
    text: [
      "Estimado/a cliente,",
      "",
      `Adjuntamos el documento PDF de su orden de trabajo #${workOrderId}.`,
      "",
      "Ante cualquier consulta, puede comunicarse con Urban Cycling.",
      "",
      "Saludos,",
      "Urban Cycling",
    ].join("\n"),
    html: `
      <main>
        <h1>Orden de trabajo #${workOrderId}</h1>
        <p>Estimado/a cliente,</p>
        <p>
          Adjuntamos el documento PDF de su orden de trabajo
          <strong>#${workOrderId}</strong>.
        </p>
        <p>Ante cualquier consulta, puede comunicarse con Urban Cycling.</p>
      </main>
    `,
    attachments: [
      {
        filename: `orden-trabajo-${workOrderId}.pdf`,
        content: pdf,
      },
    ],
  })

  if (error) {
    // El detalle queda únicamente en los logs del servidor. La ruta API
    // mantiene una respuesta genérica para no filtrar información del proveedor
    // de correo hacia el navegador.
    console.error("[RESEND_WORK_ORDER_EMAIL]", error)
    throw new Error("No se pudo enviar el correo con la orden de trabajo")
  }
}
