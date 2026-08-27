"use client";

import { CalendarDays, Eye, Mail, Receipt, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import type { DocumentoTributario } from "../../types";

interface BoletaCardProps {
  doc: DocumentoTributario;
}

function formatDate(value: string) {
  if (!value) return "Sin fecha";
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
  return tipo === 39 ? "Boleta Electrónica" : tipo === 33 ? "Factura Electrónica" : `DTE Tipo ${tipo}`;
}

export function BoletaCard({ doc }: BoletaCardProps) {
  const isEmitido = doc.estado.toLowerCase() === "emitido";

  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 lg:flex-row lg:items-center lg:justify-between shadow-2xs">
      <div className="space-y-2 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-md font-bold text-[10px] tracking-wide uppercase px-2 bg-primary/10 text-primary border border-primary/20">
            {getTipoDteLabel(doc.tipoDte)}
          </Badge>
          <StatusBadge
            status={isEmitido ? "success" : "danger"}
            label={doc.estado}
          />
          <span className="text-xs font-mono font-bold text-foreground px-2 py-0.5 rounded-md bg-muted/60 border border-border/60">
            Folio N° {doc.numeroFolio}
          </span>
        </div>

        <h4 className="text-sm sm:text-base font-bold text-foreground truncate flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary shrink-0" />
          <span>{doc.tipoMovimiento || "Venta de Productos y Servicios"}</span>
        </h4>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <p>
            RUT Emisor: <span className="font-semibold text-foreground font-mono">{doc.rutEmisor}</span>
          </p>
          <span>•</span>
          <p>
            RUT Receptor: <span className="font-semibold text-foreground font-mono">{doc.rutReceptor}</span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4 lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-border/60">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-2 rounded-xl border border-border/60">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(doc.fechaEmision)}</span>
        </div>

        <div className="flex flex-col text-right px-3.5 py-1.5 rounded-xl bg-primary/5 border border-primary/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total DTE
          </span>
          <span className="text-base font-extrabold text-foreground tracking-tight">
            {formatCurrency(doc.montoTotal)}
          </span>
        </div>
      </div>
    </article>
  );
}
