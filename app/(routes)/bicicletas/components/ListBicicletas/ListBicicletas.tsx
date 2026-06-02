"use client"

import { type Bicicleta } from "./columns";

type ListBicicletasProps = {
  bicicletas: Bicicleta[];
};

export function ListBicicletas({ bicicletas }: ListBicicletasProps) {
  if (!bicicletas.length) {
    return (
      <div className="rounded-lg bg-background p-6 text-sm text-muted-foreground shadow-md">
        No hay bicicletas registradas.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {bicicletas.map((bicicleta) => (
        <article key={bicicleta.id} className="overflow-hidden rounded-3xl border bg-background p-4 shadow-sm">
          <div className="mb-4 h-56 overflow-hidden rounded-3xl bg-slate-100">
            {bicicleta.imagen ? (
              <img
                src={bicicleta.imagen}
                alt={`${bicicleta.marca} ${bicicleta.modelo}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Sin imagen
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Marca</p>
              <p className="text-base font-semibold">{bicicleta.marca}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Modelo</p>
              <p className="text-base">{bicicleta.modelo}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Color</p>
              <p className="text-base">{bicicleta.color}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</p>
              <p className="text-base">{bicicleta.cliente ?? "Sin cliente"}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Descripción</p>
              <p className="text-sm text-muted-foreground">{bicicleta.descripcion}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
