
export type EstadoGarantia =
  | "Ingresado"
  | "En Revisión"
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
  observaciones: string | null;

  estado: EstadoGarantia;

  veredicto: "Aprobado" | "Rechazado" | null;
  observacionesResolucion: string | null;
  fechaResolucion: string | null;
}
