"use client";

import Link from "next/link";
import {
  Bike,
  UserRound,
  Wrench,
  Palette,
  ExternalLink,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { DataField } from "@/components/common/DataField";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatClientName } from "@/lib/formatters";
import {
  ESTADO_OT,
  ESTADOS_OT_CERRADOS,
  getNombreEstadoOt,
  isOrdenTrabajoRetrasada,
  getOtStatusBadgeVariant,
  type EstadoOt,
} from "@/lib/work-order-status";
import type { Bicicleta } from "../../types";

type BikeCardProps = {
  bicicleta: Bicicleta;
};

const ETIQUETA_CORTA_ESTADO: Partial<Record<string, string>> = {
  [ESTADO_OT.LISTO_PARA_ENTREGAR]: "Por entregar",
};

export function BikeCard({ bicicleta }: BikeCardProps) {
  const cliente = bicicleta.ordenDeTrabajo?.cliente;
  const nombreCliente = formatClientName(cliente);
  const estadoOrden = bicicleta.ordenDeTrabajo?.estadoOrden ?? "Sin estado";
  const nombreEstado = getNombreEstadoOt(
    estadoOrden,
    bicicleta.ordenDeTrabajo?.estadoOrdenNombre
  );
  const etiquetaBadge = ETIQUETA_CORTA_ESTADO[estadoOrden] ?? nombreEstado;
  const retrasada = isOrdenTrabajoRetrasada(
    estadoOrden,
    bicicleta.ordenDeTrabajo?.fechaEntregaEstimada
  );
  const descripcion = bicicleta.descripcion || "Sin observaciones registradas";
  const statusType = getOtStatusBadgeVariant(estadoOrden);
  const estadoFinalizado = ESTADOS_OT_CERRADOS.includes(estadoOrden as EstadoOt);
  const mostrarPuntoEstado = Boolean(bicicleta.ordenDeTrabajo?.estadoOrden) && !estadoFinalizado;

  return (
    <article className="group relative @container flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
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
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Bike className="h-10 w-10 stroke-[1.5] text-muted-foreground/50" />
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

      <div className="flex flex-1 flex-col gap-3 p-4">
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

        <div className="border-t border-border/60 pt-3">
          <DataField
            variant="inline"
            icon={UserRound}
            value={nombreCliente}
            secondaryValue={cliente?.rut ? `(${cliente.rut})` : undefined}
            className="min-w-0"
            valueClassName="truncate"
          />
        </div>

        <div className="mt-auto grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border/60 pt-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Ver diagnóstico"
                className="group/button -ml-2 h-8 min-w-0 max-w-full shrink-0 justify-start gap-1.5 px-2 text-xs text-muted-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
              >
                <Wrench className="h-3.5 w-3.5 text-primary" />
                <span className="truncate @max-[17rem]:hidden">Diagnóstico</span>
                <ChevronDown className="h-3.5 w-3.5 transition-transform motion-reduce:transition-none group-data-[state=open]/button:rotate-180" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={8}
              collisionPadding={16}
              className="w-80 max-w-[calc(100vw-2rem)] p-3"
            >
              <div className="flex items-center gap-2 border-b border-border/60 pb-2 text-primary">
                <Wrench className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Diagnóstico & Taller
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto whitespace-pre-wrap pr-1 text-xs leading-relaxed text-muted-foreground">
                {descripcion}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex shrink-0 items-center gap-1.5">
            {retrasada && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    aria-label="Entrega retrasada"
                    className="flex items-center"
                    tabIndex={0}
                  >
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Entrega retrasada</TooltipContent>
              </Tooltip>
            )}
            <span title={nombreEstado} className="flex items-center">
              <StatusBadge
                status={statusType}
                label={etiquetaBadge}
                showDot={mostrarPuntoEstado}
                animateDot={mostrarPuntoEstado}
                className="h-5 whitespace-nowrap"
              />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
