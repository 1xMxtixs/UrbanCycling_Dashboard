"use client"

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export type Bicicleta = {
  id: number;
  marca: string;
  modelo: string;
  color: string;
  descripcion: string | null;
  cliente?: string | null;
  imagen?: string | null;
};

export const columns: ColumnDef<Bicicleta>[] = [
  {
    accessorKey: "marca",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Marca
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "modelo",
    header: "Modelo",
  },
  {
    accessorKey: "color",
    header: "Color",
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
    cell: ({ row }) => {
      const cliente = row.getValue("cliente") as string | null;
      return <span>{cliente ?? "Sin cliente"}</span>;
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: () => (
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    ),
  },
];
