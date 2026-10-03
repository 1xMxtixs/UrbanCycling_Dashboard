"use client";

import { useMemo, useState } from "react";
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
import { ModifyGarantiaDialog } from "./EditGarantiaDialog";

import type { Garantia } from "../types";

const garantiasIniciales: Garantia[] = [];

export function ListGarantias() {
  const [garantias, setGarantias] =
    useState<Garantia[]>(garantiasIniciales);

  const [isLoading] = useState(false);

  /*
   * DETALLE
   */
  const [selectedGarantia, setSelectedGarantia] =
    useState<Garantia | null>(null);

  const [openDetailsModal, setOpenDetailsModal] =
    useState(false);

  /*
   * MODIFICAR
   */
  const [selectedGarantiaEdit, setSelectedGarantiaEdit] =
    useState<Garantia | null>(null);

  const [openEditModal, setOpenEditModal] =
    useState(false);

  /*
   * RESOLVER
   */
  const [
    selectedGarantiaResolve,
    setSelectedGarantiaResolve,
  ] = useState<Garantia | null>(null);

  const [openResolveModal, setOpenResolveModal] =
    useState(false);

  /*
   * KPIs
   */
  const totalGarantias = garantias.length;

  const ingresadas = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado === "Ingresado"
      ).length,
    [garantias]
  );

  const enRevision = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado === "En Revisión"
      ).length,
    [garantias]
  );

  const aprobadas = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado === "Aprobado"
      ).length,
    [garantias]
  );

  const rechazadas = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado === "Rechazado"
      ).length,
    [garantias]
  );

  /*
   * VER DETALLE
   */
  const handleViewDetails = (id: number) => {
    const garantia = garantias.find(
      (item) => item.idGarantia === id
    );

    if (!garantia) return;

    setSelectedGarantia(garantia);
    setOpenDetailsModal(true);
  };

  /*
   * MODIFICAR
   */
  const handleEdit = (id: number) => {
    const garantia = garantias.find(
      (item) => item.idGarantia === id
    );

    if (!garantia) return;

    if (garantia.estado !== "Ingresado") {
      return;
    }

    setSelectedGarantiaEdit(garantia);
    setOpenEditModal(true);
  };

  /*
   * GARANTÍA ACTUALIZADA
   */
  const handleUpdated = (
    garantiaActualizada: Garantia
  ) => {
    setGarantias((actuales) =>
      actuales.map((garantia) =>
        garantia.idGarantia ===
        garantiaActualizada.idGarantia
          ? garantiaActualizada
          : garantia
      )
    );

    setSelectedGarantiaEdit(null);
    setOpenEditModal(false);
  };

  /*
   * RESOLVER
   */
  const handleResolve = (id: number) => {
    const garantia = garantias.find(
      (item) => item.idGarantia === id
    );

    if (!garantia) return;

    if (
      garantia.estado === "Aprobado" ||
      garantia.estado === "Rechazado"
    ) {
      return;
    }

    setSelectedGarantiaResolve(garantia);
    setOpenResolveModal(true);
  };

  /*
   * GARANTÍA RESUELTA
   */
  const handleResolved = (
    garantiaActualizada: Garantia
  ) => {
    setGarantias((actuales) =>
      actuales.map((garantia) =>
        garantia.idGarantia ===
        garantiaActualizada.idGarantia
          ? garantiaActualizada
          : garantia
      )
    );

    setSelectedGarantiaResolve(null);
    setOpenResolveModal(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, index) => (
            <Skeleton
              key={index}
              className="h-24 rounded-2xl"
            />
          ))}
        </div>

        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPIs */}
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

      {/* TABLA */}
      <DataTable
        columns={columns}
        data={garantias}
        meta={{
          onViewDetails: handleViewDetails,
          onEdit: handleEdit,
          onResolve: handleResolve,
        }}
      />

      {/* DETALLE */}
      <GarantiaDetailDialog
        open={openDetailsModal}
        onOpenChange={setOpenDetailsModal}
        garantia={selectedGarantia}
      />

      {/* MODIFICAR */}
      <ModifyGarantiaDialog
        open={openEditModal}
        onOpenChange={(open: boolean) => {
          setOpenEditModal(open);

          if (!open) {
            setSelectedGarantiaEdit(null);
          }
        }}
        garantia={selectedGarantiaEdit}
        onUpdated={handleUpdated}
      />

      {/* RESOLVER */}
      <ResolveGarantiaDialog
        open={openResolveModal}
        onOpenChange={setOpenResolveModal}
        garantia={selectedGarantiaResolve}
        onResolved={handleResolved}
      />
    </div>
  );
}