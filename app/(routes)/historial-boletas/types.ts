export interface DocumentoTributario {
  idDocumentoTributario: number;
  tipoMovimiento: string;
  tipoDte: number;
  numeroFolio: number;
  rutEmisor: string;
  rutReceptor: string;
  fechaEmision: string;
  montoSubtotal: number | string;
  descuentoAcumulado: number | string;
  montoTotal: number | string;
  montoNeto: number | string;
  montoIva: number | string;
  estado: string;
  urlPdf?: string | null;
}

export interface KpiSummary {
  total: number;
  emitidos: number;
}
