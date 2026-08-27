"use client";

import { useEffect, useState } from "react";
import { BikeCard } from "./BikeCard";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import { MetricCard } from "@/components/common/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Bike, Wrench, CheckCircle2, Tag } from "lucide-react";
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
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
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

  // Métricas
  const totalBikes = bicicletas.length;
  const inServiceBikes = bicicletas.filter((b) => {
    const estado = b.ordenDeTrabajo?.estadoOrden?.toLowerCase();
    return estado === "en curso" || estado === "en espera" || estado === "por realizar";
  }).length;
  const readyBikes = bicicletas.filter((b) => {
    const estado = b.ordenDeTrabajo?.estadoOrden?.toLowerCase();
    return estado === "listo para entregar" || estado === "entregado";
  }).length;
  const uniqueBrands = new Set(bicicletas.map((b) => b.marca?.toLowerCase().trim()).filter(Boolean)).size;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPIs de Flota de Bicicletas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Bicicletas"
          value={totalBikes}
          description="Vehículos registrados"
          icon={Bike}
        />
        <MetricCard
          title="En Servicio Técnico"
          value={inServiceBikes}
          description="En proceso de reparación"
          icon={Wrench}
        />
        <MetricCard
          title="Listas / Entregadas"
          value={readyBikes}
          description="Mantención finalizada"
          icon={CheckCircle2}
        />
        <MetricCard
          title="Marcas Atendidas"
          value={uniqueBrands}
          description="Diversidad de fabricantes"
          icon={Tag}
        />
      </div>

      <DataTableContainer
        title="Catálogo de Bicicletas"
        description={`${filteredBicicletas.length} ${filteredBicicletas.length === 1 ? "bicicleta encontrada" : "bicicletas encontradas"}`}
        searchPlaceholder="Buscar por marca, modelo, cliente u orden..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <div className="p-4 md:p-6">
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
    </div>
  );
}
