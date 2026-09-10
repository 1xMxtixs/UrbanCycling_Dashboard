import { Resend } from "resend"

type PasswordResetEmailParams = {
  to: string
  resetUrl: string
  expiresInMinutes?: number
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
