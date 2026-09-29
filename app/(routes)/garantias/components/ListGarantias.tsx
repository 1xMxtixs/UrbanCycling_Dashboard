"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { MetricCard } from "@/components/common/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { GarantiaDetailDialog } from "./GarantiaDetailDialog";

import type { Garantia } from "../types";

const garantiasIniciales: Garantia[] = [
  {
    idGarantia: 1,
    idOrdenDeTrabajo: 124,

    cliente: {
      idCliente: 1,
      nombre: "Juan Pérez González",
      rut: "12.345.678-9",
    },

    motivoReclamo:
      "La bicicleta presenta nuevamente problemas con el sistema de cambios después de la reparación realizada.",

    fechaIngreso: "2026-09-25",

    observaciones:
      "Cliente indica que el problema comenzó nuevamente dos días después de retirar la bicicleta.",

    estado: "Pendiente",

    veredicto: null,
    observacionesResolucion: null,
    fechaResolucion: null,
  },

  {
    idGarantia: 2,
    idOrdenDeTrabajo: 119,

    cliente: {
      idCliente: 2,
      nombre: "María González Soto",
      rut: "15.456.789-2",
    },

    motivoReclamo:
      "La rueda trasera continúa presentando problemas luego del servicio realizado.",

    fechaIngreso: "2026-09-22",

    observaciones:
      "Se solicita revisión nuevamente del trabajo efectuado.",

    estado: "Aprobada",

    veredicto: "Aprobada",

    observacionesResolucion:
      "Se determina que el reclamo corresponde a una falla relacionada con la reparación anterior.",

    fechaResolucion: "2026-09-24",
  },

  {
    idGarantia: 3,
    idOrdenDeTrabajo: 115,

    cliente: {
      idCliente: 3,
      nombre: "Pedro Ramírez Silva",
      rut: "18.234.567-4",
    },

    motivoReclamo:
      "Cliente informa ruido en el sistema de transmisión.",

    fechaIngreso: "2026-09-20",

    observaciones:
      "La bicicleta fue revisada previamente antes de registrar la solicitud.",

    estado: "Rechazada",

    veredicto: "Rechazada",

    observacionesResolucion:
      "La falla corresponde a desgaste normal de componentes y no a la reparación realizada.",

    fechaResolucion: "2026-09-23",
  },

  {
    idGarantia: 4,
    idOrdenDeTrabajo: 128,

    cliente: {
      idCliente: 4,
      nombre: "Carlos Muñoz Díaz",
      rut: "16.789.234-5",
    },

    motivoReclamo:
      "Problema nuevamente detectado en los frenos de la bicicleta.",

    fechaIngreso: "2026-09-27",

    observaciones:
      "Cliente solicita revisión del sistema de frenos.",

    estado: "Pendiente",

    veredicto: null,
    observacionesResolucion: null,
    fechaResolucion: null,
  },

  {
    idGarantia: 5,
    idOrdenDeTrabajo: 110,

    cliente: {
      idCliente: 5,
      nombre: "Ana Martínez López",
      rut: "14.567.890-1",
    },

    motivoReclamo:
      "La reparación del cambio trasero no solucionó completamente el problema.",

    fechaIngreso: "2026-09-18",

    observaciones:
      "Se solicita evaluación técnica del trabajo anterior.",

    estado: "Pendiente",

    veredicto: null,
    observacionesResolucion: null,
    fechaResolucion: null,
  },
];

export function ListGarantias() {
  const [garantias] = useState<Garantia[]>(
    garantiasIniciales
  );

  const [isLoading] = useState(false);

  const [selectedGarantia, setSelectedGarantia] =
    useState<Garantia | null>(null);

  const [openDetailsModal, setOpenDetailsModal] =
    useState(false);

  const totalGarantias = garantias.length;

  const pendientes = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado === "Pendiente"
      ).length,
    [garantias]
  );

  const aprobadas = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado === "Aprobada"
      ).length,
    [garantias]
  );

  const rechazadas = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estado === "Rechazada"
      ).length,
    [garantias]
  );

  const handleViewDetails = (id: number) => {
    const garantia = garantias.find(
      (item) => item.idGarantia === id
    );

    if (!garantia) return;

    setSelectedGarantia(garantia);
    setOpenDetailsModal(true);
  };

  const handleEdit = (id: number) => {
    const garantia = garantias.find(
      (item) => item.idGarantia === id
    );

    if (!garantia) return;

    console.log(
      "Modificar solicitud de garantía:",
      garantia
    );
  };

  const handleResolve = (id: number) => {
    const garantia = garantias.find(
      (item) => item.idGarantia === id
    );

    if (!garantia) return;

    console.log(
      "Resolver solicitud de garantía:",
      garantia
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Solicitudes"
          value={totalGarantias}
          description="Garantías registradas"
          icon={ShieldCheck}
        />

        <MetricCard
          title="Pendientes"
          value={pendientes}
          description="Esperando evaluación"
          icon={Clock3}
        />

        <MetricCard
          title="Aprobadas"
          value={aprobadas}
          description="Garantías aceptadas"
          icon={CheckCircle2}
        />

        <MetricCard
          title="Rechazadas"
          value={rechazadas}
          description="Garantías rechazadas"
          icon={XCircle}
        />
      </div>

      {/* Tabla */}
      <DataTable
        columns={columns}
        data={garantias}
        meta={{
          onViewDetails: handleViewDetails,
          onEdit: handleEdit,
          onResolve: handleResolve,
        }}
      />

      {/* Detalle */}
      <GarantiaDetailDialog
        open={openDetailsModal}
        onOpenChange={setOpenDetailsModal}
        garantia={selectedGarantia}
      />
    </div>
  );
}