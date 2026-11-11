export type Role = {
  idRol: number
  nombre: string
  descripcion: string | null
}

export type User = {
  idUsuario: number
  idRol: number
  rut: string
  primerNombre: string
  segundoNombre: string | null
  apellidoPaterno: string
  apellidoMaterno: string | null
  correoElectronico: string | null
  telefono?: string | null
  estado: string
  fechaCreacion: string
  ultimoAcceso: string | null
  rol: Role
}

export const PENDING_ROLE_NAME = "Sin Rol"
