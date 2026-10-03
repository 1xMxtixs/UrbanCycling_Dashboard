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
import { EditGarantiaDialog } from "./EditGarantiaDialog";

import type { Garantia } from "../types";

/*
 * ============================================================
 * CONVERTIR ESTADO DEL BACKEND
 * ============================================================
 */

function convertirEstado(
  estado: unknown
): Garantia["estado"] {
  /*
   * El backend puede devolver:
   *
   * "INGRESADO"
   *
   * o un objeto como:
   *
   * {
   *   codigo: "INGRESADO",
   *   nombre: "Ingresado"
   * }
   */

  let codigo = "";

  if (typeof estado === "string") {
    codigo = estado;
  } else if (
    estado &&
    typeof estado === "object"
  ) {
    const objeto = estado as {
      codigo?: unknown;
      code?: unknown;
      nombre?: unknown;
      name?: unknown;
    };

    codigo =
      typeof objeto.codigo === "string"
        ? objeto.codigo
        : typeof objeto.code === "string"
        ? objeto.code
        : typeof objeto.nombre === "string"
        ? objeto.nombre
        : typeof objeto.name === "string"
        ? objeto.name
        : "";
  }

  switch (
    codigo
      .trim()
      .toUpperCase()
      .replaceAll(" ", "_")
      .replace("É", "E")
  ) {
    case "INGRESADO":
      return "Ingresado";

    case "EN_REVISION":
    case "EN REVISIÓN":
    case "EN REVISION":
      return "En Revisión";


    case "APROBADO":
    case "APROBADA":
      return "Aprobado";

    case "RECHAZADO":
    case "RECHAZADA":
      return "Rechazado";

    default:
      /*
       * Si ya viene como texto de presentación.
       */
      if (
        codigo.toLowerCase() ===
        "ingresado"
      ) {
        return "Ingresado";
      }

      if (
        codigo.toLowerCase() ===
        "en revisión"
      ) {
        return "En Revisión";
      }

      if (
        codigo.toLowerCase() ===
        "aprobado"
      ) {
        return "Aprobado";
      }

      if (
        codigo.toLowerCase() ===
        "rechazado"
      ) {
        return "Rechazado";
      }

      return "Ingresado";
  }
}

/*
 * ============================================================
 * CONVERTIR FECHA
 * ============================================================
 */

