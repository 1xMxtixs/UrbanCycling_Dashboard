"use client";

import { useEffect, useMemo, useState } from "react";
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

import type { Garantia } from "../types";

/* ============================================================
   CONVERTIR ESTADO DEL BACKEND AL FORMATO DEL FRONTEND
============================================================ */

function convertirEstado(estado: string): Garantia["estado"] {
  switch (estado) {
    case "INGRESADO":
      return "Ingresado";

    case "EN_REVISION":
      return "En Revisión";

    case "EN_ESPERA":
      return "En Espera";

    case "APROBADO":
      return "Aprobado";

    case "RECHAZADO":
      return "Rechazado";

    default:
      return "Ingresado";
  }
}

/* ============================================================
   CONVERTIR FECHA
============================================================ */

function convertirFecha(fecha: string | null) {
  if (!fecha) return null;

  return new Date(fecha).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ============================================================
   LISTA DE GARANTÍAS
============================================================ */

export function ListGarantias() {
  const [garantias, setGarantias] = useState<Garantia[]>([]);

  const [isLoading, setIsLoading] = useState(true);

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

  /* ============================================================
     OBTENER GARANTÍAS DESDE EL BACKEND
  ============================================================ */

  const cargarGarantias = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/garantias", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "No fue posible obtener las garantías"
        );
      }

      const garantiasBackend: Garantia[] =
        (data.garantias ?? []).map(
          (garantia: any) => ({
            idGarantia:
              garantia.idGarantia,

            idOrdenDeTrabajo:
              garantia.idOrdenDeTrabajo,

            idVenta:
              garantia.idVenta,

            cliente:
              garantia.cliente
                ? {
                    idCliente:
                      garantia.cliente.idCliente,

                    nombre:
                      garantia.cliente.nombre,

                    rut:
                      garantia.cliente.rut,
                  }
                : null,

            motivoReclamo:
              garantia.motivoReclamo,

            fechaIngreso:
              convertirFecha(
                garantia.fechaIngreso
              ) ?? "",

            observaciones:
              garantia.observaciones,

            estado:
              convertirEstado(
                garantia.estado
              ),

            veredicto:
              garantia.veredicto,

            observacionesResolucion:
              garantia.observacionesResolucion,

            fechaResolucion:
              convertirFecha(
                garantia.fechaResolucion
              ),
          })
        );

      setGarantias(garantiasBackend);
    } catch (error) {
      console.error(
        "[LIST_GARANTIAS]",
        error
      );

      setGarantias([]);
    } finally {
      setIsLoading(false);
    }
  };

  /* ============================================================
     CARGAR AL MONTAR EL COMPONENTE
  ============================================================ */

  useEffect(() => {
    cargarGarantias();
  }, []);

  /* ============================================================
     KPIs
  ============================================================ */

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

  /* ============================================================
     VER DETALLE
  ============================================================ */

  const handleViewDetails = (id: number) => {
    const garantia = garantias.find(
      (item) =>
        item.idGarantia === id
    );

    if (!garantia) return;

    setSelectedGarantia(garantia);
    setOpenDetailsModal(true);
  };

  /* ============================================================
     EDITAR
  ============================================================ */

  const handleEdit = (id: number) => {
    const garantia = garantias.find(
      (item) =>
        item.idGarantia === id
    );

    if (!garantia) return;

    console.log(
      "Modificar solicitud de garantía:",
      garantia
    );
  };

  /* ============================================================
     RESOLVER GARANTÍA
  ============================================================ */

  const handleResolve = (id: number) => {
    const garantia = garantias.find(
      (item) =>
        item.idGarantia === id
    );

    if (!garantia) return;

    /*
     * Una garantía que ya fue aprobada
     * o rechazada no puede volver a resolverse.
     */

    if (
      garantia.estado === "Aprobado" ||
      garantia.estado === "Rechazado"
    ) {
      return;
    }

    setSelectedGarantiaResolve(
      garantia
    );

    setOpenResolveModal(true);
  };

  /* ============================================================
     GARANTÍA RESUELTA
  ============================================================ */

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

  /* ============================================================
     LOADING
  ============================================================ */

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

  /* ============================================================
     RENDER
  ============================================================ */

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