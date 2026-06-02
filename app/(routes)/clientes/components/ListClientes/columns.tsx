"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

export type ClienteNatural = {
  id: number
  nombre: string // Nombres
  apellido: string // Apellidos
  rut: string
  telefono: string
  estado: string
}

export type ClienteJuridica = {
  id: number
  nombre: string // Razón Social
  giro: string
  nombreContacto: string
  rut: string
  telefono: string
  estado: string
}

// 1. Columnas para Personas Naturales
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
      )
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
      if (!filterValue) return true
      return row.getValue(columnId) === filterValue
    },
    cell: ({ row }) => {
      const estado = row.getValue("estado")
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            String(estado).toLowerCase() === "activo"
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

// 2. Columnas para Personas Jurídicas
export const columnsJuridicas: ColumnDef<ClienteJuridica>[] = [
  {
    accessorKey: "nombre", // Mapeado a Razón Social
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
      )
    },
  },
  {
    accessorKey: "giro",
    header: "Giro",
    cell: ({ row }) => {
      const giro = row.getValue("giro")
      return <span className="text-slate-600">{String(giro || "-")}</span>
    }
  },
  {
    accessorKey: "nombreContacto",
    header: "Nombre de Contacto",
    cell: ({ row }) => {
      const contacto = row.getValue("nombreContacto")
      return <span className="text-slate-600">{String(contacto || "-")}</span>
    }
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
            String(estado).toLowerCase() === "activo"
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