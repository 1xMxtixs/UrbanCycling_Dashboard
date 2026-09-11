export type ClienteNatural = {
  id: number;
  nombre: string;
  apellido: string;
  rut: string;
  telefono: string;
  estado: string;
};

export type ClienteJuridica = {
  id: number;
  nombre: string;
  giro: string;
  nombreContacto: string;
  rut: string;
  telefono: string;
  estado: string;
};

export interface DBTelefonoCliente {
  idTelefonoCliente: number;
  idCliente: number;
  telefono: string;
  descripcion?: string | null;
}

export interface DBCorreoCliente {
  idCorreoCliente: number;
  idCliente: number;
  correo: string;
  descripcion?: string | null;
}

export interface DBDireccionCliente {
  idDireccionCliente: number;
  idCliente: number;
  region: string;
  ciudad: string;
  comuna: string;
  calle: string;
  numero: string;
  unidad?: string | null;
}

export interface DBOrdenTrabajoCliente {
  idOrdenDeTrabajo: number;
  idUsuario: number;
  idCliente: number;
  fechaRecepcion: string;
  fechaEntregaEstimada: string;
  fechaEntregaReal?: string | null;
  observacionesIngreso?: string | null;
  total: number | string;
  descuento: number;
  estadoPago: string;
  estadoOrden: string;
  fechaCreacion: string;
}

export interface DBCliente {
  idCliente: number;
  tipoCliente: string;
  rut: string;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  razonSocial?: string | null;
  giro?: string | null;
  nombreContacto?: string | null;
  correo?: string | null;
  estado: string;
  fechaCreacion: string;
  telefonos: DBTelefonoCliente[];
  correos: DBCorreoCliente[];
  direcciones: DBDireccionCliente[];
  ordenesDeTrabajo: DBOrdenTrabajoCliente[];
}

export interface ClientesTableMeta {
  onViewDetails?: (id: number) => void;
  onViewHistory?: (id: number) => void;
}
