"use client";

import { useEffect, useState } from "react";
import { BikeCard } from "./BikeCard";
import { EmptyState } from "@/components/EmptyState";
import { DataTableContainer } from "@/components/DataTableContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { Bike } from "lucide-react";
import { formatClientName } from "@/lib/formatters";
import type { Bicicleta } from "../../types";

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
      <div className="rounded-xl border bg-card p-6 shadow-xs">
        <Skeleton className="mb-3 h-5 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
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
          cliente ? formatClientName(cliente) : "",
          cliente?.rut,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
    : bicicletas;

  return (
    <DataTableContainer
      title="Bicicletas en Taller e Inventario"
      description={`${filteredBicicletas.length} ${filteredBicicletas.length === 1 ? "bicicleta encontrada" : "bicicletas encontradas"}`}
      searchPlaceholder="Buscar por marca, modelo, cliente u orden..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-4">
        {filteredBicicletas.length === 0 ? (
          <EmptyState
            icon={Bike}
            title="No se encontraron bicicletas"
            description={
              search
                ? "No hay resultados que coincidan con tu criterio de búsqueda."
                : "Aún no hay bicicletas registradas en el sistema."
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBicicletas.map((bicicleta) => (
              <BikeCard key={bicicleta.idBicicleta} bicicleta={bicicleta} />
            ))}
          </div>
        )}
      </div>
    </DataTableContainer>
  );
}
