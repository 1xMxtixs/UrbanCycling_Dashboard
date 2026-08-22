export interface WorkOrderClient {
  idCliente?: number;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  razonSocial?: string | null;
  rut?: string;
  tipoCliente?: string;
}

export interface WorkOrderBike {
  idBicicleta: number;
  marca: string;
  modelo: string;
  color: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
}

export interface WorkOrderServiceLine {
  idLineaDeOrdenDeTrabajo: number;
  idOrdenDeTrabajo?: number;
  idServicio?: number | null;
  idProducto?: number | null;
  cantidad: number;
  precioUnitario: number | string;
  servicio?: {
    idServicio?: number;
    nombre: string;
    precioVenta?: number;
  } | null;
  producto?: {
    idProducto?: number;
    nombre: string;
    precioVenta?: number;
  } | null;
}

export interface WorkOrderPayment {
  idPago?: number;
  metodoPago: string;
  monto: number | string;
  fechaRegistro: string;
  estado?: string;
  tipoAbono?: string;
}

export interface WorkOrder {
  idOrdenDeTrabajo: number;
  idVenta?: number;
  idUsuario?: number;
  idCliente?: number;
  estadoOrden: string;
  estadoPago?: string;
  fechaCreacion?: string | Date;
  fechaRecepcion?: string | Date;
  fechaEntregaEstimada: string | Date;
  fechaEntregaReal?: string | Date | null;
  observacionesIngreso?: string | null;
  total: number | string;
  descuento?: number;
  totalPagado?: number | string;
  cliente?: WorkOrderClient | null;
  bicicletas?: WorkOrderBike[];
  lineasDeOrdenDeTrabajo?: WorkOrderServiceLine[];
  pagos?: WorkOrderPayment[];
}
