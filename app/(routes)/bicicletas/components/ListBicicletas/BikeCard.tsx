"use client";

import { Bike, CalendarDays, ClipboardList, UserRound, Wrench, Palette } from "lucide-react";
import { StatusBadge, type StatusType } from "@/components/StatusBadge";
import { DataField } from "@/components/DataField";
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
    <article className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-primary/40 flex flex-col justify-between">
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {bicicleta.imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bicicleta.imagenUrl}
              alt={`${bicicleta.marca} ${bicicleta.modelo}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Bike className="h-12 w-12 stroke-[1.5]" />
              <span className="text-xs font-medium">Sin imagen</span>
            </div>
          )}

          <div className="absolute left-3 top-3 rounded-full bg-background/80 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground border shadow-xs">
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

          <div className="flex items-center justify-between border-t pt-3">
            <DataField
              variant="inline"
              icon={UserRound}
              value={nombreCliente}
              valueClassName="line-clamp-1 font-medium"
            />
            <StatusBadge status={statusType} label={estadoOrden} />
          </div>
        </div>
      </div>

      {/* Slide-up Panel informativo en Hover */}
      <div className="absolute inset-x-0 bottom-0 h-[80%] translate-y-full rounded-t-xl border-t bg-background/95 p-4 backdrop-blur-md transition-transform duration-300 ease-out group-hover:translate-y-0 flex flex-col justify-between shadow-xl">
        <div className="space-y-3 overflow-hidden flex flex-col h-full">
          <div className="flex items-center gap-2 text-primary border-b pb-2">
            <Wrench className="h-4 w-4 stroke-[2]" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Observaciones del Taller
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 text-xs text-muted-foreground leading-relaxed">
            {descripcion}
          </div>

          <div className="border-t pt-2.5 space-y-2 text-xs">
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
            <div className="flex items-center justify-between text-foreground">
              <DataField
                variant="inline"
                icon={CalendarDays}
                label="Estado"
                value=""
              />
              <StatusBadge status={statusType} label={estadoOrden} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
