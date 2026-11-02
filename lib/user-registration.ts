import { z } from "zod"

import { validarYFormatearRut } from "@/lib/client-rut"

const CONTROL_CHARACTERS_REGEX = /[\u0000-\u001F\u007F]/
const PHONE_REGEX = /^[+\d\s-]{7,20}$/

/**
 * Convierte valores ausentes o textos compuestos solo por espacios en null.
 * Permite almacenar de forma consistente los campos opcionales.
 */
function emptyToNull(value: unknown) {
  if (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null
  }

  return value
}

/**
 * Crea un campo de texto opcional que transforma valores vacíos en null y
 * limita su tamaño al máximo definido por el modelo de datos.
 */
function optionalText(maxLength: number) {
  return z.preprocess(emptyToNull, z.string().trim().max(maxLength).nullable())
}

const rutSchema = z
  .string()
  .trim()
  .transform((value, context) => {
    const result = validarYFormatearRut(value)

    if (!result.valid) {
      context.addIssue({
        code: "custom",
        message: result.error,
      })

      return z.NEVER
    }

    return result.formatted
  })

const userIdentityFields = {
  primerNombre: z.string().trim().min(1).max(50),
  segundoNombre: optionalText(50),
  apellidoPaterno: z.string().trim().min(1).max(50),
  apellidoMaterno: optionalText(50),
  rut: rutSchema,
  telefono: z.preprocess(
    emptyToNull,
    z.string().trim().regex(PHONE_REGEX).nullable()
  ),
}

const passwordFields = {
  contrasena: z
    .string()
    .min(8)
    .max(128)
    .refine((value) => !CONTROL_CHARACTERS_REGEX.test(value), {
      message: "La contraseña contiene caracteres no permitidos.",
    }),
  confirmacionContrasena: z.string(),
}

/**
 * Valida el contrato del registro administrativo y rechaza campos internos no
 * declarados, como estado, hash de contraseña, tokens o versión de sesión.
 */
export const createUserSchema = z
  .object({
    ...userIdentityFields,
    correo: z
      .string()
      .trim()
      .email()
      .max(255)
      .transform((value) => value.toLowerCase()),
    idRol: z.number().int().positive(),
    ...passwordFields,
  })
  .strict()
  .refine((data) => data.contrasena === data.confirmacionContrasena, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmacionContrasena"],
  })

/**
 * Valida los datos mínimos que un administrador debe proporcionar para emitir
 * una invitación. El correo se normaliza antes de consultar su disponibilidad.
 */
export const sendUserInvitationSchema = z
  .object({
    correo: z
      .string()
      .trim()
      .email()
      .max(255)
      .transform((value) => value.toLowerCase()),
    idRol: z.number().int().positive(),
  })
  .strict()

/**
 * Valida el autorregistro realizado desde una invitación. Correo y rol no se
 * aceptan en el cuerpo porque deben proceder exclusivamente del token firmado.
 */
export const acceptUserInvitationSchema = z
  .object({
    token: z.string().trim().min(1).max(2048),
    ...userIdentityFields,
    ...passwordFields,
  })
  .strict()
  .refine((data) => data.contrasena === data.confirmacionContrasena, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmacionContrasena"],
  })

export type CreateUserInput = z.infer<typeof createUserSchema>
export type SendUserInvitationInput = z.infer<typeof sendUserInvitationSchema>
export type AcceptUserInvitationInput = z.infer<
  typeof acceptUserInvitationSchema
>
