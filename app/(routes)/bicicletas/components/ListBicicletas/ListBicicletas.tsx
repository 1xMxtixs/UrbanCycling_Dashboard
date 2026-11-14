"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BikeCard } from "./BikeCard";
import { FormEditBicicleta } from "../FormEditBicicleta/FormEditBicicleta";
import { ModalDetalleBicicleta } from "../ModalDetalleBicicleta";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTableContainer } from "@/components/common/DataTableContainer";
import { MetricCard } from "@/components/common/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Bike,
  Wrench,
  CheckCircle2,
  Tag,
  RefreshCw,
  Search,
} from "lucide-react";
import { formatClientName } from "@/lib/formatters";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Bicicleta, OrdenTrabajoResumen } from "../../types";
import {
  normalizarOrdenesAbiertas,
  ordenAbierta,
  solicitarBicicletaApi,
} from "../../lib/bicycle-editor";
import { useUserPermissions } from "@/components/providers";
import { PERMISSIONS } from "@/lib/permissions";
import {
  ESTADO_OT,
  ESTADOS_OT_FINALIZADOS,
  NOMBRES_ESTADO_OT,
  getNombreEstadoOtVisible,
  type EstadoOt,
} from "@/lib/work-order-status";

export function ListBicicletas() {
  const { hasPermission } = useUserPermissions();
  const canEdit = hasPermission(PERMISSIONS.BICYCLES_UPDATE);
  const peticionOrdenes = useRef(0);
  const peticionBicicletas = useRef(0);
  const [bicicletas, setBicicletas] = useState<Bicicleta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("all");
  const [selectedBicicleta, setSelectedBicicleta] = useState<Bicicleta | null>(
    null
  );
  const [openEditModal, setOpenEditModal] = useState(false);
  const [detalleBicicleta, setDetalleBicicleta] = useState<Bicicleta | null>(null);
  const [openDetalleModal, setOpenDetalleModal] = useState(false);
  const [ordenes, setOrdenes] = useState<OrdenTrabajoResumen[]>([]);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [errorOrdenes, setErrorOrdenes] = useState<string | null>(null);

  const fetchBicicletas = useCallback(async () => {
    const peticion = ++peticionBicicletas.current;
    setError(null);

    try {
      const response = await fetch("/api/bicycles", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("No fue posible cargar el catálogo de bicicletas.");
      }

      const data = (await response.json()) as Bicicleta[];
      if (peticion === peticionBicicletas.current) setBicicletas(data);
    } catch (err) {
      if (peticion !== peticionBicicletas.current) return;
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al cargar las bicicletas."
      );
      setBicicletas([]);
    } finally {
      if (peticion === peticionBicicletas.current) setIsLoading(false);
    }
  }, []);

  const fetchOrdenes = useCallback(async () => {
    const peticion = ++peticionOrdenes.current;
    setCargandoOrdenes(true);
    setErrorOrdenes(null);
    setOrdenes([]);

    try {
      const data = await solicitarBicicletaApi<unknown>("/api/punto-venta");
      if (peticion === peticionOrdenes.current)
        setOrdenes(normalizarOrdenesAbiertas(data));
    } catch (error) {
      if (peticion === peticionOrdenes.current) {
        setErrorOrdenes(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las órdenes de trabajo"
        );
      }
    } finally {
      if (peticion === peticionOrdenes.current) setCargandoOrdenes(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    queueMicrotask(() => { if (activo) void fetchBicicletas(); });

    const handleRefresh = () => {
      void fetchBicicletas();
    };

    window.addEventListener("bicicletas:refresh", handleRefresh);

    return () => {
      activo = false;
      window.removeEventListener("bicicletas:refresh", handleRefresh);
    };
  }, [fetchBicicletas]);

  const handleEditBicicleta = useCallback(
    (bicicleta: Bicicleta) => {
      if (!canEdit || !ordenAbierta(bicicleta.ordenDeTrabajo?.estadoOrden))
        return;
      setSelectedBicicleta(bicicleta);
      setOpenEditModal(true);
      void fetchOrdenes();
    },
    [canEdit, fetchOrdenes]
  );

  const handleOpenDetalle = useCallback((bicicleta: Bicicleta) => {
    setDetalleBicicleta(bicicleta);
    setOpenDetalleModal(true);
  }, []);

  const handleEditFromDetalle = useCallback(
    (bicicleta: Bicicleta) => {
      setOpenDetalleModal(false);
      setDetalleBicicleta(null);
      handleEditBicicleta(bicicleta);
    },
    [handleEditBicicleta]
  );

  const normalizedSearch = search.trim().toLowerCase();
  const filteredBicicletas = useMemo(() => {
    return bicicletas.filter((bicicleta) => {
      const estadoOrden = bicicleta.ordenDeTrabajo?.estadoOrden;
      const matchesStatus =
        estadoFiltro === "all" || estadoOrden === estadoFiltro;
      if (!matchesStatus) return false;
      if (!normalizedSearch) return true;

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
  }, [bicicletas, normalizedSearch, estadoFiltro]);

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
      <div className="animate-pulse space-y-6">
        {/* Skeleton de KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={`metric-skeleton-${i}`}
              className="h-24 rounded-2xl"
            />
          ))}
        </div>

        {/* Skeleton de DataTableContainer y Grilla de Tarjetas */}
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
          <div className="space-y-4 border-b border-border/60 bg-muted/15 p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 rounded-lg" />
                <Skeleton className="h-4 w-36 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          <div className="p-4 md:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={`card-skeleton-${i}`}
                  className="space-y-3 overflow-hidden rounded-2xl border border-border/80 bg-card p-0"
                >
                  <Skeleton className="aspect-[16/10] w-full rounded-none" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-5 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                    <div className="flex items-center justify-between border-t border-border/60 pt-2">
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
    <div className="animate-in space-y-6 duration-300 fade-in">
      {/* Banner de error cuando hay fallo */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-card-foreground sm:flex-row sm:items-center sm:justify-between">
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
            className="shrink-0 cursor-pointer border-destructive/30 text-destructive hover:bg-destructive/10"
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
        toolbar={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                aria-label="Buscar bicicletas por marca, modelo, cliente u orden"
                placeholder="Buscar por marca, modelo, cliente u orden..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-xl border-border/80 bg-background pl-10 text-sm shadow-2xs focus-visible:ring-primary/30"
              />
            </div>
            <div className="w-full shrink-0 sm:w-56">
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger
                  aria-label="Filtrar bicicletas por estado de la orden"
                  className="h-10 w-full cursor-pointer rounded-xl border-border/80 bg-background text-sm shadow-2xs data-[size=default]:h-10 sm:w-56"
                >
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.values(ESTADO_OT).map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado === ESTADO_OT.LISTO_PARA_ENTREGAR
                        ? "Por entregar"
                        : NOMBRES_ESTADO_OT[estado]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        }
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
                search || estadoFiltro !== "all"
                  ? "No hay resultados que coincidan con tu criterio de búsqueda."
                  : "Aún no hay bicicletas registradas en el sistema."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBicicletas.map((bicicleta) => (
                <BikeCard
                  key={bicicleta.idBicicleta}
                  bicicleta={bicicleta}
                  onEdit={canEdit ? handleEditBicicleta : undefined}
                  onSelect={handleOpenDetalle}
                />
              ))}
            </div>
          )}
        </div>
      </DataTableContainer>

      <ModalDetalleBicicleta
        bicicleta={detalleBicicleta}
        open={openDetalleModal}
        onOpenChange={setOpenDetalleModal}
        onEdit={canEdit ? handleEditFromDetalle : undefined}
      />

      {selectedBicicleta && (
        <FormEditBicicleta
          key={selectedBicicleta.idBicicleta}
          bicicleta={selectedBicicleta}
          open={openEditModal}
          onOpenChange={(open) => {
            setOpenEditModal(open);
            if (!open) {
              setSelectedBicicleta(null);
            }
          }}
          ordenes={ordenes}
          cargandoOrdenes={cargandoOrdenes}
          errorOrdenes={errorOrdenes}
          onRetryOrdenes={fetchOrdenes}
          onRefresh={fetchBicicletas}
          onCancel={() => {
            setOpenEditModal(false);
            setSelectedBicicleta(null);
          }}
          onSuccess={() => {
            setOpenEditModal(false);
            setSelectedBicicleta(null);
            void fetchBicicletas();
          }}
        />
      )}
    </div>
  );
}
