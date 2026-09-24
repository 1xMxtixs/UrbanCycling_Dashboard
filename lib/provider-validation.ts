import { z } from "zod"

import { validarYFormatearRut } from "@/lib/client-rut"

const textoRequerido = (maxLength: number) =>
  z.string().trim().min(1, "Este campo es obligatorio").max(maxLength)

const textoOpcional = (maxLength: number) =>
  z.string().trim().max(maxLength).optional()

const rutSchema = z.string().trim().transform((value, context) => {
  const result = validarYFormatearRut(value)

  if (!result.valid) {
    context.addIssue({
      code: "custom",
      message: result.error,
    })

    return z.NEVER
  }

  // Los proveedores existentes almacenan el RUT sin puntos.
  return result.compact
})

const correoProveedorSchema = z.object({
  correo: z.string().trim().email("El correo no es válido").max(255),
  descripcion: textoOpcional(50),
})

const telefonoProveedorSchema = z.object({
  telefono: textoRequerido(20),
  descripcion: textoOpcional(50),
})

const direccionProveedorSchema = z.object({
  region: textoRequerido(100),
  ciudad: textoRequerido(100),
  comuna: textoRequerido(100),
  calle: textoRequerido(150),
  numero: textoRequerido(20),
  unidad: textoOpcional(20),
  descripcion: textoOpcional(50).default(""),
})

const proveedorFieldsSchema = {
  razonSocial: textoRequerido(100),
  rut: rutSchema,
  giro: textoRequerido(100),
  condicionesDePago: textoRequerido(100),
  nombreFantasia: textoOpcional(150),
  nombreContacto: textoOpcional(100),
  direcciones: z
    .array(direccionProveedorSchema)
    .min(1, "Debe registrar al menos una dirección"),
  telefonos: z
    .array(telefonoProveedorSchema)
    .min(1, "Debe registrar al menos un teléfono"),
  correos: z
    .array(correoProveedorSchema)
    .min(1, "Debe registrar al menos un correo"),
}

export const crearProveedorSchema = z.object(proveedorFieldsSchema)

export const actualizarProveedorSchema = z
  .object(proveedorFieldsSchema)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe enviar al menos un campo para actualizar",
  })

export type CrearProveedorInput = z.infer<typeof crearProveedorSchema>
export type ActualizarProveedorInput = z.infer<
  typeof actualizarProveedorSchema
>
