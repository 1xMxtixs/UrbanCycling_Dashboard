export type Profile = {
  idUsuario: number
  primerNombre: string
  segundoNombre: string | null
  apellidoPaterno: string
  apellidoMaterno: string | null
  rut: string
  correo: string | null
  telefono: string | null
  estado: string
  rol: { idRol: number; nombre: string; descripcion: string | null }
}

export type EditableField =
  | "primerNombre"
  | "segundoNombre"
  | "apellidoPaterno"
  | "apellidoMaterno"
  | "correo"
  | "telefono"

export type FormValues = Record<EditableField, string>
export type FieldError = EditableField | "contrasenaActual"
export type PasswordField = "contrasenaActual" | "contrasenaNueva" | "confirmacionContrasena"
export type PasswordValues = Record<PasswordField, string>

