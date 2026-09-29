"use client";

import { ColumnDef, Row, Table } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
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

  const isPending = garantia.estado === "Pendiente";

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

        <DropdownMenuItem
          onClick={() =>
            meta?.onViewDetails?.(garantia.idGarantia)
          }
          className="flex cursor-pointer items-center gap-2"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
          Ver Detalle
        </DropdownMenuItem>

        {isPending && (
          <>
            <DropdownMenuItem
              onClick={() =>
                meta?.onEdit?.(garantia.idGarantia)
              }
              className="flex cursor-pointer items-center gap-2"
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Modificar Solicitud
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                meta?.onResolve?.(garantia.idGarantia)
              }
              className="flex cursor-pointer items-center gap-2 font-medium text-primary focus:text-primary"
            >
              <Gavel className="h-4 w-4 text-primary" />
              Resolver Garantía
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const columns: ColumnDef<Garantia>[] = [
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
        GAR-{String(row.original.idGarantia).padStart(3, "0")}
      </span>
    ),
  },

  {
    accessorKey: "idOrdenDeTrabajo",
    header: "Orden de Trabajo",
    cell: ({ row }) => (
      <span className="font-semibold">
        #{row.original.idOrdenDeTrabajo}
      </span>
    ),
  },

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

  {
    accessorKey: "estado",
    header: "Estado",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;

      return (
        String(row.getValue(columnId)).toLowerCase() ===
        String(filterValue).toLowerCase()
      );
    },

    cell: ({ row }) => {
      const estado = row.original.estado;

      let status:
        | "success"
        | "warning"
        | "danger"
        | "neutral" = "neutral";

      if (estado === "Pendiente") {
        status = "warning";
      }

      if (estado === "Aprobada") {
        status = "success";
      }

      if (estado === "Rechazada") {
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