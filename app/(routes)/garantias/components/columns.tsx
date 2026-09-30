
"use client";

import { ColumnDef, Row, Table } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Pencil,
  Gavel,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Garantia } from "../types";

export interface GarantiasTableMeta {
  onViewDetails?: (id: number) => void;
  onEdit?: (id: number) => void;
  onResolve?: (id: number) => void;
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

  const meta = table.options.meta as GarantiasTableMeta | undefined;

  const estadoNormalizado = String(garantia.estado)
    .trim()
    .toLowerCase();

  // Solo se puede modificar una solicitud que aún está ingresada.
  const canEdit = estadoNormalizado === "ingresado";

  // Solo se puede resolver una solicitud que está en revisión.
  const canResolve = estadoNormalizado === "en revisión";

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

        {/* ─────────────────────────────────────────
            VER DETALLE
        ───────────────────────────────────────── */}
        <DropdownMenuItem
          onClick={() =>
            meta?.onViewDetails?.(garantia.idGarantia)
          }
          className="flex cursor-pointer items-center gap-2"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
          Ver Detalle
        </DropdownMenuItem>

        {/* ─────────────────────────────────────────
            MODIFICAR SOLICITUD
            Disponible solamente en "Ingresado"
        ───────────────────────────────────────── */}
        {canEdit && (
          <DropdownMenuItem
            onClick={() =>
              meta?.onEdit?.(garantia.idGarantia)
            }
            className="flex cursor-pointer items-center gap-2"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Modificar Solicitud
          </DropdownMenuItem>
        )}

        {/* ─────────────────────────────────────────
            RESOLVER GARANTÍA
            Disponible solamente en "En Revisión"
        ───────────────────────────────────────── */}
        {canResolve && (
          <DropdownMenuItem
            onClick={() =>
              meta?.onResolve?.(garantia.idGarantia)
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
  // ──────────────────────────────────────────────
  // ID GARANTÍA
  // ──────────────────────────────────────────────
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
        {String(row.original.idGarantia).padStart(3, "0")}
      </span>
    ),
  },

  // ──────────────────────────────────────────────
  // ORDEN DE TRABAJO
  // ──────────────────────────────────────────────
  {
    accessorKey: "idOrdenDeTrabajo",

    header: "Orden de Trabajo",

    cell: ({ row }) => (
      <span className="font-semibold">
        #{row.original.idOrdenDeTrabajo}
      </span>
    ),
  },

  // ──────────────────────────────────────────────
  // CLIENTE
  // ──────────────────────────────────────────────
  {
    id: "cliente",

    accessorFn: (row) => row.cliente.nombre,

    header: "Cliente",

    cell: ({ row }) => (
      <div className="space-y-0.5">
        <p className="font-semibold text-foreground">
          {row.original.cliente.nombre}
        </p>

        <p className="text-[11px] text-muted-foreground">
          RUT: {row.original.cliente.rut}
        </p>
      </div>
    ),
  },

  // ──────────────────────────────────────────────
  // FECHA DE INGRESO
  // ──────────────────────────────────────────────
  {
    accessorKey: "fechaIngreso",

    header: "Fecha de Ingreso",

    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(
          row.original.fechaIngreso
        ).toLocaleDateString("es-CL", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </span>
    ),
  },

  // ──────────────────────────────────────────────
  // ESTADO
  // ──────────────────────────────────────────────
  {
    accessorKey: "estado",

    header: "Estado",

    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;

      return (
        String(row.getValue(columnId))
          .trim()
          .toLowerCase() ===
        String(filterValue)
          .trim()
          .toLowerCase()
      );
    },

    cell: ({ row }) => {
      const estado = String(row.original.estado);

      const estadoNormalizado = estado
        .trim()
        .toLowerCase();

      let status:
        | "success"
        | "warning"
        | "danger"
        | "neutral" = "neutral";

      // Ingresado
      if (estadoNormalizado === "ingresado") {
        status = "neutral";
      }

      // En Revisión
      if (estadoNormalizado === "en revisión") {
        status = "warning";
      }

      // Aprobado
      if (estadoNormalizado === "aprobado") {
        status = "success";
      }

      // Rechazado
      if (estadoNormalizado === "rechazado") {
        status = "danger";
      }

      // Finalizado
      if (estadoNormalizado === "finalizado") {
        status = "success";
      }

      return (
        <StatusBadge
          status={status}
          label={estado}
        />
      );
    },
  },

  // ──────────────────────────────────────────────
  // ACCIONES
  // ──────────────────────────────────────────────
  {
    id: "acciones",

    header: "Acciones",

    cell: ({ row, table }) => (
      <CellActions
        row={row}
        table={table}
      />
    ),
  },
];