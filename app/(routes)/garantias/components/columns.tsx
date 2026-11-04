"use client";

import { ColumnDef, Row, Table } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Eye,
  Gavel,
  Clock3,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  ESTADO_GARANTIA_CODIGO,
  getEstadoGarantiaStatus,
} from "@/lib/garantia-status";

import { RowActionsMenu } from "@/components/common/RowActionsMenu";

import type { EstadoGarantiaCodigo, Garantia } from "../types";

export interface GarantiasTableMeta {
  onViewDetails?: (id: number) => void;
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
  const garantia = row.original
  const meta = table.options.meta as GarantiasTableMeta | undefined
  const estado = garantia.estadoCodigo
  const isPending = ["INGRESADO", "EN_REVISION", "EN_ESPERA"].includes(estado)
  const canResolve = Boolean(meta?.canResolve) && isPending
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
          : []

  return (
    <RowActionsMenu
      ariaLabel={`Acciones de garantía #${garantia.idGarantia}`}
      groups={[
        {
          actions: [
            {
              label: "Ver detalle",
              icon: Eye,
              onSelect: () => meta?.onViewDetails?.(garantia.idGarantia),
            },
            {
              label: "Resolver garantía",
              icon: Gavel,
              hidden: !canResolve,
              onSelect: () => meta?.onResolve?.(garantia.idGarantia),
            },
          ],
        },
        {
          label: "Cambiar estado",
          actions: statusOptions.map((option) => ({
            label: option.label,
            icon: option.icon,
            hidden: !meta?.canUpdate,
            onSelect: () => meta?.onRequestStatusChange?.(garantia.idGarantia, option.estado),
          })),
        },
      ]}
    />
  )
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
          className="cursor-pointer p-0 font-semibold hover:bg-transparent"
        >
          ID

          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },

    cell: ({ row }) => (
      <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
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
      <span className="font-mono text-sm tabular-nums text-muted-foreground">
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

    cell: ({ row }) => {
      const nombre = row.original.cliente.nombre?.trim();
      const rut = row.original.cliente.rut?.trim();
      const nombreVisible =
        nombre && nombre.toLocaleLowerCase("es-CL") !== "cliente sin nombre"
          ? nombre
          : "—";
      const rutVisible = rut && rut.toLocaleLowerCase("es-CL") !== "sin rut";

      return (
        <div className="space-y-0.5">
          <p className={nombreVisible === "—" ? "text-muted-foreground/60" : "font-semibold text-foreground"}>
            {nombreVisible}
          </p>
          {rutVisible && (
            <p className="text-[11px] text-muted-foreground">RUT: {rut}</p>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "motivoReclamo",
    header: "Motivo",
    cell: ({ row }) => (
      <span
        className="block max-w-[260px] truncate text-sm text-muted-foreground"
        title={row.original.motivoReclamo}
      >
        {row.original.motivoReclamo}
      </span>
    ),
  },

  // ==========================================================
  // FECHA DE INGRESO
  // ==========================================================

  {
    accessorKey: "fechaIngreso",
    enableSorting: false,

    header: "Fecha de Ingreso",

    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
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

    filterFn: (row, _columnId, filterValue) =>
      !filterValue || row.original.estadoCodigo === filterValue,

    cell: ({ row }) => {
      const estado = row.original.estadoCodigo;
      const esEstadoFinal =
        estado === ESTADO_GARANTIA_CODIGO.APROBADO ||
        estado === ESTADO_GARANTIA_CODIGO.RECHAZADO;
      const esEstadoAnimado =
        estado === ESTADO_GARANTIA_CODIGO.INGRESADO ||
        estado === ESTADO_GARANTIA_CODIGO.EN_REVISION ||
        estado === ESTADO_GARANTIA_CODIGO.EN_ESPERA;

      return (
        <StatusBadge
          status={getEstadoGarantiaStatus(estado)}
          label={row.original.estado}
          showDot={!esEstadoFinal}
          animateDot={esEstadoAnimado}
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

    cell: ({ row, table }) => (
      <div className="flex justify-end">
        <CellActions row={row} table={table} />
      </div>
    ),
  },
];
