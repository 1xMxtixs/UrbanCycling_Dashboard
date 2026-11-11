import nodemailer from "nodemailer"

type PasswordResetEmailParams = {
  to: string
  resetUrl: string
  expiresInMinutes?: number
}

type UserInvitationEmailParams = {
  /** Correo que fue autorizado por el administrador. */
  to: string
  /** Enlace firmado que abrirá el formulario público de autorregistro. */
  invitationUrl: string
  /** Tiempo visible para informar al destinatario sobre la vigencia. */
  expiresInHours?: number
}

type WorkOrderPdfEmailParams = {
  /** Correo registrado para el cliente propietario de la orden. */
  to: string
  /** Identificador visible en el asunto, contenido y nombre del adjunto. */
  workOrderId: number
  /** PDF generado en memoria por lib/work-order-pdf.ts. */
  pdf: Buffer
}

let smtpTransporter: ReturnType<typeof nodemailer.createTransport> | null = null

/**
 * Obtiene una variable de entorno obligatoria y evita crear el transporte o
 * enviar mensajes con una configuración incompleta.
 */
function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Falta configurar la variable de entorno ${name}`)
  }

  return value
}

/**
 * Convierte y valida el puerto SMTP configurado. Gmail utiliza el puerto 465
 * por defecto para conexiones TLS iniciadas desde el primer momento.
 */
function getSmtpPort() {
  const configuredPort = process.env.SMTP_PORT?.trim() || "465"
  const port = Number(configuredPort)

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("SMTP_PORT debe contener un puerto válido")
  }

  return port
}

/**
 * Interpreta de forma estricta la opción que determina si la conexión SMTP
 * debe utilizar TLS desde su apertura.
 */
function getSmtpSecure() {
  const configuredValue =
    process.env.SMTP_SECURE?.trim().toLowerCase() || "true"

  if (configuredValue !== "true" && configuredValue !== "false") {
    throw new Error("SMTP_SECURE debe ser true o false")
  }

  return configuredValue === "true"
}

/**
 * Crea una única instancia del transporte SMTP y la reutiliza durante la vida
 * de la función de servidor. Las credenciales solo se leen en el backend.
 */
function getSmtpTransporter() {
  if (smtpTransporter) {
    return smtpTransporter
  }

  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: getSmtpPort(),
    secure: getSmtpSecure(),
    auth: {
      user: getRequiredEnv("SMTP_USER"),
      pass: getRequiredEnv("SMTP_APP_PASSWORD"),
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  })

  return smtpTransporter
}

/**
 * Envía al usuario el enlace temporal para restablecer su contraseña. Los
 * errores del proveedor se registran en el servidor y se exponen de forma
 * genérica a la ruta que invoca esta función.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  expiresInMinutes = 30,
}: PasswordResetEmailParams) {
  try {
    await getSmtpTransporter().sendMail({
      from: getRequiredEnv("MAIL_FROM"),
      to,
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
  } catch (error) {
    console.error("[MAIL_PASSWORD_RESET]", error)
    throw new Error("No se pudo enviar el correo de recuperación")
  }
}

/**
 * Envía el enlace firmado de registro al correo autorizado por el
 * administrador. El mensaje no recibe ni almacena contraseñas temporales.
 */
export async function sendUserInvitationEmail({
  to,
  invitationUrl,
  expiresInHours = 48,
}: UserInvitationEmailParams) {
  try {
    await getSmtpTransporter().sendMail({
      from: getRequiredEnv("MAIL_FROM"),
      to,
      subject: "Invitación a Urban Cycling",
      text: [
        "Has sido invitado a crear una cuenta en Urban Cycling.",
        "",
        `Completa tu registro aquí: ${invitationUrl}`,
        `La invitación expirará en ${expiresInHours} horas.`,
        "",
        "Si no esperabas esta invitación, puedes ignorar el correo.",
      ].join("\n"),
      html: `
        <main>
          <h1>Invitación a Urban Cycling</h1>
          <p>Has sido invitado a crear una cuenta en Urban Cycling.</p>
          <p>
            <a href="${invitationUrl}">Completar mi registro</a>
          </p>
          <p>La invitación expirará en ${expiresInHours} horas.</p>
          <p>Si no esperabas esta invitación, puedes ignorar el correo.</p>
        </main>
      `,
    })
  } catch (error) {
    console.error("[MAIL_USER_INVITATION]", error)
    throw new Error("No se pudo enviar la invitación")
  }
}

/**
 * Envía al cliente el PDF ya generado de una orden de trabajo como archivo
 * adjunto mediante el mismo transporte SMTP.
 *
 * La generación del documento permanece fuera de este módulo para que el
 * correo solo se ocupe de la entrega y pueda reutilizarse desde rutas API.
 */
export async function sendWorkOrderPdfEmail({
  to,
  workOrderId,
  pdf,
}: WorkOrderPdfEmailParams) {
  try {
    await getSmtpTransporter().sendMail({
      from: getRequiredEnv("MAIL_FROM"),
      to,
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
          contentType: "application/pdf",
        },
      ],
    })
  } catch (error) {
    // El detalle queda únicamente en los logs del servidor. La ruta API
    // mantiene una respuesta genérica para no filtrar información del proveedor
    // de correo hacia el navegador.
    console.error("[MAIL_WORK_ORDER_PDF]", error)
    throw new Error("No se pudo enviar el correo con la orden de trabajo")
  }
}