function convertirFecha(
  fecha: unknown
): string {
  if (!fecha) {
    return "";
  }

  if (typeof fecha !== "string") {
    return "";
  }

  /*
   * Si ya viene como DD-MM-YYYY,
   * la dejamos tal cual.
   */
  if (
    /^\d{2}-\d{2}-\d{4}$/.test(
      fecha
    )
  ) {
    return fecha;
  }

  /*
   * Si viene ISO desde Prisma.
   */
  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return fecha;
  }

  return date.toLocaleDateString(
    "es-CL",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

/*
 * ============================================================
 * LISTA DE GARANTÍAS
 * ============================================================
 */

export function ListGarantias() {
  const [garantias, setGarantias] =
    useState<Garantia[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  /*
   * ==========================================================
   * DETALLE
   * ==========================================================
   */

  const [selectedGarantia, setSelectedGarantia] =
    useState<Garantia | null>(null);

  const [openDetailsModal, setOpenDetailsModal] =
    useState(false);

  /*
   * ==========================================================
   * MODIFICAR
   * ==========================================================
   */

  const [
    selectedGarantiaEdit,
    setSelectedGarantiaEdit,
  ] = useState<Garantia | null>(null);

  const [openEditModal, setOpenEditModal] =
    useState(false);

  /*
   * ==========================================================
   * RESOLVER
   * ==========================================================
   */

  const [
    selectedGarantiaResolve,
    setSelectedGarantiaResolve,
  ] = useState<Garantia | null>(null);

  const [openResolveModal, setOpenResolveModal] =
    useState(false);

  /*
   * ==========================================================
   * CARGAR GARANTÍAS
   * ==========================================================
   */

  const cargarGarantias = async () => {
    try {
      setIsLoading(true);

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

      const garantiasBackend: Garantia[] =
        (
          data?.garantias ?? []
        ).map(
          (garantia: any) => {
            /*
             * ==================================================
             * IMPORTANTE
             *
             * Backend:
             * idReclamoGarantia
             *
             * Frontend:
             * idGarantia
             *
             * Aquí hacemos la conversión.
             * ==================================================
             */

            const idGarantia = Number(
              garantia.idGarantia ??
                garantia.idReclamoGarantia
            );

            /*
             * Cliente
             */

            const cliente =
              garantia.cliente ??
              null;

            /*
             * Estado
             */

            const estado =
              convertirEstado(
                garantia.estado
              );

            /*
             * Motivo
             *
             * Backend nuevo:
             * motivo
             *
             * Frontend:
             * motivoReclamo
             */

            const motivoReclamo =
              garantia.motivoReclamo ??
              garantia.motivo ??
              "";

            /*
             * Observaciones
             */

            const observaciones =
              garantia.observaciones ??
              garantia.observacionesIngreso ??
              null;

            /*
             * Observaciones de resolución
             */

            const observacionesResolucion =
              garantia.observacionesResolucion ??
              garantia.justificacionResolucion ??
              null;

            /*
             * Veredicto
             */

            let veredicto =
              garantia.veredicto ??
              null;

            if (
              veredicto ===
              "APROBADA"
            ) {
              veredicto =
                "Aprobado";
            }

            if (
              veredicto ===
              "RECHAZADA"
            ) {
              veredicto =
                "Rechazado";
            }

            /*
             * Si no existe ID válido,
             * no agregamos el registro roto.
             */

            if (
              !Number.isInteger(
                idGarantia
              ) ||
              idGarantia <= 0
            ) {
              console.error(
                "[GARANTIAS] Garantía sin ID válido:",
                garantia
              );

              return null;
            }

            return {
              idGarantia,

              idOrdenDeTrabajo:
                Number(
                  garantia.idOrdenDeTrabajo ??
                    0
                ),

              idVenta:
                garantia.idVenta ??
                null,

              cliente,

              motivoReclamo,

              fechaIngreso:
                convertirFecha(
                  garantia.fechaIngreso ??
                    garantia.fechaRegistro
                ),

              observaciones,

              estado,

              veredicto,

              observacionesResolucion,

              fechaResolucion:
                convertirFecha(
                  garantia.fechaResolucion
                ),
            } as Garantia;
          }
        )
        .filter(
          (
            garantia: Garantia | null
          ): garantia is Garantia =>
            garantia !== null
        );

      console.log(
        "[GARANTIAS] Garantías cargadas:",
        garantiasBackend
      );

      setGarantias(
        garantiasBackend
      );
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

  /*
   * ==========================================================
   * CARGAR AL MONTAR
   * ==========================================================
   */

  useEffect(() => {
    cargarGarantias();
  }, []);

  /*
   * ==========================================================
   * KPIs
   * ==========================================================
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
   * ==========================================================
   * VER DETALLE
   * ==========================================================
   */

  const handleViewDetails = (
    id: number
  ) => {
    const garantia =
      garantias.find(
        (item) =>
          item.idGarantia === id
      );

    if (!garantia) {
      console.error(
        "[GARANTIAS] No se encontró garantía:",
        id
      );
      return;
    }

    setSelectedGarantia(
      garantia
    );

    setOpenDetailsModal(true);
  };

  /*
   * ==========================================================
   * MODIFICAR
   * ==========================================================
   */

  const handleEdit = (
    id: number
  ) => {
    const garantia =
      garantias.find(
        (item) =>
          item.idGarantia === id
      );

    if (!garantia) {
      console.error(
        "[GARANTIAS] No se encontró garantía para editar:",
        id
      );
      return;
    }

    /*
     * Solo se puede modificar
     * mientras está ingresada.
     */

    if (
      garantia.estado !==
      "Ingresado"
    ) {
      console.warn(
        "[GARANTIAS] No se puede editar. Estado:",
        garantia.estado
      );
      return;
    }

    setSelectedGarantiaEdit(
      garantia
    );

    setOpenEditModal(true);
  };

  /*
   * ==========================================================
   * GARANTÍA ACTUALIZADA
   * ==========================================================
   */

  const handleUpdated = (
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

    setSelectedGarantiaEdit(
      null
    );

    setOpenEditModal(false);
  };

  /*
   * ==========================================================
   * RESOLVER
   * ==========================================================
   */

  const handleResolve = (
    id: number
  ) => {
    const garantia =
      garantias.find(
        (item) =>
          item.idGarantia === id
      );

    if (!garantia) {
      console.error(
        "[GARANTIAS] No se encontró garantía para resolver:",
        id
      );
      return;
    }

    /*
     * Las garantías ya resueltas
     * no pueden volver a resolverse.
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
   * ==========================================================
   * GARANTÍA RESUELTA
   * ==========================================================
   */

  const handleResolved = (
    garantiaActualizada: Garantia
  ) => {
    /*
     * Nos aseguramos de que el ID
     * siga siendo numérico.
     */

    const idActualizado =
      Number(
        garantiaActualizada.idGarantia
      );

    if (
      !Number.isInteger(
        idActualizado
      ) ||
      idActualizado <= 0
    ) {
      console.error(
        "[GARANTIAS] ID inválido después de resolver:",
        garantiaActualizada
      );
      return;
    }

    const garantiaFinal: Garantia =
      {
        ...garantiaActualizada,
        idGarantia:
          idActualizado,
      };

    setGarantias(
      (actuales) =>
        actuales.map(
          (garantia) =>
            garantia.idGarantia ===
            idActualizado
              ? garantiaFinal
              : garantia
        )
    );

    setSelectedGarantiaResolve(
      null
    );

    setOpenResolveModal(
      false
    );
  };

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ...Array(5),
          ].map(
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
   * ==========================================================
   * RENDER
   * ==========================================================
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
        open={
          openDetailsModal
        }
        onOpenChange={
          setOpenDetailsModal
        }
        garantia={
          selectedGarantia
        }
      />

      {/* ======================================================
          MODIFICAR
      ====================================================== */}

      <EditGarantiaDialog
        open={
          openEditModal
        }
        onOpenChange={(
          open
        ) => {
          setOpenEditModal(
            open
          );

          if (!open) {
            setSelectedGarantiaEdit(
              null
            );
          }
        }}
        garantia={
          selectedGarantiaEdit
        }
        onUpdated={
          handleUpdated
        }
      />

      {/* ======================================================
          RESOLVER
      ====================================================== */}

      <ResolveGarantiaDialog
        open={
          openResolveModal
        }
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