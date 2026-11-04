"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Receipt, Search, Download, RotateCcw, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCLP } from "@/lib/formatters";
import { normalizeSearchText } from "@/lib/search-normalization";
import { TIPO_DTE } from "@/lib/tax-document";
import { validarYFormatearRut } from "@/lib/client-rut";
import { KpiCards } from "../KpiCards";
import type { DocumentoTributario } from "../../types";
import { RowActionsMenu } from "@/components/common/RowActionsMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceiptTicketPreview } from "@/components/common/ReceiptTicketPreview";

const PAGE_SIZE = 10;

function getOrigenLabel(tipoMovimiento: string): string {
  const normalized = tipoMovimiento
    .trim()
    .toLocaleLowerCase("es-CL")
    .replace(/[-_]+/g, " ");

  if (!normalized) return "Documento tributario";
  if (normalized.includes("orden")) return "Orden de trabajo";
  if (normalized.includes("venta")) return "Venta en mostrador";

  return normalized.charAt(0).toLocaleUpperCase("es-CL") + normalized.slice(1);
}

function formatRut(value: string): string {
  const result = validarYFormatearRut(value);
  return result.valid ? result.formatted : value;
}

function normalizeSearch(value: string): string {
  return normalizeSearchText(value).replace(/[.\-\s]/g, "");
}

