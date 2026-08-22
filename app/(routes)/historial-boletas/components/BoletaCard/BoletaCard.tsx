"use client";

import { CalendarDays, Eye, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import type { DocumentoTributario } from "../../types";

interface BoletaCardProps {
  doc: DocumentoTributario;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("T")[0].split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number | string) {
  return Number(value || 0).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
  });
}

function getTipoDteLabel(tipo: number) {
  return tipo === 39 ? "Boleta" : tipo === 33 ? "Factura" : `DTE ${tipo}`;
}

export function BoletaCard({ doc }: BoletaCardProps) {
  const isEmitido = doc.estado.toLowerCase() === "emitido";

  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-xs lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-semibold text-[10px] uppercase">
            {getTipoDteLabel(doc.tipoDte)}
          </Badge>
          <StatusBadge
            status={isEmitido ? "success" : "danger"}
            label={doc.estado}
          />
          <span className="text-xs text-muted-foreground font-mono">
            Folio #{doc.numeroFolio}
          </span>
        </div>
        <h4 className="text-base font-bold text-foreground truncate">
          {doc.tipoMovimiento}
        </h4>
        <p className="text-xs text-muted-foreground">
          Emisor: <span className="font-medium text-foreground">{doc.rutEmisor}</span> · Receptor:{" "}
          <span className="font-medium text-foreground">{doc.rutReceptor}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-4 lg:justify-end">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>{formatDate(doc.fechaEmision)}</span>
        </div>

        <div className="text-sm font-bold text-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
          {formatCurrency(doc.montoTotal)}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalles">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Enviar por correo">
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
