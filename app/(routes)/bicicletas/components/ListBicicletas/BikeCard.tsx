"use client"

import { Bike, CalendarDays, ClipboardList, UserRound } from "lucide-react";

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

  if (normalized.includes("entregado")) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalized.includes("curso")) {
    return "bg-blue-100 text-blue-700";
  }

  if (normalized.includes("listo")) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

export function BikeCard({ bicicleta }: BikeCardProps) {
  const cliente = bicicleta.ordenDeTrabajo?.cliente;
  const nombreCliente = cliente ? getNombreCliente(cliente) : "Sin cliente";
  const estadoOrden = bicicleta.ordenDeTrabajo?.estadoOrden ?? "Sin estado";
  const descripcion = bicicleta.descripcion || "Sin descripcion registrada";

  return (
    <article className="group relative overflow-hidden rounded-lg border bg-background shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {bicicleta.imagenUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bicicleta.imagenUrl}
            alt={`${bicicleta.marca} ${bicicleta.modelo}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
            <Bike className="h-12 w-12" />
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
        )}

        <div className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold text-white">
          Orden #{bicicleta.idOrdenDeTrabajo}
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold">
            {bicicleta.marca} {bicicleta.modelo}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Color: {bicicleta.color}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserRound className="h-4 w-4 shrink-0" />
          <span className="line-clamp-1">{nombreCliente}</span>
        </div>

        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoClass(
            estadoOrden
          )}`}
        >
          {estadoOrden}
        </span>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/70 to-black/20 p-4 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase text-white/65">
              Observaciones
            </p>
            <p className="mt-1 line-clamp-4 text-sm leading-relaxed">
              {descripcion}
            </p>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-white/70" />
              <span className="line-clamp-1">
                {nombreCliente}
                {cliente?.rut ? ` - ${cliente.rut}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-white/70" />
              <span>Orden #{bicicleta.idOrdenDeTrabajo}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-white/70" />
              <span>{estadoOrden}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