function formatDate(value: string): string {
  if (!value) return "Sin fecha";
  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  if (!year || !month || !day) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getLocalDateStamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDocument(raw: Record<string, unknown>): DocumentoTributario {
  return {
    idDocumentoTributario: Number(raw.idDocumentoTributario ?? 0),
    tipoMovimiento: String(raw.tipoMovimiento ?? ""),
    tipoDte: Number(raw.tipoDte ?? 0),
    numeroFolio: Number(raw.numeroFolio ?? 0),
    rutEmisor: String(raw.rutEmisor ?? ""),
    rutReceptor: String(raw.rutReceptor ?? ""),
    fechaEmision: String(raw.fechaEmision ?? raw.fechaRegistro ?? ""),
    montoSubtotal: Number(raw.montoSubtotal ?? 0),
    descuentoAcumulado: Number(raw.descuentoAcumulado ?? 0),
    montoTotal: Number(raw.montoTotal ?? 0),
    montoNeto: Number(raw.montoNeto ?? 0),
    montoIva: Number(raw.montoIva ?? 0),
    estado: String(raw.estado ?? "Emitido"),
    urlPdf: raw.urlPdf ? String(raw.urlPdf) : null,
  };
}

export function ListHistorialBoletas() {
  const [documents, setDocuments] = useState<DocumentoTributario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [page, setPage] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<DocumentoTributario | null>(null);
  const [downloadDocument, setDownloadDocument] = useState<DocumentoTributario | null>(null);
  const downloadPreviewRef = useRef<HTMLDivElement>(null);

  // HB-01: Recarga manual para botón Reintentar
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setPage(0);

      const response = await fetch("/api/documentos-tributarios", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("No fue posible cargar el historial de documentos tributarios.");
      }

      const result = await response.json();
      const apiDocuments = Array.isArray(result)
        ? result
        : Array.isArray(result?.documentosTributarios)
          ? result.documentosTributarios
          : [];

      setDocuments(
        apiDocuments.map((item: unknown) =>
          normalizeDocument(item as Record<string, unknown>)
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado al cargar documentos.");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial canónica sin setState síncrono en effect
  useEffect(() => {
    let mounted = true;

    fetch("/api/documentos-tributarios", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No fue posible cargar el historial de documentos tributarios.");
        }
        const result = await response.json();
        if (mounted) {
          const apiDocuments = Array.isArray(result)
            ? result
            : Array.isArray(result?.documentosTributarios)
              ? result.documentosTributarios
              : [];

          setDocuments(
            apiDocuments.map((item: unknown) =>
              normalizeDocument(item as Record<string, unknown>)
            )
          );
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Error inesperado al cargar documentos."
          );
          setDocuments([]);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const boletas = useMemo(
    () => documents.filter((doc) => doc.tipoDte === TIPO_DTE.BOLETA),
    [documents]
  );

  const summary = useMemo(() => {
    const issued = boletas.filter(
      (item) => item.estado.trim().toLowerCase() === "emitido"
    );
    const total = issued.reduce(
      (acc, item) => acc + Number(item.montoTotal || 0),
      0
    );
    const neto = issued.reduce(
      (acc, item) => acc + Number(item.montoNeto || 0),
      0
    );
    const iva = issued.reduce(
      (acc, item) => acc + Number(item.montoIva || 0),
      0
    );
    return { total, neto, iva, emitidos: issued.length };
  }, [boletas]);

  // HB-06: Búsqueda normalizada tolerante a mayúsculas, acentos y formatos de RUT
  const filteredDocuments = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    const filtered = boletas.filter((doc) => {
      const matchesSearch = !query || [
        String(doc.numeroFolio),
        doc.rutReceptor,
        doc.rutEmisor,
      ].some((value) => normalizeSearch(value).includes(query));
      const matchesStatus =
        filterStatus === "todos" ||
        doc.estado.trim().toLowerCase() === filterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const timestampA = Date.parse(a.fechaEmision);
      const timestampB = Date.parse(b.fechaEmision);
      const dateA = Number.isNaN(timestampA) ? Number.NEGATIVE_INFINITY : timestampA;
      const dateB = Number.isNaN(timestampB) ? Number.NEGATIVE_INFINITY : timestampB;
      return dateB - dateA || b.numeroFolio - a.numeroFolio;
    });
  }, [boletas, searchTerm, filterStatus]);

  const issuerRuts = useMemo(
    () => new Set(boletas.map((doc) => doc.rutEmisor.trim()).filter(Boolean)),
    [boletas]
  );
  const singleIssuerRut = issuerRuts.size === 1 ? Array.from(issuerRuts)[0] : null;
  const totalPages = Math.ceil(filteredDocuments.length / PAGE_SIZE);
  const paginatedDocuments = filteredDocuments.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  const handleExportExcel = async () => {
    if (filteredDocuments.length === 0) return;

    try {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Urban Cycling";
      workbook.created = new Date();

      const worksheet = workbook.addWorksheet("Historial de boletas", {
        properties: { tabColor: { argb: "FF004D70" } },
        views: [{ state: "frozen", ySplit: 4 }],
      });
      const headers = [
        "Folio",
        "Origen",
        "RUT emisor",
        "RUT receptor",
        "Fecha de emisión",
        "Estado",
        "Subtotal (CLP)",
        "Descuento (CLP)",
        "Neto (CLP)",
        "IVA (CLP)",
        "Total (CLP)",
      ];
      worksheet.columns = [
        { key: "folio", width: 12 },
        { key: "origen", width: 25 },
        { key: "rutEmisor", width: 18 },
        { key: "rutReceptor", width: 18 },
        { key: "fechaEmision", width: 19 },
        { key: "estado", width: 16 },
        { key: "subtotal", width: 19 },
        { key: "descuento", width: 19 },
        { key: "neto", width: 19 },
        { key: "iva", width: 19 },
        { key: "total", width: 20 },
      ];

      worksheet.mergeCells("A1:K1");
      const title = worksheet.getCell("A1");
      title.value = "Historial de boletas";
      title.font = { name: "Aptos Display", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
      title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004D70" } };
      title.alignment = { vertical: "middle" };
      worksheet.getRow(1).height = 34;

      worksheet.mergeCells("A2:K2");
      const subtitle = worksheet.getCell("A2");
      subtitle.value = `Se incluyeron ${filteredDocuments.length} ${filteredDocuments.length === 1 ? "boleta" : "boletas"}. Exportado el ${new Intl.DateTimeFormat("es-CL").format(new Date())}.`;
      subtitle.font = { name: "Aptos", size: 10, color: { argb: "FF526579" } };
      subtitle.alignment = { vertical: "middle" };
      worksheet.getRow(2).height = 22;

      worksheet.addRow([]);
      const headerRow = worksheet.addRow(headers);
      headerRow.height = 26;
      headerRow.eachCell((cell) => {
        cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF316B82" } };
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = { bottom: { style: "medium", color: { argb: "FF004D70" } } };
      });

      filteredDocuments.forEach((doc, index) => {
        const datePart = doc.fechaEmision.split("T")[0];
        const [year, month, day] = datePart.split("-").map(Number);
        const row = worksheet.addRow({
          folio: doc.numeroFolio,
          origen: getOrigenLabel(doc.tipoMovimiento),
          rutEmisor: formatRut(doc.rutEmisor),
          rutReceptor: formatRut(doc.rutReceptor),
          fechaEmision: year && month && day ? new Date(year, month - 1, day) : doc.fechaEmision,
          estado: doc.estado,
          subtotal: Number(doc.montoSubtotal),
          descuento: Number(doc.descuentoAcumulado),
          neto: Number(doc.montoNeto),
          iva: Number(doc.montoIva),
          total: Number(doc.montoTotal),
        });
        row.height = 22;
        row.eachCell((cell) => {
          cell.font = { name: "Aptos", size: 10, color: { argb: "FF263746" } };
          cell.alignment = { vertical: "middle" };
          cell.border = { bottom: { style: "hair", color: { argb: "FFDCE5EA" } } };
          if (index % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F7F9" } };
          }
        });
        row.getCell(5).numFmt = "dd/mm/yyyy";
        for (let column = 7; column <= 11; column += 1) {
          row.getCell(column).numFmt = '"$"#,##0;[Red]-"$"#,##0';
          row.getCell(column).alignment = { vertical: "middle", horizontal: "right" };
        }
        const statusCell = row.getCell(6);
        statusCell.font = {
          name: "Aptos",
          size: 10,
          bold: true,
          color: { argb: doc.estado.trim().toLowerCase() === "emitido" ? "FF15803D" : "FFB42318" },
        };
      });

      worksheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: worksheet.rowCount, column: 11 },
      };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([new Uint8Array(buffer)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `historial_boletas_${getLocalDateStamp(new Date())}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success("Historial de boletas exportado a Excel.");
    } catch {
      toast.error("No fue posible exportar el historial a Excel.");
    }
  };

  const handleDownloadPdf = async (doc: DocumentoTributario) => {
    setDownloadDocument(doc);
  };

  useEffect(() => {
    if (!downloadDocument || !downloadPreviewRef.current) return;

    let isCurrent = true;
    const generatePdf = async () => {
      try {
        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
          import("html2canvas-pro"),
          import("jspdf"),
        ]);
        const preview = downloadPreviewRef.current;
        if (!preview) return;

        const canvas = await html2canvas(preview, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: null,
        });
        if (!isCurrent) return;

        const receiptWidth = 80;
        const receiptHeight = (canvas.height / canvas.width) * receiptWidth;
        const pdf = new jsPDF({ unit: "mm", format: [receiptWidth, receiptHeight] });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, receiptWidth, receiptHeight);
        pdf.save(`boleta_${downloadDocument.numeroFolio}.pdf`);
        toast.success(`Boleta N° ${downloadDocument.numeroFolio} descargada en PDF.`);
      } catch {
        if (isCurrent) toast.error("No fue posible generar el PDF de la boleta.");
      } finally {
        if (isCurrent) setDownloadDocument(null);
      }
    };

    void generatePdf();
    return () => { isCurrent = false; };
  }, [downloadDocument]);

  // HB-10: Skeleton estructurado para evitar layout shift
  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse motion-reduce:animate-none">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={`kpi-skeleton-${i}`} className="h-24 rounded-2xl" />
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="space-y-4 border-b border-border/60 bg-muted/15 p-5 md:p-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-64 rounded-lg" />
              <Skeleton className="h-4 w-44 rounded-md" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-9.5 w-full rounded-xl sm:w-64" />
              <Skeleton className="h-9.5 w-full rounded-xl sm:w-48" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 6 }, (_, index) => (
                  <TableHead key={`boleta-skeleton-head-${index}`}>
                    <Skeleton className="h-3 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }, (_, rowIndex) => (
                <TableRow key={`boleta-skeleton-row-${rowIndex}`}>
                  {Array.from({ length: 6 }, (_, cellIndex) => (
                    <TableCell key={`boleta-skeleton-cell-${rowIndex}-${cellIndex}`}>
                      <Skeleton className="h-4 w-20 max-w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      <KpiCards
        total={formatCLP(summary.total)}
        emitidos={summary.emitidos}
        neto={formatCLP(summary.neto)}
        iva={formatCLP(summary.iva)}
      />

      <DataTableContainer
        title="Boletas emitidas"
        description={`${filteredDocuments.length} ${
          filteredDocuments.length === 1
            ? "documento encontrado"
            : "documentos encontrados"
        }${singleIssuerRut ? ` · Emisor ${formatRut(singleIssuerRut)}` : ""}`}
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Buscar por RUT o Folio..."
                  value={searchTerm}
                  onChange={(event) => {
                    setPage(0);
                    setSearchTerm(event.target.value);
                  }}
                  aria-label="Buscar boletas por RUT o número de folio"
                  className="h-10 w-full rounded-xl border-border/80 bg-background pl-10 text-sm shadow-2xs focus-visible:ring-primary/30"
                />
              </div>

              <div className="w-full shrink-0 sm:w-56">
                <Select
                  value={filterStatus}
                  onValueChange={(value) => {
                    setPage(0);
                    setFilterStatus(value);
                  }}
                >
                  <SelectTrigger
                    aria-label="Filtrar por estado del documento"
                    className="h-10 data-[size=default]:h-10 w-full rounded-xl border-border/80 bg-background text-sm shadow-2xs sm:w-56"
                  >
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="emitido">Emitidos</SelectItem>
                  <SelectItem value="anulado">Anulados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleExportExcel()}
              disabled={filteredDocuments.length === 0}
              className="shrink-0 self-start rounded-xl font-semibold cursor-pointer sm:self-auto"
            >
              <Download className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Exportar Excel
            </Button>
          </div>
        }
        footer={filteredDocuments.length > 0 ? (
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Página {page + 1} de {totalPages}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                disabled={page >= totalPages - 1}
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : undefined}
      >
        {error ? (
          <div className="p-6">
            <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-destructive">Error al cargar el historial de boletas</p>
                <p className="text-xs text-destructive/90">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 cursor-pointer rounded-xl"
                onClick={() => void loadDocuments()}
              >
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Receipt}
              title={searchTerm || filterStatus !== "todos" ? "Sin resultados" : "No hay boletas registradas"}
              description={
                searchTerm || filterStatus !== "todos"
                  ? "No se encontraron comprobantes que coincidan con los filtros ingresados."
                  : "Aún no hay boletas electrónicas emitidas en el sistema."
              }
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 sm:px-4">Folio</TableHead>
                <TableHead className="px-2 sm:px-4">Origen</TableHead>
                {issuerRuts.size > 1 && (
                  <TableHead className="hidden px-2 sm:px-4 lg:table-cell">Emisor</TableHead>
                )}
                <TableHead className="px-2 sm:px-4">Receptor</TableHead>
                <TableHead className="hidden px-2 sm:px-4 md:table-cell">Emisión</TableHead>
                <TableHead className="px-2 sm:px-4">Estado</TableHead>
                <TableHead className="px-2 text-right sm:px-4">Total</TableHead>
                <TableHead className="w-24 min-w-24 whitespace-nowrap px-2 text-right sm:px-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocuments.map((doc) => {
                const isIssued = doc.estado.trim().toLowerCase() === "emitido";

                return (
                  <TableRow key={doc.idDocumentoTributario}>
                    <TableCell className="px-2 sm:px-4">
                      <span className="font-mono text-sm font-semibold tabular-nums">
                        N° {doc.numeroFolio}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 sm:px-4">
                      <span className="text-sm text-foreground">{getOrigenLabel(doc.tipoMovimiento)}</span>
                    </TableCell>
                    {issuerRuts.size > 1 && (
                      <TableCell className="hidden px-2 sm:px-4 lg:table-cell">
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {formatRut(doc.rutEmisor)}
                        </span>
                      </TableCell>
                    )}
                    <TableCell className="px-2 sm:px-4">
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatRut(doc.rutReceptor)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden px-2 sm:px-4 md:table-cell">
                      <span className="text-sm text-muted-foreground">{formatDate(doc.fechaEmision)}</span>
                    </TableCell>
                    <TableCell className="px-2 sm:px-4">
                      <StatusBadge
                        status={isIssued ? "success" : "danger"}
                        label={doc.estado}
                        showDot={false}
                      />
                    </TableCell>
                    <TableCell className="px-2 text-right sm:px-4">
                      <span className="text-sm font-bold tabular-nums">
                        {formatCLP(Number(doc.montoTotal))}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 text-right sm:px-4">
                      <RowActionsMenu
                          ariaLabel={`Acciones para boleta ${doc.numeroFolio}`}
                          groups={[
                            {
                              actions: [
                                {
                                  label: "Ver detalle",
                                  icon: Eye,
                                  onSelect: () => setSelectedDocument(doc),
                                },
                                {
                                  label: "Descargar PDF",
                                  icon: Download,
                                  onSelect: () => void handleDownloadPdf(doc),
                                },
                              ],
                            },
                          ]}
                        />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DataTableContainer>

      <Dialog open={!!selectedDocument} onOpenChange={(open) => { if (!open) setSelectedDocument(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selectedDocument && (
            <>
              <DialogHeader>
                <DialogTitle>Detalle de boleta N° {selectedDocument.numeroFolio}</DialogTitle>
                <DialogDescription>
                  Información del documento tributario emitido.
                </DialogDescription>
              </DialogHeader>
              <ReceiptTicketPreview receipt={selectedDocument} />
              <div className="flex justify-end">
                <Button type="button" onClick={() => void handleDownloadPdf(selectedDocument)} className="cursor-pointer">
                  <Download className="mr-1 h-4 w-4" aria-hidden="true" />
                  Descargar PDF
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {downloadDocument && (
        <div aria-hidden="true" className="pointer-events-none fixed left-[-10000px] top-0 w-80">
          <div ref={downloadPreviewRef}>
            <ReceiptTicketPreview receipt={downloadDocument} />
          </div>
        </div>
      )}
    </div>
  );
}
