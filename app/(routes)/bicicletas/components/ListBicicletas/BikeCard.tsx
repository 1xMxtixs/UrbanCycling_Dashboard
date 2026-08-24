"use client";

import { Bike, CalendarDays, ClipboardList, UserRound, Wrench, Palette } from "lucide-react";
import { StatusBadge, type StatusType } from "@/components/common/StatusBadge";
import { DataField } from "@/components/common/DataField";
import { formatClientName } from "@/lib/formatters";
import type { Bicicleta } from "../../types";

type BikeCardProps = {
  bicicleta: Bicicleta;
};

function mapEstadoToStatusType(estado: string): StatusType {
  const normalized = estado.toLowerCase();
  if (normalized === "entregado") return "success";
  if (normalized === "en curso") return "info";
  if (normalized === "listo para entregar" || normalized === "en espera") return "warning";
  return "neutral";
}

export function BikeCard({ bicicleta }: BikeCardProps) {
  const cliente = bicicleta.ordenDeTrabajo?.cliente;
  const nombreCliente = formatClientName(cliente);
  const estadoOrden = bicicleta.ordenDeTrabajo?.estadoOrden ?? "Sin estado";
  const descripcion = bicicleta.descripcion || "Sin observaciones registradas";
  const statusType = mapEstadoToStatusType(estadoOrden);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50 flex flex-col justify-between">
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
          {bicicleta.imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bicicleta.imagenUrl}
              alt={`${bicicleta.marca} ${bicicleta.modelo}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Bike className="h-12 w-12 stroke-[1.5] text-muted-foreground/60" />
              <span className="text-xs font-medium">Sin imagen adjunta</span>
            </div>
          )}

          <div className="absolute left-3 top-3 rounded-full bg-background/85 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground border border-border/80 shadow-2xs">
            Orden #{bicicleta.idOrdenDeTrabajo}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-base font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {bicicleta.marca} {bicicleta.modelo}
            </h3>
            <DataField
              variant="inline"
              icon={Palette}
              label="Color"
              value={bicicleta.color}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <DataField
              variant="inline"
              icon={UserRound}
              value={nombreCliente}
              valueClassName="line-clamp-1 font-semibold"
            />
            <StatusBadge status={statusType} label={estadoOrden} />
          </div>
        </div>
      </div>

      {/* Slide-up Drawer en Hover */}
      <div className="absolute inset-x-0 bottom-0 h-[82%] translate-y-full rounded-t-2xl border-t border-border/80 bg-background/95 p-4.5 backdrop-blur-md transition-transform duration-300 ease-out group-hover:translate-y-0 flex flex-col justify-between shadow-2xl">
        <div className="space-y-3 overflow-hidden flex flex-col h-full">
          <div className="flex items-center gap-2 text-primary border-b border-border/60 pb-2">
            <Wrench className="h-4 w-4 stroke-[2]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Diagnóstico & Taller
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 text-xs text-muted-foreground leading-relaxed">
            {descripcion}
          </div>

          <div className="border-t border-border/60 pt-2.5 space-y-2 text-xs">
            <DataField
              variant="inline"
              icon={UserRound}
              value={nombreCliente}
              secondaryValue={cliente?.rut ? `(${cliente.rut})` : undefined}
            />
            <DataField
              variant="inline"
              icon={ClipboardList}
              label="Orden"
              value={`#${bicicleta.idOrdenDeTrabajo}`}
            />
            <div className="flex items-center justify-between text-foreground pt-0.5">
              <span className="text-xs text-muted-foreground font-medium">Estado actual:</span>
              <StatusBadge status={statusType} label={estadoOrden} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
