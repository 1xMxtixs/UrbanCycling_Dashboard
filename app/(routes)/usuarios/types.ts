export type Role = {
  idRol: number;
  nombre: string;
  descripcion: string;
};

export type User = {
  idUsuario: number;
  rut: string;
  primerNombre: string;
  segundoNombre: string | null;
  apellidoPaterno: string;
  apellidoMaterno: string;
  correoElectronico: string;
  estado: string;
  fechaCreacion: string;
  ultimoAcceso: string | null;
  rol: Role;
};

export const PENDING_ROLE_NAME = "Sin Rol";
