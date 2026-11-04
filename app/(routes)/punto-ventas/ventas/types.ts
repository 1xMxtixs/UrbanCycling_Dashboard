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
  usuario?: {
    idUsuario?: number;
    primerNombre?: string | null;
    apellidoPaterno?: string | null;
    apellidoMaterno?: string | null;
    correoElectronico?: string | null;
  } | null;
  venta: SaleDetails;
}

export type { DocumentoTributario } from "../types"

export interface SaleCreationResult {
  idPuntoVenta?: number | string | null;
  venta?: SaleDetails | null;
  ordenTrabajo?: unknown;
}

export interface ReceiptLine {
  cantidad: number;
  precioUnitario: number | string;
  servicio?: { nombre?: string | null } | null;
  producto?: { nombre?: string | null } | null;
}
