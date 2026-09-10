export interface SaleClient {
  idCliente?: number;
  tipoCliente?: string;
  primerNombre?: string | null;
  segundoNombre?: string | null;
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  razonSocial?: string | null;
  rut?: string;
}

export interface SaleProductLine {
  idLineaDeVenta: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number | string;
  producto?: {
    idProducto?: number;
    nombre: string;
    precioVenta?: number;
  } | null;
}

export interface SaleDetails {
  idVenta: number;
  idUsuario?: number;
  idCliente?: number | null;
  montoTotalNeto?: number | string;
  montoIva?: number | string;
  total: number | string;
  estado?: string;
  lineasDeVenta?: SaleProductLine[];
}

export interface SaleOperation {
  idPuntoVenta: number | string;
  tipoOperacion: "venta";
  total: number | string;
  montoTotal?: number | string;
  estadoPago: string;
  estadoVenta: string;
  fechaCreacion: string;
  fechaRegistro?: string;
  cliente?: SaleClient | null;
  usuario?: any;
  venta: SaleDetails;
}
