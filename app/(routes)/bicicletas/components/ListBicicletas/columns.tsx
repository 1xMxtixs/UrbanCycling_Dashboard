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
    cliente: {
      primerNombre: string | null;
      apellidoPaterno: string | null;
      apellidoMaterno: string | null;
      razonSocial: string | null;
      rut: string;
    };
  };
};
