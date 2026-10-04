"use client";

import { ColumnDef, Row, Table } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Pencil,
  Gavel,
  Clock3,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { EstadoGarantiaCodigo, Garantia } from "../types";

export interface GarantiasTableMeta {
  onViewDetails?: (id: number) => void;
  onEdit?: (id: number) => void;
  onResolve?: (id: number) => void;
  onRequestStatusChange?: (id: number, estado: EstadoGarantiaCodigo) => void;
  canUpdate?: boolean;
  canResolve?: boolean;
}

interface CellActionsProps {
  row: Row<Garantia>;
  table: Table<Garantia>;
}

function CellActions({
  row,
  table,
}: CellActionsProps) {
  const garantia = row.original;

  const meta =
    table.options.meta as GarantiasTableMeta | undefined;

  const estado = garantia.estadoCodigo;

  /*
   * ============================================================
   * PERMISOS DE ACCIONES SEGÚN ESTADO
   * ============================================================
   *
   * INGRESADO:
   * - Ver detalle
   * - Modificar solicitud
   * - Resolver garantía
   *
   * EN REVISIÓN:
   * - Ver detalle
   * - Resolver garantía
   *
   * APROBADO / RECHAZADO:
   * - Solo ver detalle
   */

  const isPending = ["INGRESADO", "EN_REVISION", "EN_ESPERA"].includes(estado);
  const canEdit = Boolean(meta?.canUpdate) && isPending;

  const canResolve = Boolean(meta?.canResolve) && isPending;
  const statusOptions: Array<{ estado: EstadoGarantiaCodigo; label: string; icon: LucideIcon }> =
    estado === "INGRESADO"
      ? [
          { estado: "EN_REVISION", label: "Enviar a revisión", icon: Clock3 },
          { estado: "EN_ESPERA", label: "Poner en espera", icon: PauseCircle },
        ]
      : estado === "EN_REVISION"
        ? [{ estado: "EN_ESPERA", label: "Poner en espera", icon: PauseCircle }]
        : estado === "EN_ESPERA"
          ? [{ estado: "EN_REVISION", label: "Reanudar revisión", icon: PlayCircle }]
          : [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 cursor-pointer"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-52"
      >
        <DropdownMenuLabel>
          Acciones
        </DropdownMenuLabel>

        {/* =====================================================
            VER DETALLE
        ===================================================== */}

        <DropdownMenuItem
          onClick={() =>
            meta?.onViewDetails?.(
              garantia.idGarantia
            )
          }
          className="flex cursor-pointer items-center gap-2"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />

          Ver Detalle
        </DropdownMenuItem>

        {meta?.canUpdate && statusOptions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Cambiar estado</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <DropdownMenuItem
                      key={option.estado}
                      onClick={() => meta.onRequestStatusChange?.(garantia.idGarantia, option.estado)}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {option.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {/* =====================================================
            MODIFICAR SOLICITUD
            Solo disponible en "Ingresado"
        ===================================================== */}

        {canEdit && (
          <DropdownMenuItem
            onClick={() =>
              meta?.onEdit?.(
                garantia.idGarantia
              )
            }
            className="flex cursor-pointer items-center gap-2"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />

            Modificar Solicitud
          </DropdownMenuItem>
        )}

        {/* =====================================================
            RESOLVER GARANTÍA
            Disponible en "Ingresado" y "En Revisión"
        ===================================================== */}

        {canResolve && (
          <DropdownMenuItem
            onClick={() =>
              meta?.onResolve?.(
                garantia.idGarantia
              )
            }
            className="flex cursor-pointer items-center gap-2 font-medium text-primary focus:text-primary"
          >
            <Gavel className="h-4 w-4 text-primary" />

            Resolver Garantía
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<Garantia>[] = [
  // ==========================================================
  // ID GARANTÍA
  // ==========================================================

  {
    accessorKey: "idGarantia",

    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(
              column.getIsSorted() === "asc"
            )
          }
          className="cursor-pointer"
        >
          ID

          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },

    cell: ({ row }) => (
      <span className="font-bold text-foreground">
        GAR-
        {String(
          row.original.idGarantia
        ).padStart(3, "0")}
      </span>
    ),
  },

  // ==========================================================
  // ORDEN DE TRABAJO
  // ==========================================================

  {
    accessorKey: "idOrdenDeTrabajo",

    header: "Orden de Trabajo",

    cell: ({ row }) => (
      <span className="font-semibold">
        #{row.original.idOrdenDeTrabajo}
      </span>
    ),
  },

  // ==========================================================
  // CLIENTE
  // ==========================================================

  {
    id: "cliente",

    accessorFn: (row) =>
      row.cliente.nombre,

    header: "Cliente",

    cell: ({ row }) => (
      <div className="space-y-0.5">
        <p className="font-semibold text-foreground">
          {row.original.cliente.nombre}
        </p>

        <p className="text-[11px] text-muted-foreground">
          RUT:{" "}
          {row.original.cliente.rut}
        </p>
      </div>
    ),
  },

  // ==========================================================
  // FECHA DE INGRESO
  // ==========================================================

  {
    accessorKey: "fechaIngreso",

    header: "Fecha de Ingreso",

    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.fechaIngreso}
      </span>
    ),
  },

  // ==========================================================
  // ESTADO
  // ==========================================================

  {
    accessorKey: "estado",

    header: "Estado",

    filterFn: (
      row,
      columnId,
      filterValue
    ) => {
      if (!filterValue) {
        return true;
      }

      return (
        String(
          row.getValue(columnId)
        )
          .trim()
          .toLowerCase() ===
        String(filterValue)
          .trim()
          .toLowerCase()
      );
    },

    cell: ({ row }) => {
      const estado = row.original.estado;
      const codigo = row.original.estadoCodigo;

      let status:
        | "success"
        | "warning"
        | "danger"
        | "neutral" = "neutral";

      // INGRESADO
      if (codigo === "INGRESADO" || codigo === "EN_ESPERA") {
        status = "neutral";
      }

      // EN REVISIÓN
      if (codigo === "EN_REVISION") {
        status = "warning";
      }

      // APROBADO
      if (codigo === "APROBADO") {
        status = "success";
      }

      // RECHAZADO
      if (codigo === "RECHAZADO") {
        status = "danger";
      }

      return (
        <StatusBadge
          status={status}
          label={estado}
        />
      );
    },
  },

  // ==========================================================
  // ACCIONES
  // ==========================================================

  {
    id: "acciones",

    header: "Acciones",

    cell: ({
      row,
      table,
    }) => (
      <CellActions
        row={row}
        table={table}
      />
    ),
  },
];
