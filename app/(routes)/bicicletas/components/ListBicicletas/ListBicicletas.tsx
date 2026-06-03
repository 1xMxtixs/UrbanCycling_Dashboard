"use client"

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";

import { BikeCard } from "./BikeCard";
import type { Bicicleta } from "./columns";

function getNombreCliente(cliente: Bicicleta["ordenDeTrabajo"]["cliente"]) {
  return (
    cliente.razonSocial ||
    [cliente.primerNombre, cliente.apellidoPaterno, cliente.apellidoMaterno]
      .filter(Boolean)
      .join(" ") ||
    "Sin cliente"
  );
}

export function ListBicicletas() {
  const [bicicletas, setBicicletas] = useState<Bicicleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchBicicletas = async () => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/bicycles", { cache: "no-store" });

        if (!response.ok) {
          setBicicletas([]);
          return;
        }

        const data = (await response.json()) as Bicicleta[];
        setBicicletas(data);
      } catch {
        setBicicletas([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBicicletas();
    window.addEventListener("bicicletas:refresh", fetchBicicletas);

    return () => {
      window.removeEventListener("bicicletas:refresh", fetchBicicletas);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-background p-6 text-sm text-muted-foreground shadow-md animate-pulse">
        Cargando bicicletas...
      </div>
    );
  }

  const normalizedSearch = search.trim().toLowerCase();
  const filteredBicicletas = normalizedSearch
    ? bicicletas.filter((bicicleta) => {
        const cliente = bicicleta.ordenDeTrabajo?.cliente;
        const searchableText = [
          bicicleta.idOrdenDeTrabajo,
          bicicleta.marca,
          bicicleta.modelo,
          bicicleta.color,
          bicicleta.descripcion,
          bicicleta.ordenDeTrabajo?.estadoOrden,
          cliente ? getNombreCliente(cliente) : "",
          cliente?.rut,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
    : bicicletas;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="rounded-lg bg-background p-4 shadow-md">
        <Input
          placeholder="Buscar por marca, modelo, cliente u orden..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          {filteredBicicletas.length} bicicletas encontradas
        </p>
      </div>

      {filteredBicicletas.length === 0 ? (
        <div className="rounded-lg border bg-background p-8 text-center text-sm text-muted-foreground shadow-sm">
          No hay bicicletas registradas.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredBicicletas.map((bicicleta) => (
            <BikeCard key={bicicleta.idBicicleta} bicicleta={bicicleta} />
          ))}
        </div>
      )}
    </div>
  );
}
