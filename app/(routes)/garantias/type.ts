export type EstadoGarantia = "Pendiente" | "Aprobada" | "Rechazada";

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

  veredicto: string | null;
  observacionesResolucion: string | null;
  fechaResolucion: string | null;
}