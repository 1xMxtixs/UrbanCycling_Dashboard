"use client";

import { ColumnDef, Row, Table } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { ClienteNatural, ClienteJuridica, ClientesTableMeta } from "../../types";

export type { ClienteNatural, ClienteJuridica };

interface CellActionsProps<TData extends { id: number }> {
  row: Row<TData>;
  table: Table<TData>;
}

const CellActions = <TData extends { id: number }>({
  row,
  table,
}: CellActionsProps<TData>) => {
  const client = row.original;
  const meta = table.options.meta as ClientesTableMeta | undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => meta?.onViewDetails?.(client.id)}
          className="flex cursor-pointer items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Ver Detalle
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columnsNaturales: ColumnDef<ClienteNatural>[] = [
  {
    accessorKey: "nombre",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Nombres
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "apellido",
    header: "Apellidos",
  },
  {
    accessorKey: "rut",
    header: "RUT",
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
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
      const estado = String(row.getValue("estado"));
      const isActivo = estado.toLowerCase() === "activo";
      return (
        <StatusBadge
          status={isActivo ? "success" : "danger"}
          label={estado}
        />
      );
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row, table }) => <CellActions row={row} table={table} />,
  },
];

export const columnsJuridicas: ColumnDef<ClienteJuridica>[] = [
  {
    accessorKey: "nombre",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Razón Social
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "giro",
    header: "Giro",
    cell: ({ row }) => {
      const giro = row.getValue("giro");
      return (
        <span className="text-muted-foreground">{String(giro || "-")}</span>
      );
    },
  },
  {
    accessorKey: "nombreContacto",
    header: "Contacto",
    cell: ({ row }) => {
      const contacto = row.getValue("nombreContacto");
      return (
        <span className="text-muted-foreground">
          {String(contacto || "-")}
        </span>
      );
    },
  },
  {
    accessorKey: "rut",
    header: "RUT",
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
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
      const estado = String(row.getValue("estado"));
      const isActivo = estado.toLowerCase() === "activo";
      return (
        <StatusBadge
          status={isActivo ? "success" : "danger"}
          label={estado}
        />
      );
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row, table }) => <CellActions row={row} table={table} />,
  },
];