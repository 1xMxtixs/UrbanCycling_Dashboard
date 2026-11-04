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

export type VeredictoGarantia = "Aprobado" | "Rechazado";

export interface RawGarantiaBackend {
  idGarantia?: number | string;
  idReclamoGarantia?: number | string;
  idOrdenDeTrabajo?: number;
  idVenta?: number | null;
  cliente?: {
    idCliente?: number;
    nombre?: string;
    rut?: string;
  };
  estado?: unknown;
  motivoReclamo?: string;
  motivo?: string;
  observacionesResolucion?: string | null;
  justificacionResolucion?: string | null;
  veredicto?: string | null;
  fechaIngreso?: string;
  fechaRegistro?: string;
  fechaResolucion?: string | null;
  [key: string]: unknown;
}

export interface Garantia {
  idGarantia: number;
  idOrdenDeTrabajo: number;
  idVenta?: number | null;

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

  veredicto: VeredictoGarantia | null;
  observacionesResolucion: string | null;
  fechaResolucion: string | null;
}
