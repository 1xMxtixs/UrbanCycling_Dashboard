"use client"

import {
  Eye,
  ChevronLeft,
  ChevronRight,
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
  if (normalizado === "INACTIVO" || normalizado === "DADO_DE_BAJA")
    return "danger"
  if (normalizado === "SUSPENDIDO" || normalizado === "EN_REVISION")
    return "warning"
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
  const [pageIndex, setPageIndex] = useState(0)

  // PR-08: Búsqueda normalizada tolerante a acentos y mayúsculas
  const proveedoresFiltrados = useMemo(() => {
    const value = normalizeSearchText(search)
    const normalizedRutQuery = value.replace(/[.\-\s]/g, "")
    return proveedores
      .filter((proveedor) => {
        const rut = proveedor.rut
          .replace(/[.\-\s]/g, "")
          .toLocaleLowerCase("es-CL")
        if (!value) return true
        return (
          normalizeSearchText(proveedor.razonSocial).includes(value) ||
          (normalizedRutQuery.length > 0 && rut.includes(normalizedRutQuery)) ||
          normalizeSearchText(proveedor.giro).includes(value) ||
          normalizeSearchText(proveedor.nombreFantasia).includes(value)
        )
      })
      .sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, "es-CL"))
  }, [proveedores, search])
  const pageSize = 10
  const pageCount = Math.max(
    1,
    Math.ceil(proveedoresFiltrados.length / pageSize)
  )
  const paginaActual = Math.min(pageIndex, pageCount - 1)
  const proveedoresVisibles = proveedoresFiltrados.slice(
    paginaActual * pageSize,
    (paginaActual + 1) * pageSize
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPageIndex(0)
  }

  return (
    <DataTableContainer
      title="Directorio de proveedores"
      searchPlaceholder="Buscar por razón social, RUT o giro..."
      searchValue={search}
      onSearchChange={handleSearchChange}
      description={
        !isLoading
          ? `${proveedoresFiltrados.length} ${proveedoresFiltrados.length === 1 ? "proveedor encontrado" : "proveedores encontrados"}`
          : undefined
      }
      footer={
        !isLoading && proveedoresFiltrados.length > 0 ? (
          <>
            <span>
              Mostrando {paginaActual * pageSize + 1}–
              {Math.min(
                (paginaActual + 1) * pageSize,
                proveedoresFiltrados.length
              )}{" "}
              de {proveedoresFiltrados.length}
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">
                Página {paginaActual + 1} de {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPageIndex((current) => Math.max(0, current - 1))
                }
                disabled={paginaActual === 0}
                aria-label="Página anterior"
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPageIndex((current) =>
                    Math.min(pageCount - 1, current + 1)
                  )
                }
                disabled={paginaActual >= pageCount - 1}
                aria-label="Página siguiente"
                className="h-8 px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : undefined
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
                  <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
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
            {proveedoresVisibles.map((proveedor) => (
              <TableRow
                key={proveedor.idProveedor}
                className="cursor-pointer"
                onClick={() => onView(proveedor)}
              >
                <TableCell>
                  <div>
                    <button
                      type="button"
                      className="text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                      onClick={(event) => {
                        event.stopPropagation()
                        onView(proveedor)
                      }}
                    >
                      {proveedor.razonSocial}
                    </button>
                    {proveedor.nombreFantasia && (
                      <p className="text-xs text-muted-foreground">
                        {proveedor.nombreFantasia}
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell className="font-mono text-xs">
                  {formatRutForDisplay(proveedor.rut)}
                </TableCell>

                {/* PR-09: Ocultar columnas secundarias en móviles */}
                <TableCell className="hidden max-w-xs sm:table-cell">
                  <p className="truncate text-xs text-muted-foreground">
                    {proveedor.giro}
                  </p>
                </TableCell>

                <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
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
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="rounded-xl border-border/80"
                    >
                      <DropdownMenuItem
                        onClick={() => onView(proveedor)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver ficha
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onEdit(proveedor)}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>

                      {canAssociateProducts && (
                        <DropdownMenuItem
                          onClick={() => onAssociateProducts(proveedor)}
                          className="cursor-pointer"
                        >
                          <PackageCheck className="mr-2 h-4 w-4" />
                          Asociar productos
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      {/* PR-13: Texto claro alineado con la acción de inactivación */}
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
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

function formatRutForDisplay(value: string) {
  const compact = value.replace(/[.\-\s]/g, "").toUpperCase()
  if (!/^\d{7,8}[0-9K]$/.test(compact)) return value
  const body = compact.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${body}-${compact.slice(-1)}`
}
