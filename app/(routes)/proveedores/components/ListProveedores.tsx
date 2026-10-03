"use client"

import {
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

import type { ProveedorListado } from "./types"

interface ListProveedoresProps {
  proveedores: ProveedorListado[]
  isLoading: boolean
  onView: (proveedor: ProveedorListado) => void
  onEdit: (proveedor: ProveedorListado) => void
  onDelete: (proveedor: ProveedorListado) => void
}

export function ListProveedores({
  proveedores,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: ListProveedoresProps) {
  const [search, setSearch] = useState("")

  const proveedoresFiltrados = useMemo(() => {
    const value = search.trim().toLowerCase()

    if (!value) {
      return proveedores
    }

    return proveedores.filter((proveedor) => {
      return (
        proveedor.razonSocial
          .toLowerCase()
          .includes(value) ||
        proveedor.rut.toLowerCase().includes(value) ||
        proveedor.giro.toLowerCase().includes(value) ||
        proveedor.nombreFantasia
          ?.toLowerCase()
          .includes(value)
      )
    })
  }, [proveedores, search])

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por razón social, RUT o giro..."
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  Razón social
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  RUT
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Giro
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Contacto
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Estado
                </th>

                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    Cargando proveedores...
                  </td>
                </tr>
              ) : proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="h-32 text-center"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <p className="font-medium">
                        No se encontraron proveedores
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {search
                          ? "Prueba con otro criterio de búsqueda."
                          : "Registra tu primer proveedor para comenzar."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((proveedor) => (
                  <tr
                    key={proveedor.idProveedor}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium">
                          {proveedor.razonSocial}
                        </p>

                        {proveedor.nombreFantasia && (
                          <p className="text-xs text-muted-foreground">
                            {proveedor.nombreFantasia}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {proveedor.rut}
                    </td>

                    <td className="max-w-xs px-4 py-4">
                      <p className="truncate">
                        {proveedor.giro}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      {proveedor.nombreContacto ||
                        "Sin contacto"}
                    </td>

                    <td className="px-4 py-4">
                      <Badge variant="secondary">
                        Activo
                      </Badge>
                    </td>

                    <td className="px-4 py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">
                              Acciones
                            </span>
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              onView(proveedor)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver ficha
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              onEdit(proveedor)
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              onDelete(proveedor)
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}