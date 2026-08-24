"use client";

import { useEffect, useMemo, useState } from "react";
import { Receipt, Search, Download } from "lucide-react";
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
import { KpiCards } from "../KpiCards";
import { BoletaCard } from "../BoletaCard";
import type { DocumentoTributario } from "../../types";

function formatCurrency(value: number | string) {
  return Number(value || 0).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
  });
}

function getTipoDteLabel(tipo: number) {
  return tipo === 39 ? "Boleta" : tipo === 33 ? "Factura" : `DTE ${tipo}`;
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

  useEffect(() => {
    let mounted = true;

    async function loadDocuments() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/documentos-tributarios", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No fue posible cargar el historial");
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
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error inesperado");
          setDocuments([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDocuments();

    return () => {
      mounted = false;
    };
  }, []);

  const boletas = useMemo(
    () => documents.filter((doc) => doc.tipoDte === 39),
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

  const filteredDocuments = useMemo(() => {
    return boletas.filter((doc) => {
      const matchesSearch =
        doc.numeroFolio.toString().includes(searchTerm) ||
        doc.rutReceptor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.rutEmisor.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "todos" ||
        doc.estado.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [boletas, searchTerm, filterStatus]);

  const handleExportCSV = () => {
    if (filteredDocuments.length === 0) return;

    const headers =
      "Tipo DTE,Folio,RUT Emisor,RUT Receptor,Fecha Emision,Monto Total,Estado\n";
    const rows = filteredDocuments
      .map(
        (doc) =>
          `${getTipoDteLabel(doc.tipoDte)},${doc.numeroFolio},${doc.rutEmisor},${doc.rutReceptor},${doc.fechaEmision},${doc.montoTotal},${doc.estado}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "historial_boletas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Tarjetas de Resumen KPI */}
      <KpiCards
        total={formatCurrency(summary.total)}
        emitidos={summary.emitidos}
        neto={formatCurrency(summary.neto)}
        iva={formatCurrency(summary.iva)}
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar por RUT o Folio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9.5 rounded-xl bg-background border-border/80 text-xs"
                />
              </div>

              <div className="w-full sm:w-48 shrink-0">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9.5 rounded-xl bg-background border-border/80 text-xs">
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
              <Download className="h-4 w-4 mr-1.5" />
              Exportar CSV
            </Button>
          </div>
        }
      >
        <div className="p-4 md:p-6">
          {error ? (
            <div className="text-destructive text-xs bg-destructive/10 p-3 rounded-xl border border-destructive/20">
              {error}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No se encontraron boletas"
              description={
                boletas.length === 0
                  ? "Aún no hay boletas electrónicas emitidas en el sistema."
                  : "No se encontraron comprobantes que coincidan con los filtros ingresados."
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
