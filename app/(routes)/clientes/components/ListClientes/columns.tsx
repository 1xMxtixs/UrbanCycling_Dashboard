"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

export type Cliente = {
  id: number
  nombre: string
  apellido: string
  rut: string
  telefono: string
  estado: string
}

export const columns: ColumnDef<Cliente>[] = [
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
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "apellido",
    header: "Apellido",
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
      if (!filterValue) return true

      return row.getValue(columnId) === filterValue
    },

    cell: ({ row }) => {
      const estado = row.getValue("estado")

      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            estado === "Activo"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {String(estado)}
        </span>
      )
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: () => {
      return (
        <Button
          variant="ghost"
          size="icon"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )
    }
  }

]