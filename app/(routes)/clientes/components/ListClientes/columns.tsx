"use client";

import * as React from "react";
import type { ColumnDef, Row, Table } from "@tanstack/react-table";
import {
  Eye,
  ClipboardList,
  Pencil,
  PowerOff,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { PERMISSIONS } from "@/lib/permissions";
import { RowActionsMenu } from "@/components/common/RowActionsMenu";
import { DataField } from "@/components/common/DataField";
import { StatusBadge } from "@/components/common/StatusBadge";
import { InactivateClientDialog } from "./InactivateClientDialog";
import type { ClienteNatural, ClienteJuridica, ClientesTableMeta } from "../../types";
import { formatRut } from "@/lib/formatters";
import { getNombreEstadoRegistro, isRegistroActivo } from "@/lib/registro-status";
import { SortableHeader } from "@/components/common/SortableHeader";

export type { ClienteNatural, ClienteJuridica };

interface CellActionsProps<TData extends { id: number }> {
  row: Row<TData>;
  table: Table<TData>;
}

const CellActions = <TData extends { id: number }>({
  row,
  table,
}: CellActionsProps<TData>) => {
  const client = row.original as TData & { nombre?: string; razonSocial?: string; estado?: string }
  const meta = table.options.meta as ClientesTableMeta | undefined
  const { data: session } = useSession()
  const canEdit = session?.user?.permisos?.includes(PERMISSIONS.CLIENTS_UPDATE)
  const canDelete = session?.user?.permisos?.includes(PERMISSIONS.CLIENTS_DELETE)
  const isActivo = isRegistroActivo(client.estado)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const nombre = client.nombre ?? client.razonSocial ?? String(client.id)

  return (
    <div
      className="flex justify-end"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <RowActionsMenu
        ariaLabel={`Acciones de cliente ${nombre}`}
        groups={[
          {
            actions: [
              {
                label: "Ver detalle",
                icon: Eye,
                onSelect: () => meta?.onViewDetails?.(client.id),
              },
              {
                label: "Historial de órdenes",
                icon: ClipboardList,
                variant: "primary",
                onSelect: () => meta?.onViewHistory?.(client.id),
              },
              {
                label: "Editar",
                icon: Pencil,
                hidden: !canEdit,
                onSelect: () => meta?.onEdit?.(client.id),
              },
            ],
          },
          {
            label: "Cambiar estado",
            actions: [
              {
                label: "Inactivar cliente",
                icon: PowerOff,
                variant: "destructive",
                hidden: !canDelete || !isActivo,
                onSelect: (event) => {
                  event.preventDefault()
                  setDialogOpen(true)
                },
              },
            ],
          },
        ]}
      />
      {canDelete && (
        <InactivateClientDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          clientId={client.id}
          clientName={nombre === String(client.id) ? "este cliente" : nombre}
          onConfirm={(id) => {
            if (!meta?.onInactivate) return Promise.reject(new Error("No se pudo inactivar el cliente."))
            return meta.onInactivate(id)
          }}
        />
      )}
    </div>
  )
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
  return (
    <StatusBadge
      status={isActivo ? "success" : "danger"}
      label={getNombreEstadoRegistro(estado)}
      showDot={isActivo}
      animateDot={isActivo}
    />
  );
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
