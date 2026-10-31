"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserPermissions } from "@/components/providers";
import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  PauseCircle,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { MetricCard } from "@/components/common/MetricCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog";
import { PERMISSIONS } from "@/lib/permissions";
import { toast } from "sonner";
import {
  NOMBRES_ESTADO_GARANTIA,
  normalizarCodigoEstado,
} from "@/lib/garantia-status";
import { formatDateCL } from "@/lib/formatters";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { GarantiaDetailDialog } from "./GarantiaDetailDialog";
import { ResolveGarantiaDialog } from "./ResolveGarantiaDialog";
import { EditGarantiaDialog } from "./EditGarantiaDialog";

import type {
  EstadoGarantiaCodigo,
  Garantia,
  RawGarantiaBackend,
} from "../types";

/*
 * ============================================================
 * PARSEAR DATOS DEL BACKEND A GARANTIA[]
 * ============================================================
 */

function parseGarantiasBackend(data: unknown): Garantia[] {
  const rawList = Array.isArray((data as { garantias?: unknown })?.garantias)
    ? ((data as { garantias: unknown[] }).garantias)
    : [];

  return rawList
    .map((raw: unknown) => {
      const garantia = raw as RawGarantiaBackend;

      const idGarantia = Number(
        garantia.idGarantia ?? garantia.idReclamoGarantia
      );

      const cliente = garantia.cliente ?? {
        idCliente: 0,
        nombre: "Cliente sin nombre",
        rut: "Sin RUT",
      };

      const estadoCodigo = normalizarCodigoEstado(garantia.estado);

      const motivoReclamo =
        garantia.motivoReclamo ?? garantia.motivo ?? "";

      const observacionesResolucion =
        garantia.observacionesResolucion ??
        garantia.justificacionResolucion ??
        null;

      let veredicto = garantia.veredicto ?? null;

      if (veredicto === "APROBADA") {
        veredicto = "Aprobado";
      }

      if (veredicto === "RECHAZADA") {
        veredicto = "Rechazado";
      }

      if (
        !Number.isInteger(idGarantia) ||
        idGarantia <= 0 ||
        !estadoCodigo
      ) {
        console.error(
          "[GARANTIAS] Garantía con ID o estado inválido:",
          garantia
        );
        return null;
      }

      return {
        idGarantia,
        idOrdenDeTrabajo: Number(garantia.idOrdenDeTrabajo ?? 0),
        idVenta: garantia.idVenta ?? null,
        cliente,
        motivoReclamo,
        fechaIngreso: formatDateCL(
          garantia.fechaIngreso ?? garantia.fechaRegistro
        ),
        estado: NOMBRES_ESTADO_GARANTIA[estadoCodigo],
        estadoCodigo,
        veredicto,
        observacionesResolucion,
        fechaResolucion: formatDateCL(garantia.fechaResolucion),
      } as Garantia;
    })
    .filter((garantia): garantia is Garantia => garantia !== null);
}

/*
 * ============================================================
 * LISTA DE GARANTÍAS
 * ============================================================
 */

