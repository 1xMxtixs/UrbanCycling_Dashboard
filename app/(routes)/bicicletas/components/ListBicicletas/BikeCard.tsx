"use client"

import { Bike, CalendarDays, ClipboardList, UserRound, Wrench, Palette } from "lucide-react";

import type { Bicicleta } from "./columns";

type BikeCardProps = {
  bicicleta: Bicicleta;
};

function getNombreCliente(cliente: Bicicleta["ordenDeTrabajo"]["cliente"]) {
  return (
    cliente.razonSocial ||
    [cliente.primerNombre, cliente.apellidoPaterno, cliente.apellidoMaterno]
      .filter(Boolean)
      .join(" ") ||
    "Sin cliente"
  );
}

function getEstadoClass(estado: string) {
  const normalized = estado.toLowerCase();

  if (normalized === "entregado") {
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  }

  if (normalized === "en curso") {
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
  }

  if (normalized === "listo para entregar") {
    return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
  }

  if (normalized === "en espera") {
    return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20";
  }

  // Por realizar / default
  return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20";
}

export function BikeCard({ bicicleta }: BikeCardProps) {
  const cliente = bicicleta.ordenDeTrabajo?.cliente;
  const nombreCliente = cliente ? getNombreCliente(cliente) : "Sin cliente";
  const estadoOrden = bicicleta.ordenDeTrabajo?.estadoOrden ?? "Sin estado";
  const descripcion = bicicleta.descripcion || "Sin observaciones registradas";

  return (
    <article className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-slate-300/50 dark:hover:border-slate-800/50">
      {/* Indicador de estado superior */}
      <div 
        className={`absolute top-0 left-0 right-0 h-1 z-10 ${
          estadoOrden.toLowerCase() === "entregado" ? "bg-emerald-500" :
          estadoOrden.toLowerCase() === "en curso" ? "bg-blue-500" :
          estadoOrden.toLowerCase() === "listo para entregar" ? "bg-amber-500" :
          estadoOrden.toLowerCase() === "en espera" ? "bg-yellow-500" :
          "bg-slate-400"
        }`} 
      />

      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-950">
        {bicicleta.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bicicleta.imagenUrl}
            alt={`${bicicleta.marca} ${bicicleta.modelo}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 text-slate-400">
            <Bike className="h-12 w-12 stroke-[1.5] transition-transform duration-500 group-hover:scale-110" />
            <span className="text-xs font-medium tracking-wide">Sin imagen</span>
          </div>
        )}

        <div className="absolute left-3 top-4 rounded-full bg-slate-950/80 backdrop-blur-sm px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
          Orden #{bicicleta.idOrdenDeTrabajo}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 transition-colors group-hover:text-primary">
            {bicicleta.marca} {bicicleta.modelo}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Palette className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>Color: <strong className="font-semibold text-foreground/80">{bicicleta.color}</strong></span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <UserRound className="h-4 w-4 shrink-0 text-muted-foreground stroke-[1.5]" />
            <span className="line-clamp-1 font-medium">{nombreCliente}</span>
          </div>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${getEstadoClass(
              estadoOrden
            )}`}
          >
            {estadoOrden}
          </span>
        </div>
      </div>

      {/* Slide-up Panel Glassmorphic en Hover */}
      <div className="absolute inset-x-0 bottom-0 h-[80%] translate-y-full rounded-t-2xl border-t border-white/10 bg-slate-950/90 p-5 text-white backdrop-blur-md transition-transform duration-300 ease-out group-hover:translate-y-0 flex flex-col justify-between shadow-2xl">
        <div className="space-y-4 overflow-hidden flex flex-col h-full">
          <div className="flex items-center gap-2 text-primary border-b border-white/10 pb-2">
            <Wrench className="h-4 w-4 text-blue-400 stroke-[2]" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Observaciones del Taller
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 text-sm text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
            {descripcion}
          </div>

          <div className="border-t border-white/10 pt-3 space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <UserRound className="h-4 w-4 shrink-0 text-slate-400 stroke-[1.5]" />
              <span className="line-clamp-1 font-medium">
                {nombreCliente}
                {cliente?.rut ? <span className="text-slate-500 font-normal"> ({cliente.rut})</span> : ""}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <ClipboardList className="h-4 w-4 shrink-0 text-slate-400 stroke-[1.5]" />
              <span>Orden de Trabajo: <strong className="font-semibold text-white">#{bicicleta.idOrdenDeTrabajo}</strong></span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <CalendarDays className="h-4 w-4 shrink-0 text-slate-400 stroke-[1.5]" />
              <span>Estado: <strong className="font-semibold text-white">{estadoOrden}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
