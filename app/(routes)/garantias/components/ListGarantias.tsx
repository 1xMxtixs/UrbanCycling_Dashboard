"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  PauseCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { MetricCard } from "@/components/common/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PERMISSIONS } from "@/lib/permissions";
import { toast } from "sonner";

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { GarantiaDetailDialog } from "./GarantiaDetailDialog";
import { ResolveGarantiaDialog } from "./ResolveGarantiaDialog";
import { EditGarantiaDialog } from "./EditGarantiaDialog";

import type {
  EstadoGarantiaCodigo,
  Garantia,
} from "../types";

const nombresEstado: Record<EstadoGarantiaCodigo, Garantia["estado"]> = {
  INGRESADO: "Ingresado",
  EN_REVISION: "En Revisión",
  EN_ESPERA: "En espera",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

/*
 * ============================================================
 * CONVERTIR ESTADO DEL BACKEND
 * ============================================================
 */

function normalizarCodigoEstado(
  estado: unknown
): EstadoGarantiaCodigo | null {
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

  const estadoNormalizado = codigo
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replaceAll(" ", "_");

  switch (estadoNormalizado) {
    case "INGRESADO":
      return "INGRESADO";

    case "EN_REVISION":
      return "EN_REVISION";

    case "EN_ESPERA":
      return "EN_ESPERA";

    case "APROBADO":
    case "APROBADA":
      return "APROBADO";

    case "RECHAZADO":
    case "RECHAZADA":
      return "RECHAZADO";

    default:
      return null;
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
  const { data: session } = useSession();
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
   * El cambio de estado se confirma antes de llamar al controlador.
   * El usuario solo puede ver las opciones autorizadas por su sesión.
   */
  const [cambioEstadoPendiente, setCambioEstadoPendiente] = useState<{
    garantia: Garantia;
    estadoDestino: EstadoGarantiaCodigo;
  } | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const permisos = session?.user?.permisos ?? [];
  const canUpdate = permisos.includes(PERMISSIONS.WARRANTIES_UPDATE);
  const canResolve = permisos.includes(PERMISSIONS.WARRANTIES_RESOLVE);

  /*
   * ==========================================================
   * CARGAR GARANTÍAS
   * ==========================================================
   */

  const cargarGarantias = async (mostrarCarga = true) => {
    try {
      if (mostrarCarga) {
        setIsLoading(true);
      }

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

            const cliente = garantia.cliente ?? {
              idCliente: 0,
              nombre: "Cliente sin nombre",
              rut: "Sin RUT",
            };

            /*
             * Estado
             */

            const estadoCodigo = normalizarCodigoEstado(garantia.estado);

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

              estado: nombresEstado[estadoCodigo],

              // El código gobierna las reglas de la interfaz y las llamadas al API.
              estadoCodigo,

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
      if (mostrarCarga) {
        setIsLoading(false);
      }
    }
  };

  /*
   * ==========================================================
   * CARGAR AL MONTAR
   * ==========================================================
   */

  useEffect(() => {
    cargarGarantias();

    // La creación sucede en HeaderGarantias; al recibir su evento volvemos a
    // consultar el catálogo para incluir la garantía recién registrada.
    const refrescarGarantias = () => {
      void cargarGarantias(false);
    };

    window.addEventListener("garantias:refresh", refrescarGarantias);

    return () => {
      window.removeEventListener("garantias:refresh", refrescarGarantias);
    };
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
        estado: nombresEstado[estadoCodigo],
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ...Array(6),
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
      <AlertDialog
        open={Boolean(cambioEstadoPendiente)}
        onOpenChange={(open) => {
          if (!open && !isChangingStatus) {
            setCambioEstadoPendiente(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio de estado</AlertDialogTitle>
            <AlertDialogDescription>
              La solicitud #{cambioEstadoPendiente?.garantia.idGarantia} pasará de{" "}
              {cambioEstadoPendiente?.garantia.estado} a{" "}
              {cambioEstadoPendiente
                ? nombresEstado[cambioEstadoPendiente.estadoDestino]
                : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isChangingStatus}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isChangingStatus}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmStatusChange();
              }}
            >
              {isChangingStatus ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
