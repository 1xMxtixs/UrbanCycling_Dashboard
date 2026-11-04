export interface Client {
  idCliente: number
  tipoCliente: string
  rut: string
  primerNombre: string | null
  segundoNombre: string | null
  apellidoPaterno: string | null
  apellidoMaterno: string | null
  razonSocial: string | null
}

export interface DocumentoTributario {
  idDocumentoTributario: number
  tipoMovimiento?: string
  tipoDte: number
  numeroFolio: number
  rutEmisor: string
  rutReceptor?: string
  fechaEmision: string
  montoSubtotal?: number | string
  descuentoAcumulado?: number | string
  montoTotal: number | string
  montoNeto: number | string
  montoIva: number | string
  estado?: string
  urlPdf?: string | null
}
