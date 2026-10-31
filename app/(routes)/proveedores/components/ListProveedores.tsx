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
import { Skeleton } from "@/components/ui/skeleton"
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
import { normalizeSearchText } from "@/lib/search-normalization"

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

  // PR-08: Búsqueda normalizada tolerante a acentos y mayúsculas
  const proveedoresFiltrados = useMemo(() => {
    const value = normalizeSearchText(search)
    if (!value) return proveedores
    return proveedores.filter(
      (proveedor) =>
        normalizeSearchText(proveedor.razonSocial).includes(value) ||
        normalizeSearchText(proveedor.rut).includes(value) ||
        normalizeSearchText(proveedor.giro).includes(value) ||
        normalizeSearchText(proveedor.nombreFantasia).includes(value)
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
      {/* PR-03: Skeleton estructurado de tabla para evitar layout shift */}
      {isLoading ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razón social</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead className="hidden sm:table-cell">Giro</TableHead>
              <TableHead className="hidden md:table-cell">Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={`proveedor-row-skeleton-${i}`}>
                <TableCell>
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-28 rounded" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24 rounded" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-4 w-32 rounded" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-28 rounded" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 rounded-lg ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : proveedoresFiltrados.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={Store}
            title={search ? "Sin resultados" : "No se encontraron proveedores"}
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
              {/* PR-09: Clases responsivas en cabeceras */}
              <TableHead className="hidden sm:table-cell">Giro</TableHead>
              <TableHead className="hidden md:table-cell">Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {proveedoresFiltrados.map((proveedor) => (
              <TableRow key={proveedor.idProveedor}>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{proveedor.razonSocial}</p>
                    {proveedor.nombreFantasia && (
                      <p className="text-xs text-muted-foreground">
                        {proveedor.nombreFantasia}
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell className="font-mono text-xs">{proveedor.rut}</TableCell>

                {/* PR-09: Ocultar columnas secundarias en móviles */}
                <TableCell className="hidden sm:table-cell max-w-xs">
                  <p className="truncate text-muted-foreground text-xs">{proveedor.giro}</p>
                </TableCell>

                <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Acciones para ${proveedor.razonSocial}`}
                        className="cursor-pointer"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="rounded-xl border-border/80">
                      <DropdownMenuItem onClick={() => onView(proveedor)} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver ficha
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => onEdit(proveedor)} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>

                      {canAssociateProducts && (
                        <DropdownMenuItem onClick={() => onAssociateProducts(proveedor)} className="cursor-pointer">
                          <PackageCheck className="mr-2 h-4 w-4" />
                          Asociar productos
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {/* PR-13: Texto claro alineado con la acción de inactivación */}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive cursor-pointer"
                        onClick={() => onDelete(proveedor)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Inactivar
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
