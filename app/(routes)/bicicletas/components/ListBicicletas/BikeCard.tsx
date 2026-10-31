"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bike,
  UserRound,
  Wrench,
  Palette,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataField } from "@/components/common/DataField";
import { Button } from "@/components/ui/button";
import { formatClientName } from "@/lib/formatters";
import { getNombreEstadoOtVisible, getOtStatusBadgeVariant } from "@/lib/work-order-status";
import { cn } from "@/lib/utils";
import type { Bicicleta } from "../../types";

type BikeCardProps = {
  bicicleta: Bicicleta;
};

export function BikeCard({ bicicleta }: BikeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const cliente = bicicleta.ordenDeTrabajo?.cliente;
  const nombreCliente = formatClientName(cliente);
  const estadoOrden = bicicleta.ordenDeTrabajo?.estadoOrden ?? "Sin estado";
  const estadoOrdenNombre = getNombreEstadoOtVisible(
    estadoOrden,
    bicicleta.ordenDeTrabajo?.fechaEntregaEstimada,
    bicicleta.ordenDeTrabajo?.estadoOrdenNombre
  );
  const descripcion = bicicleta.descripcion || "Sin observaciones de taller registradas.";
  const statusType = getOtStatusBadgeVariant(estadoOrden);

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 flex flex-col justify-between">
      <div>
        {/* Contenedor de Fotografía y Badge de Orden */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
          {bicicleta.imagenUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bicicleta.imagenUrl}
              alt={`${bicicleta.marca} ${bicicleta.modelo}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <Bike className="h-12 w-12 stroke-[1.5] text-muted-foreground/60" />
              <span className="text-xs font-medium">Sin imagen adjunta</span>
            </div>
          )}

          {/* Badge de Orden accesible como enlace */}
          <Link
            href={`/punto-ventas/ordenes-trabajo?search=${bicicleta.idOrdenDeTrabajo}`}
            className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-foreground border border-border/80 shadow-2xs hover:bg-background hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            title={`Ir a orden #${bicicleta.idOrdenDeTrabajo}`}
            aria-label={`Ver orden de trabajo #${bicicleta.idOrdenDeTrabajo}`}
          >
            <span>Orden #{bicicleta.idOrdenDeTrabajo}</span>
            <ExternalLink className="h-3 w-3 stroke-[2]" />
          </Link>
        </div>

        {/* Ficha Principal de la Bicicleta */}
        <div className="space-y-3 p-4">
          <div className="space-y-1">
            <h3 className="line-clamp-1 text-base font-bold tracking-tight text-foreground">
              {bicicleta.marca} {bicicleta.modelo}
            </h3>
            <DataField
              variant="inline"
              icon={Palette}
              label="Color"
              value={bicicleta.color}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-t border-border/60 pt-3">
            <DataField
              variant="inline"
              icon={UserRound}
              value={nombreCliente}
              secondaryValue={cliente?.rut ? `(${cliente.rut})` : undefined}
              className="min-w-0 flex-1"
              valueClassName="line-clamp-1 font-semibold"
            />
            <StatusBadge
              status={statusType}
              label={estadoOrdenNombre}
              className="h-auto min-h-5 max-w-full whitespace-normal overflow-visible text-center leading-tight"
            />
          </div>

          {/* Diagnóstico & Observaciones expandible (soporte touch, móvil y teclado) */}
          {showDetails && (
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3 text-xs animate-in fade-in slide-in-from-top-1 duration-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Wrench className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Diagnóstico & Taller</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {descripcion}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Barra de Acciones Inferior */}
      <div className="flex items-center justify-between border-t border-border/60 bg-muted/10 p-3 gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer gap-1 px-2"
          aria-expanded={showDetails}
          aria-label={showDetails ? "Ocultar diagnóstico" : "Ver diagnóstico"}
        >
          <Wrench className="h-3.5 w-3.5 text-primary" />
          <span>{showDetails ? "Ocultar notas" : "Diagnóstico"}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200",
              showDetails && "rotate-180"
            )}
          />
        </Button>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold rounded-xl border-border/80 hover:bg-primary/10 hover:text-primary hover:border-primary/40 cursor-pointer gap-1.5"
        >
          <Link
            href={`/punto-ventas/ordenes-trabajo?search=${bicicleta.idOrdenDeTrabajo}`}
            aria-label={`Ver orden #${bicicleta.idOrdenDeTrabajo}`}
          >
            <span>Ver orden</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
