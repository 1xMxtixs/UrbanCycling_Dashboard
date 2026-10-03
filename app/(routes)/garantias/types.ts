
export type EstadoGarantiaCodigo =
  | "INGRESADO"
  | "EN_REVISION"
  | "EN_ESPERA"
  | "APROBADO"
  | "RECHAZADO";

export type EstadoGarantia =
  | "Ingresado"
  | "En Revisión"
  | "En espera"
  | "Aprobado"
  | "Rechazado";

export interface Garantia {
  idGarantia: number;
  idOrdenDeTrabajo: number;

  cliente: {
    idCliente: number;
    nombre: string;
    rut: string;
  };

  motivoReclamo: string;
  fechaIngreso: string;

  estado: EstadoGarantia;
  // El código canónico se usa para reglas y transiciones; el texto es solo visual.
  estadoCodigo: EstadoGarantiaCodigo;

  veredicto: "Aprobado" | "Rechazado" | null;
  observacionesResolucion: string | null;
  fechaResolucion: string | null;
}
