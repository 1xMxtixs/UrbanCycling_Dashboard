export type Bicicleta = {
  idBicicleta: number;
  idOrdenDeTrabajo: number;
  marca: string;
  modelo: string;
  color: string;
  descripcion: string | null;
  imagenUrl: string | null;
  ordenDeTrabajo: {
    estadoOrden: string;
    estadoPago?: string;
    total?: number;
    cliente: {
      primerNombre: string | null;
      apellidoPaterno: string | null;
      apellidoMaterno: string | null;
      razonSocial: string | null;
      rut: string;
    };
  };
};

export type OrdenTrabajoResumen = {
  idOrdenDeTrabajo: number;
  estadoOrden: string;
  estadoPago: string;
  total: number;
  cliente: {
    razonSocial: string | null;
    primerNombre: string | null;
    apellidoPaterno: string | null;
    apellidoMaterno: string | null;
    rut: string;
  };
  bicicletas?: Array<{ marca: string; modelo: string }>;
};
