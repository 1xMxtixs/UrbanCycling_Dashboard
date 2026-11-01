"use client";

import * as React from "react";
import type { Column, ColumnDef, Row, Table } from "@tanstack/react-table";
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  ClipboardList,
  Pencil,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { DataField } from "@/components/common/DataField";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { InactivateClientDialog } from "./InactivateClientDialog";
import type { ClienteNatural, ClienteJuridica, ClientesTableMeta } from "../../types";
import { formatRut } from "@/lib/formatters";
import { getNombreEstadoRegistro, isRegistroActivo } from "@/lib/registro-status";

export type { ClienteNatural, ClienteJuridica };

interface CellActionsProps<TData extends { id: number }> {
  row: Row<TData>;
  table: Table<TData>;
}

const CellActions = <TData extends { id: number }>({
  row,
  table,
}: CellActionsProps<TData>) => {
  const client = row.original as TData & { nombre?: string; estado?: string };
  const meta = table.options.meta as ClientesTableMeta | undefined;
  const { data: session } = useSession();
  const canEdit = session?.user?.permisos?.includes(PERMISSIONS.CLIENTS_UPDATE);
  const canDelete = session?.user?.permisos?.includes(PERMISSIONS.CLIENTS_DELETE);
  const isActivo = isRegistroActivo(client.estado);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div
      className="flex justify-end"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" aria-label="Acciones de cliente">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => meta?.onViewDetails?.(client.id)} className="flex cursor-pointer items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" /> Ver detalle
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => meta?.onViewHistory?.(client.id)} className="flex cursor-pointer items-center gap-2 font-medium text-primary focus:text-primary">
            <ClipboardList className="h-4 w-4 text-primary" /> Historial de órdenes
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem onClick={() => meta?.onEdit?.(client.id)} className="flex cursor-pointer items-center gap-2">
              <Pencil className="h-4 w-4 text-muted-foreground" /> Editar
            </DropdownMenuItem>
          )}
          {canDelete && isActivo && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setDialogOpen(true);
                }}
                className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Inactivar cliente
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {canDelete && (
        <InactivateClientDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          clientId={client.id}
          clientName={client.nombre ?? "este cliente"}
          onConfirm={(id) => {
            if (!meta?.onInactivate) return Promise.reject(new Error("No se pudo inactivar el cliente."));
            return meta.onInactivate(id);
          }}
        />
      )}
    </div>
  );
};

function SortableHeader<TData, TValue>({
  column,
  children,
}: {
  column: Column<TData, TValue>;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      className="h-auto cursor-pointer p-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDown aria-hidden="true" className="ml-1.5 h-3.5 w-3.5 opacity-60" />
    </Button>
  );
}

function PhoneCell({ value }: { value: unknown }) {
  const phone = String(value ?? "").trim();
  if (!phone || phone.toLowerCase() === "no especificado") {
    return <span className="text-muted-foreground/60">—</span>;
  }
  return <span className="text-sm tabular-nums text-muted-foreground">{phone}</span>;
}

function StatusCell({ estado }: { estado: string }) {
  const isActivo = isRegistroActivo(estado);
  return <StatusBadge status={isActivo ? "success" : "danger"} label={getNombreEstadoRegistro(estado)} showDot={false} />;
}

const actionColumn = <TData extends { id: number }>(): ColumnDef<TData> => ({
  id: "acciones",
  header: () => <div className="flex justify-end pr-2">Acciones</div>,
  cell: ({ row, table }) => <CellActions row={row} table={table} />,
});

export const columnsNaturales: ColumnDef<ClienteNatural>[] = [
  {
    id: "cliente",
    accessorFn: (row) => `${row.nombre} ${row.apellido}`.trim(),
    header: ({ column }) => <SortableHeader column={column}>Cliente</SortableHeader>,
    cell: ({ row }) => {
      const cliente = row.original;
      const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.trim();
      return (
        <DataField
          variant="table-cell"
          value={nombreCompleto}
          secondaryValue={<span className="font-mono tabular-nums">{formatRut(cliente.rut)}</span>}
        />
      );
    },
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => <PhoneCell value={row.original.telefono} />,
  },
  {
    accessorKey: "estado",
    header: "Estado",
    filterFn: (row, columnId, filterValue) => !filterValue ||
      String(row.getValue(columnId)).toUpperCase() === String(filterValue).toUpperCase(),
    cell: ({ row }) => <StatusCell estado={String(row.original.estado)} />,
  },
  actionColumn<ClienteNatural>(),
];

export const columnsJuridicas: ColumnDef<ClienteJuridica>[] = [
  {
    accessorKey: "nombre",
    header: ({ column }) => <SortableHeader column={column}>Razón social</SortableHeader>,
    cell: ({ row }) => (
      <DataField
        variant="table-cell"
        value={row.original.nombre}
        secondaryValue={<span className="font-mono tabular-nums">{formatRut(row.original.rut)}</span>}
      />
    ),
  },
  {
    accessorKey: "giro",
    header: "Giro",
    cell: ({ row }) => row.original.giro && row.original.giro !== "No especificado"
      ? <span className="text-muted-foreground">{row.original.giro}</span>
      : <span className="text-muted-foreground/60">—</span>,
  },
  {
    accessorKey: "nombreContacto",
    header: "Contacto",
    cell: ({ row }) => row.original.nombreContacto && row.original.nombreContacto !== "No especificado"
      ? <span className="text-muted-foreground">{row.original.nombreContacto}</span>
      : <span className="text-muted-foreground/60">—</span>,
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => <PhoneCell value={row.original.telefono} />,
  },
  {
    accessorKey: "estado",
    header: "Estado",
    filterFn: (row, columnId, filterValue) => !filterValue ||
      String(row.getValue(columnId)).toUpperCase() === String(filterValue).toUpperCase(),
    cell: ({ row }) => <StatusCell estado={String(row.original.estado)} />,
  },
  actionColumn<ClienteJuridica>(),
];
