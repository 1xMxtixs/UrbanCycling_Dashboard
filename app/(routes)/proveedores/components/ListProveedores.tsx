"use client"

import {
  Eye,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  Store,
  Trash2,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableContainer } from "@/components/common/DataTableContainer"
import { EmptyState } from "@/components/common/EmptyState"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { StatusType } from "@/components/common/StatusBadge"

import type { ProveedorListado } from "./types"

interface ListProveedoresProps {
  proveedores: ProveedorListado[]
  isLoading: boolean
  onView: (proveedor: ProveedorListado) => void
  onEdit: (proveedor: ProveedorListado) => void
  onDelete: (proveedor: ProveedorListado) => void
  onAssociateProducts: (proveedor: ProveedorListado) => void
  canAssociateProducts: boolean
}

/** Mapea el estado del proveedor a los tipos semánticos de StatusBadge */
function resolveStatusType(estado: string): StatusType {
  const normalizado = estado.trim().toUpperCase()
  if (normalizado === "ACTIVO") return "success"
  if (normalizado === "INACTIVO" || normalizado === "DADO_DE_BAJA") return "danger"
  if (normalizado === "SUSPENDIDO" || normalizado === "EN_REVISION") return "warning"
  return "neutral"
}

export function ListProveedores({
  proveedores,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onAssociateProducts,
  canAssociateProducts,
}: ListProveedoresProps) {
  const [search, setSearch] = useState("")

  const proveedoresFiltrados = useMemo(() => {
    const value = search.trim().toLowerCase()
    if (!value) return proveedores
    return proveedores.filter((proveedor) =>
      proveedor.razonSocial.toLowerCase().includes(value) ||
      proveedor.rut.toLowerCase().includes(value) ||
      proveedor.giro.toLowerCase().includes(value) ||
      proveedor.nombreFantasia?.toLowerCase().includes(value)
    )
  }, [proveedores, search])

  return (
    <DataTableContainer
      searchPlaceholder="Buscar por razón social, RUT o giro..."
      searchValue={search}
      onSearchChange={setSearch}
      description={
        !isLoading
          ? `${proveedoresFiltrados.length} ${proveedoresFiltrados.length === 1 ? "proveedor encontrado" : "proveedores encontrados"}`
          : undefined
      }
    >
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Cargando proveedores...
        </div>
      ) : proveedoresFiltrados.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Store}
            title="No se encontraron proveedores"
            description={
              search
                ? "Prueba con otro criterio de búsqueda."
                : "Registra tu primer proveedor para comenzar."
            }
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razón social</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Giro</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {proveedoresFiltrados.map((proveedor) => (
              <TableRow
                key={proveedor.idProveedor}
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{proveedor.razonSocial}</p>
                    {proveedor.nombreFantasia && (
                      <p className="text-xs text-muted-foreground">
                        {proveedor.nombreFantasia}
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell>{proveedor.rut}</TableCell>

                <TableCell className="max-w-xs">
                  <p className="truncate">{proveedor.giro}</p>
                </TableCell>

                <TableCell>
                  {proveedor.nombreContacto || "Sin contacto"}
                </TableCell>

                <TableCell>
                  <StatusBadge
                    status={resolveStatusType(proveedor.estado)}
                    label={proveedor.estado}
                  />
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Acciones del proveedor">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(proveedor)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver ficha
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => onEdit(proveedor)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>

                      {canAssociateProducts && (
                        <DropdownMenuItem onClick={() => onAssociateProducts(proveedor)}>
                          <PackageCheck className="mr-2 h-4 w-4" />
                          Asociar productos
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(proveedor)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTableContainer>
  )
}