export function ListGarantias() {
  const { hasPermission } = useUserPermissions();
  const [garantias, setGarantias] =
    useState<Garantia[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);
  const [error, setError] = useState("");

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
   * El cambio de estado se confirma antes de llamar al controlador.
   * El usuario solo puede ver las opciones autorizadas por su sesión.
   */
  const [cambioEstadoPendiente, setCambioEstadoPendiente] = useState<{
    garantia: Garantia;
    estadoDestino: EstadoGarantiaCodigo;
  } | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const canUpdate = hasPermission(PERMISSIONS.WARRANTIES_UPDATE);
  const canResolve = hasPermission(PERMISSIONS.WARRANTIES_RESOLVE);

  /*
   * ==========================================================
   * CARGAR GARANTÍAS (RECARGA MANUAL / EVENTOS)
   * ==========================================================
   */

  const cargarGarantias = useCallback(async (mostrarCarga = true) => {
    try {
      if (mostrarCarga) {
        setIsLoading(true);
      }
      setError("");

      const response = await fetch("/api/garantias", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "No fue posible obtener las garantías"
        );
      }

      setGarantias(parseGarantiasBackend(data));
    } catch (err) {
      console.error("[LIST_GARANTIAS]", err);
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible obtener las garantías"
      );
      setGarantias([]);
    } finally {
      if (mostrarCarga) {
        setIsLoading(false);
      }
    }
  }, []);

  /*
   * ==========================================================
   * CARGA INICIAL
   * ==========================================================
   */

  useEffect(() => {
    let mounted = true;

    fetch("/api/garantias", {
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data?.message || "No fue posible obtener las garantías"
          );
        }
        if (mounted) {
          setGarantias(parseGarantiasBackend(data));
        }
      })
      .catch((err: unknown) => {
        if (mounted) {
          console.error("[LIST_GARANTIAS]", err);
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible obtener las garantías"
          );
          setGarantias([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    const refrescarGarantias = () => {
      void cargarGarantias(false);
    };

    window.addEventListener("garantias:refresh", refrescarGarantias);

    return () => {
      mounted = false;
      window.removeEventListener("garantias:refresh", refrescarGarantias);
    };
  }, [cargarGarantias]);

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
          garantia.estadoCodigo === "INGRESADO"
      ).length,
    [garantias]
  );

  const enRevision = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estadoCodigo === "EN_REVISION"
      ).length,
    [garantias]
  );

  const enEspera = useMemo(
    () =>
      garantias.filter(
        (garantia) => garantia.estadoCodigo === "EN_ESPERA"
      ).length,
    [garantias]
  );

  const aprobadas = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estadoCodigo === "APROBADO"
      ).length,
    [garantias]
  );

  const rechazadas = useMemo(
    () =>
      garantias.filter(
        (garantia) =>
          garantia.estadoCodigo === "RECHAZADO"
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
      !["INGRESADO", "EN_REVISION", "EN_ESPERA"].includes(
        garantia.estadoCodigo
      )
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
      garantia.estadoCodigo === "APROBADO" ||
      garantia.estadoCodigo === "RECHAZADO"
    ) {
      return;
    }

    setSelectedGarantiaResolve(
      garantia
    );

    setOpenResolveModal(true);
  };

  /*
   * Solicita la confirmación visual. La transición válida la decide el backend;
   * esta capa solo presenta las alternativas que ese contrato permite.
   */
  const handleRequestStatusChange = (
    id: number,
    estadoDestino: EstadoGarantiaCodigo
  ) => {
    const garantia = garantias.find((item) => item.idGarantia === id);

    if (!garantia) {
      toast.error("No se encontró la solicitud de garantía");
      return;
    }

    setCambioEstadoPendiente({ garantia, estadoDestino });
  };

  const handleConfirmStatusChange = async () => {
    if (!cambioEstadoPendiente) return;

    const { garantia, estadoDestino } = cambioEstadoPendiente;
    setIsChangingStatus(true);

    try {
      const response = await fetch(
        `/api/garantias/${garantia.idGarantia}/estado`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado: estadoDestino }),
        }
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ?? "No fue posible cambiar el estado de la garantía"
        );
      }

      const estadoRespuesta = normalizarCodigoEstado(data?.garantia?.estado);
      const estadoCodigo = estadoRespuesta ?? estadoDestino;
      const garantiaActualizada = {
        ...garantia,
        estadoCodigo,
        estado: NOMBRES_ESTADO_GARANTIA[estadoCodigo],
      };

      setGarantias((actuales) =>
        actuales.map((item) =>
          item.idGarantia === garantia.idGarantia ? garantiaActualizada : item
        )
      );
      setSelectedGarantia((actual) =>
        actual?.idGarantia === garantia.idGarantia ? garantiaActualizada : actual
      );
      setCambioEstadoPendiente(null);
      toast.success(data?.message ?? "Estado de garantía actualizado");

      // Recarga para conservar en pantalla cualquier dato adicional del backend.
      await cargarGarantias(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado de la garantía"
      );
    } finally {
      setIsChangingStatus(false);
    }
  };

  /*
   * ==========================================================
   * GARANTÍA RESUELTA
   * ==========================================================
   */

  const handleResolved = (
    garantiaActualizada: Garantia
  ) => {
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ...Array(6),
          ].map(
            (_, index) => (
              <Skeleton
                key={`skeleton-${index}`}
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
    <div className="space-y-6 animate-in fade-in duration-300 motion-reduce:animate-none">
      {/* Banner de error no destructivo con reintento */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-destructive">
              Error al cargar las garantías
            </p>
            <p className="text-xs text-destructive/90">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void cargarGarantias(true)}
            className="border-destructive/30 text-destructive hover:bg-destructive/10 w-fit shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      )}

      {/* ======================================================
          KPIs
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">

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
          title="En espera"
          value={enEspera}
          description="Solicitudes pausadas"
          icon={PauseCircle}
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

          onRequestStatusChange: handleRequestStatusChange,

          canUpdate,

          canResolve,
        }}
      />

      {/* Confirma la transición antes de enviar el PATCH al controlador. */}
      <StatusToggleDialog
        open={Boolean(cambioEstadoPendiente)}
        onOpenChange={(open) => {
          if (!open && !isChangingStatus) {
            setCambioEstadoPendiente(null);
          }
        }}
        title="Confirmar cambio de estado"
        description={
          cambioEstadoPendiente
            ? `La solicitud #${cambioEstadoPendiente.garantia.idGarantia} pasará de ${cambioEstadoPendiente.garantia.estado} a ${NOMBRES_ESTADO_GARANTIA[cambioEstadoPendiente.estadoDestino]}.`
            : undefined
        }
        confirmLabel="Confirmar"
        onConfirm={handleConfirmStatusChange}
        isSubmitting={isChangingStatus}
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
