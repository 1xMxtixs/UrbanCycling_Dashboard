import crypto from "crypto"
import { z } from "zod"

const INVITATION_DURATION_SECONDS = 48 * 60 * 60
const BASE64URL_REGEX = /^[A-Za-z0-9_-]+$/

const invitationPayloadSchema = z
  .object({
    version: z.literal(1),
    purpose: z.literal("USER_INVITATION"),
    email: z.string().email(),
    idRol: z.number().int().positive(),
    invitedBy: z.number().int().positive(),
    invitationId: z.string().uuid(),
    issuedAt: z.number().int().positive(),
    expiresAt: z.number().int().positive(),
  })
  .strict()

export type InvitationPayload = z.infer<typeof invitationPayloadSchema>
export type InvitationTokenErrorCode =
  | "INVITACION_INVALIDA"
  | "INVITACION_EXPIRADA"

/**
 * Representa fallos esperados al comprobar una invitación recibida desde el
 * navegador, sin exponer detalles criptográficos en las respuestas públicas.
 */
export class InvitationTokenError extends Error {
  constructor(public readonly code: InvitationTokenErrorCode) {
    super(code)
    this.name = "InvitationTokenError"
  }
}

/**
 * Obtiene la clave exclusiva de invitaciones y exige una longitud mínima para
 * evitar que el servidor genere firmas con secretos débiles.
 */
function getInvitationSecret() {
  const secret = process.env.INVITATION_TOKEN_SECRET?.trim()

  if (!secret || secret.length < 32) {
    throw new Error(
      "INVITATION_TOKEN_SECRET debe contener al menos 32 caracteres."
    )
  }

  return secret
}

/**
 * Firma el contenido codificado mediante HMAC-SHA256. La firma evita que el
 * cliente modifique el correo, el rol, el emisor o la fecha de expiración.
 */
function signPayload(encodedPayload: string) {
  return crypto
    .createHmac("sha256", getInvitationSecret())
    .update(encodedPayload)
    .digest()
}

/**
 * Genera una invitación autocontenida con vigencia de 48 horas. No crea una
 * fila de usuario ni persiste el token en la base de datos.
 */
export function createInvitationToken(input: {
  email: string
  idRol: number
  invitedBy: number
}) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const payload: InvitationPayload = {
    version: 1,
    purpose: "USER_INVITATION",
    email: input.email.toLowerCase(),
    idRol: input.idRol,
    invitedBy: input.invitedBy,
    invitationId: crypto.randomUUID(),
    issuedAt,
    expiresAt: issuedAt + INVITATION_DURATION_SECONDS,
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  )
  const signature = signPayload(encodedPayload).toString("base64url")

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.expiresAt * 1000),
  }
}

/**
 * Comprueba estructura, firma, propósito y vigencia del token. La firma se
 * compara en tiempo constante antes de interpretar los datos del payload.
 */
export function verifyInvitationToken(token: string): InvitationPayload {
  const parts = token.split(".")

  if (
    parts.length !== 2 ||
    !parts[0] ||
    !parts[1] ||
    !BASE64URL_REGEX.test(parts[0]) ||
    !BASE64URL_REGEX.test(parts[1])
  ) {
    throw new InvitationTokenError("INVITACION_INVALIDA")
  }

  const [encodedPayload, encodedSignature] = parts
  const expectedSignature = signPayload(encodedPayload)
  let receivedSignature: Buffer

  try {
    receivedSignature = Buffer.from(encodedSignature, "base64url")
  } catch {
    throw new InvitationTokenError("INVITACION_INVALIDA")
  }

  if (
    expectedSignature.length !== receivedSignature.length ||
    !crypto.timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    throw new InvitationTokenError("INVITACION_INVALIDA")
  }

  let decodedPayload: unknown

  try {
    decodedPayload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    )
  } catch {
    throw new InvitationTokenError("INVITACION_INVALIDA")
  }

  const validation = invitationPayloadSchema.safeParse(decodedPayload)

  if (!validation.success) {
    throw new InvitationTokenError("INVITACION_INVALIDA")
  }

  const currentTimestamp = Math.floor(Date.now() / 1000)

  if (validation.data.issuedAt > currentTimestamp + 60) {
    throw new InvitationTokenError("INVITACION_INVALIDA")
  }

  if (validation.data.expiresAt <= currentTimestamp) {
    throw new InvitationTokenError("INVITACION_EXPIRADA")
  }

  return validation.data
}
