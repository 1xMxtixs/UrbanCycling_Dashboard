"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BikeCard } from "./BikeCard";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import { MetricCard } from "@/components/common/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bike, Wrench, CheckCircle2, Tag, RefreshCw } from "lucide-react";
import { formatClientName } from "@/lib/formatters";
import type { Bicicleta } from "../../types";
import {
  ESTADO_OT,
  ESTADOS_OT_FINALIZADOS,
  getNombreEstadoOtVisible,
  type EstadoOt,
} from "@/lib/work-order-status";

export function ListBicicletas() {
  const [bicicletas, setBicicletas] = useState<Bicicleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchBicicletas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bicycles", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("No fue posible cargar el catálogo de bicicletas.");
      }

      const data = (await response.json()) as Bicicleta[];
      setBicicletas(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al cargar las bicicletas."
      );
      setBicicletas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/bicycles", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("No fue posible cargar el catálogo de bicicletas.");
        }
        const data = (await response.json()) as Bicicleta[];
        if (isMounted) {
          setBicicletas(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Ocurrió un error inesperado al cargar las bicicletas."
          );
          setBicicletas([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    const handleRefresh = () => {
      void fetchBicicletas();
    };

    window.addEventListener("bicicletas:refresh", handleRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener("bicicletas:refresh", handleRefresh);
    };
  }, [fetchBicicletas]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredBicicletas = useMemo(() => {
    if (!normalizedSearch) return bicicletas;
    return bicicletas.filter((bicicleta) => {
      const cliente = bicicleta.ordenDeTrabajo?.cliente;
      const estadoVisible = bicicleta.ordenDeTrabajo
        ? getNombreEstadoOtVisible(
            bicicleta.ordenDeTrabajo.estadoOrden,
            bicicleta.ordenDeTrabajo.fechaEntregaEstimada,
            bicicleta.ordenDeTrabajo.estadoOrdenNombre
          )
        : "";

      const searchableText = [
        bicicleta.idOrdenDeTrabajo,
        bicicleta.marca,
        bicicleta.modelo,
        bicicleta.color,
        bicicleta.descripcion,
        bicicleta.ordenDeTrabajo?.estadoOrden,
        estadoVisible,
        cliente ? formatClientName(cliente) : "",
        cliente?.rut,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [bicicletas, normalizedSearch]);

  // Métricas
  const totalBikes = bicicletas.length;
  const inServiceBikes = bicicletas.filter((b) => {
    const estado = b.ordenDeTrabajo?.estadoOrden;
    return (
      estado === ESTADO_OT.EN_CURSO ||
      estado === ESTADO_OT.EN_ESPERA ||
      estado === ESTADO_OT.POR_REALIZAR
    );
  }).length;
  const readyBikes = bicicletas.filter((b) => {
    const estado = b.ordenDeTrabajo?.estadoOrden as EstadoOt | undefined;
    return estado ? ESTADOS_OT_FINALIZADOS.includes(estado) : false;
  }).length;
  const uniqueBrands = new Set(
    bicicletas.map((b) => b.marca?.toLowerCase().trim()).filter(Boolean)
  ).size;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton de KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={`metric-skeleton-${i}`} className="h-24 rounded-2xl" />
          ))}
        </div>

        {/* Skeleton de DataTableContainer y Grilla de Tarjetas */}
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="space-y-4 p-5 md:p-6 border-b border-border/60 bg-muted/15">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-9.5 w-full rounded-xl" />
          </div>

          <div className="p-4 md:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={`card-skeleton-${i}`}
                  className="rounded-2xl border border-border/80 bg-card overflow-hidden space-y-3 p-0"
                >
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                    <div className="pt-2 border-t border-border/60 flex justify-between items-center">
                      <Skeleton className="h-4 w-24 rounded-md" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner de error cuando hay fallo */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between text-card-foreground">
          <div>
            <p className="font-semibold text-destructive">
              No fue posible cargar el catálogo de bicicletas
            </p>
            <p className="text-xs text-destructive/90">{error}</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchBicicletas()}
            className="border-destructive/30 hover:bg-destructive/10 text-destructive cursor-pointer shrink-0"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Reintentar
          </Button>
        </div>
      )}

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
          {error && bicicletas.length === 0 ? (
            <EmptyState
              icon={Bike}
              title="Error al cargar bicicletas"
              description={error}
              action={
                <Button
                  variant="outline"
                  onClick={() => void fetchBicicletas()}
                  className="cursor-pointer gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </Button>
              }
            />
          ) : filteredBicicletas.length === 0 ? (
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
