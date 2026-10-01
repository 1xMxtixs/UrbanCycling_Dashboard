"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { MetricCard } from "@/components/common/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { GarantiaDetailDialog } from "./GarantiaDetailDialog";
import { ResolveGarantiaDialog } from "./ResolveGarantiaDialog";

import type {
  Garantia,
  EstadoGarantia,
} from "../types";

export function ListGarantias() {
  const [garantias, setGarantias] = useState<Garantia[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedGarantia, setSelectedGarantia] =
    useState<Garantia | null>(null);

  const [openDetailsModal, setOpenDetailsModal] =
    useState(false);

  const [
    selectedGarantiaResolve,
    setSelectedGarantiaResolve,
  ] = useState<Garantia | null>(null);

  const [openResolveModal, setOpenResolveModal] =
    useState(false);

  /*
   * ============================================================
   * CONVERSIÓN DE ESTADOS
   * ============================================================
   *
   * Backend:
   * INGRESADO
   * EN_REVISION
   * APROBADO
   * RECHAZADO
   *
   * Frontend:
   * Ingresado
   * En Revisión
   * Aprobado
   * Rechazado
   */

  const convertirEstado = (
    estado: string
  ): EstadoGarantia => {
    switch (estado) {
      case "INGRESADO":
        return "Ingresado";

      case "EN_REVISION":
        return "En Revisión";

      case "APROBADO":
        return "Aprobado";

      case "RECHAZADO":
        return "Rechazado";

      default:
        return "Ingresado";
    }
  };

  /*
   * ============================================================
   * OBTENER GARANTÍAS
   * ============================================================
   */

  const cargarGarantias = useCallback(
    async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          "/api/garantias",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "No fue posible obtener las garantías"
          );
        }

        const garantiasBackend =
          Array.isArray(data?.garantias)
            ? data.garantias
            : [];

        const garantiasFormateadas: Garantia[] =
          garantiasBackend.map(
            (garantia: any) => ({
              idGarantia:
                garantia.idGarantia,

              idOrdenDeTrabajo:
                garantia.idOrdenDeTrabajo,

              cliente: {
                idCliente:
                  garantia.cliente?.idCliente ?? 0,

                nombre:
                  garantia.cliente?.nombre ??
                  "Cliente sin nombre",

                rut:
                  garantia.cliente?.rut ??
                  "Sin RUT",
              },

              motivoReclamo:
                garantia.motivoReclamo ?? "",

              fechaIngreso:
                garantia.fechaIngreso,

              observaciones:
                garantia.observaciones ?? null,

              estado:
                convertirEstado(
                  garantia.estado
                ),

              veredicto:
                garantia.veredicto ===
                  "Aprobado" ||
                garantia.veredicto ===
                  "Rechazado"
                  ? garantia.veredicto
                  : null,

              observacionesResolucion:
                garantia.observacionesResolucion ??
                null,

              fechaResolucion:
                garantia.fechaResolucion ??
                null,
            })
          );

        setGarantias(
          garantiasFormateadas
        );
      } catch (error) {
        console.error(
          "[LIST_GARANTIAS]",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar las garantías"
        );

        setGarantias([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /*
   * ============================================================
   * CARGA INICIAL
   * ============================================================
   */

  useEffect(() => {
    cargarGarantias();
  }, [cargarGarantias]);

  /*
   * ============================================================
   * KPIs
   * ============================================================
   */

  const totalGarantias =
    garantias.length;

  const ingresadas = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado ===
          "Ingresado"
      ).length,
    [garantias]
  );

  const enRevision = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado ===
          "En Revisión"
      ).length,
    [garantias]
  );

  const aprobadas = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado ===
          "Aprobado"
      ).length,
    [garantias]
  );

  const rechazadas = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado ===
          "Rechazado"
      ).length,
    [garantias]
  );

  /*
   * ============================================================
   * VER DETALLE
   * ============================================================
   */

  const handleViewDetails = (
    id: number
  ) => {
    const garantia =
      garantias.find(
        (item) =>
          item.idGarantia === id
      );

    if (!garantia) return;

    setSelectedGarantia(
      garantia
    );

    setOpenDetailsModal(true);
  };

  /*
   * ============================================================
   * MODIFICAR GARANTÍA
   * ============================================================
   *
   * Todavía no implementado.
   */

  const handleEdit = (
    id: number
  ) => {
    const garantia =
      garantias.find(
        (item) =>
          item.idGarantia === id
      );

    if (!garantia) return;

    console.log(
      "Modificar solicitud de garantía:",
      garantia
    );
  };

  /*
   * ============================================================
   * RESOLVER GARANTÍA
   * ============================================================
   */

  const handleResolve = (
    id: number
  ) => {
    const garantia =
      garantias.find(
        (item) =>
          item.idGarantia === id
      );

    if (!garantia) return;

    /*
     * Una garantía aprobada o rechazada
     * ya no puede volver a resolverse.
     */

    if (
      garantia.estado ===
        "Aprobado" ||
      garantia.estado ===
        "Rechazado"
    ) {
      return;
    }

    setSelectedGarantiaResolve(
      garantia
    );

    setOpenResolveModal(true);
  };

  /*
   * ============================================================
   * GARANTÍA RESUELTA
   * ============================================================
   */

  const handleResolved = (
    garantiaActualizada: Garantia
  ) => {
    setGarantias(
      (actuales) =>
        actuales.map(
          (garantia) =>
            garantia.idGarantia ===
            garantiaActualizada.idGarantia
              ? garantiaActualizada
              : garantia
        )
    );

    setSelectedGarantiaResolve(
      null
    );

    setOpenResolveModal(false);
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map(
            (_, index) => (
              <Skeleton
                key={index}
                className="h-24 rounded-2xl"
              />
            )
          )}
        </div>

        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="font-semibold text-destructive">
          No fue posible cargar las garantías
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {error}
        </p>

        <button
          type="button"
          onClick={cargarGarantias}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ======================================================
          KPIs
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

        <MetricCard
          title="Total Solicitudes"
          value={totalGarantias}
          description="Garantías registradas"
          icon={ShieldCheck}
        />

        <MetricCard
          title="Ingresadas"
          value={ingresadas}
          description="Solicitudes ingresadas"
          icon={FileCheck2}
        />

        <MetricCard
          title="En Revisión"
          value={enRevision}
          description="Solicitudes en evaluación"
          icon={Clock3}
        />

        <MetricCard
          title="Aprobadas"
          value={aprobadas}
          description="Garantías aprobadas"
          icon={CheckCircle2}
        />

        <MetricCard
          title="Rechazadas"
          value={rechazadas}
          description="Garantías rechazadas"
          icon={XCircle}
        />

      </div>

      {/* ======================================================
          TABLA
      ====================================================== */}

      <DataTable
        columns={columns}
        data={garantias}
        meta={{
          onViewDetails:
            handleViewDetails,

          onEdit:
            handleEdit,

          onResolve:
            handleResolve,
        }}
      />

      {/* ======================================================
          DETALLE
      ====================================================== */}

      <GarantiaDetailDialog
        open={openDetailsModal}
        onOpenChange={
          setOpenDetailsModal
        }
        garantia={
          selectedGarantia
        }
      />

      {/* ======================================================
          RESOLVER
      ====================================================== */}

      <ResolveGarantiaDialog
        open={openResolveModal}
        onOpenChange={
          setOpenResolveModal
        }
        garantia={
          selectedGarantiaResolve
        }
        onResolved={
          handleResolved
        }
      />

    </div>
  );
}