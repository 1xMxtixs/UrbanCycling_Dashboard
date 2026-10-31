"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Receipt, Search, Download, RotateCcw } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatCLP } from "@/lib/formatters";
import { normalizeSearchText } from "@/lib/search-normalization";
import { getTipoDteLabel, TIPO_DTE } from "@/lib/tax-document";
import { KpiCards } from "../KpiCards";
import { BoletaCard } from "../BoletaCard";
import type { DocumentoTributario } from "../../types";

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

  // HB-01: Recarga manual para botón Reintentar
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

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
    const total = boletas.reduce(
      (acc, item) => acc + Number(item.montoTotal || 0),
      0
    );
    const neto = boletas.reduce(
      (acc, item) => acc + Number(item.montoNeto || 0),
      0
    );
    const iva = boletas.reduce(
      (acc, item) => acc + Number(item.montoIva || 0),
      0
    );
    const emitidos = boletas.filter(
      (item) => item.estado.toLowerCase() === "emitido"
    ).length;

    return { total, neto, iva, emitidos };
  }, [boletas]);

  // HB-06: Búsqueda normalizada tolerante a mayúsculas, acentos y formatos de RUT
  const filteredDocuments = useMemo(() => {
    const q = normalizeSearchText(searchTerm);
    const cleanQ = q.replace(/[^0-9kK]/g, "");

    return boletas.filter((doc) => {
      const folioStr = String(doc.numeroFolio);
      const rutReceptor = normalizeSearchText(doc.rutReceptor);
      const cleanReceptor = rutReceptor.replace(/[^0-9kK]/g, "");
      const rutEmisor = normalizeSearchText(doc.rutEmisor);
      const cleanEmisor = rutEmisor.replace(/[^0-9kK]/g, "");

      const matchesSearch =
        !q ||
        folioStr.includes(q) ||
        rutReceptor.includes(q) ||
        rutEmisor.includes(q) ||
        (cleanQ.length > 0 &&
          (cleanReceptor.includes(cleanQ) || cleanEmisor.includes(cleanQ)));

      const matchesStatus =
        filterStatus === "todos" ||
        doc.estado.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [boletas, searchTerm, filterStatus]);

  // HB-13: Toast de confirmación al exportar CSV
  const handleExportCSV = () => {
    if (filteredDocuments.length === 0) return;

    const headers =
      "Tipo DTE,Folio,RUT Emisor,RUT Receptor,Fecha Emision,Monto Total,Estado\n";
    const rows = filteredDocuments
      .map(
        (doc) =>
          `"${getTipoDteLabel(doc.tipoDte)}",${doc.numeroFolio},"${doc.rutEmisor}","${doc.rutReceptor}","${doc.fechaEmision}",${doc.montoTotal},"${doc.estado}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `historial_boletas_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Historial de boletas exportado correctamente en formato CSV.");
  };

  // HB-10: Skeleton estructurado para evitar layout shift
  if (loading) {
    return (
      <div className="w-full space-y-6 animate-pulse motion-reduce:animate-none">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={`kpi-skeleton-${i}`} className="h-24 rounded-2xl" />
          ))}
        </div>

        <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
          <div className="p-5 md:p-6 border-b border-border/60 bg-muted/15 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-64 rounded-lg" />
              <Skeleton className="h-4 w-44 rounded-md" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-9.5 w-full sm:w-64 rounded-xl" />
              <Skeleton className="h-9.5 w-full sm:w-48 rounded-xl" />
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-3.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={`boleta-skeleton-${i}`}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-2xl border border-border/70 bg-card"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-28 rounded-lg" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-lg" />
                  </div>
                  <Skeleton className="h-5 w-48 rounded" />
                  <Skeleton className="h-4 w-64 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-28 rounded-xl" />
                  <Skeleton className="h-12 w-32 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300 motion-reduce:animate-none">
      {/* HB-01: Banner de error no destructivo con reintento */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-destructive">
              Error al cargar el historial de boletas
            </p>
            <p className="text-xs text-destructive/90">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl cursor-pointer"
            onClick={() => void loadDocuments()}
          >
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      )}

      {/* Tarjetas de Resumen KPI (HB-04 & HB-08: 4 métricas constantes) */}
      <KpiCards
        total={formatCLP(summary.total)}
        emitidos={summary.emitidos}
        neto={formatCLP(summary.neto)}
        iva={formatCLP(summary.iva)}
      />

      {/* Contenedor Estandarizado */}
      <DataTableContainer
        title="Historial de Boletas Electrónicas"
        description={`${filteredDocuments.length} ${
          filteredDocuments.length === 1
            ? "documento encontrado"
            : "documentos encontrados"
        }`}
        toolbar={
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                {/* HB-02: aria-label en input de búsqueda */}
                <Input
                  placeholder="Buscar por RUT o Folio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Buscar boletas por RUT o número de folio"
                  className="pl-9 h-9.5 rounded-xl bg-background border-border/80 text-xs shadow-2xs focus-visible:ring-primary/30"
                />
              </div>

              <div className="w-full sm:w-48 shrink-0">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  {/* HB-02: aria-label en selector de estado */}
                  <SelectTrigger
                    aria-label="Filtrar por estado del documento"
                    className="h-9.5 rounded-xl bg-background border-border/80 text-xs shadow-2xs cursor-pointer"
                  >
                    <SelectValue placeholder="Estado: Todos" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border-border/80">
                    <SelectItem value="todos" className="text-xs">Todos los estados</SelectItem>
                    <SelectItem value="emitido" className="text-xs">Emitidos</SelectItem>
                    <SelectItem value="anulado" className="text-xs">Anulados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredDocuments.length === 0}
              className="rounded-xl font-semibold shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Exportar CSV
            </Button>
          </div>
        }
      >
        <div className="p-4 md:p-6">
          {filteredDocuments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={searchTerm || filterStatus !== "todos" ? "Sin resultados" : "No hay boletas registradas"}
              description={
                searchTerm || filterStatus !== "todos"
                  ? "No se encontraron comprobantes que coincidan con los filtros ingresados."
                  : "Aún no hay boletas electrónicas emitidas en el sistema."
              }
            />
          ) : (
            <div className="space-y-3.5">
              {filteredDocuments.map((doc) => (
                <BoletaCard key={doc.idDocumentoTributario} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </DataTableContainer>
    </div>
  );
}
