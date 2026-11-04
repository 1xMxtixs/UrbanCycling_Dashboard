"use client"

import {
  Eye,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Pencil,
  Search,
  Store,
  PowerOff,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RowActionsMenu } from "@/components/common/RowActionsMenu"
import { DataTableContainer } from "@/components/common/DataTableContainer"
import { EmptyState } from "@/components/common/EmptyState"
import { StatusBadge } from "@/components/common/StatusBadge"
import type { StatusType } from "@/components/common/StatusBadge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const [filterStatus, setFilterStatus] = useState("todos")
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
        const matchesSearch = !value || (
          normalizeSearchText(proveedor.razonSocial).includes(value) ||
          (normalizedRutQuery.length > 0 && rut.includes(normalizedRutQuery)) ||
          normalizeSearchText(proveedor.giro).includes(value) ||
          normalizeSearchText(proveedor.nombreFantasia).includes(value)
        )
        const estado = proveedor.estado.trim().toLocaleUpperCase("es-CL")
        const matchesStatus =
          filterStatus === "todos" ||
          (filterStatus === "activo" && estado === "ACTIVO") ||
          (filterStatus === "inactivo" && estado !== "ACTIVO")

        return matchesSearch && matchesStatus
      })
      .sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, "es-CL"))
  }, [proveedores, search, filterStatus])
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

  const handleStatusChange = (value: string) => {
    setFilterStatus(value)
    setPageIndex(0)
  }

  return (
    <DataTableContainer
      title="Directorio de proveedores"
      toolbar={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Buscar por razón social, RUT o giro..."
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              aria-label="Buscar proveedores por razón social, RUT o giro"
              className="h-10 w-full rounded-xl border-border/80 bg-background pl-10 text-sm shadow-2xs focus-visible:ring-primary/30"
            />
          </div>
          <div className="w-full shrink-0 sm:w-56">
            <Select value={filterStatus} onValueChange={handleStatusChange}>
              <SelectTrigger
                aria-label="Filtrar proveedores por estado"
                className="h-10 data-[size=default]:h-10 w-full cursor-pointer rounded-xl border-border/80 bg-background text-sm shadow-2xs sm:w-56"
              >
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      }
      description={
        !isLoading
          ? `${proveedoresFiltrados.length} ${proveedoresFiltrados.length === 1 ? "proveedor encontrado" : "proveedores encontrados"}`
          : undefined
      }
      footer={
        !isLoading && proveedoresFiltrados.length > 0 ? (
          <>
            <span>
              Página {paginaActual + 1} de {pageCount}
            </span>
            <div className="flex items-center gap-2">
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
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                Anterior
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
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
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
            title={search || filterStatus !== "todos" ? "Sin resultados" : "No se encontraron proveedores"}
            description={
              search || filterStatus !== "todos"
                ? "Prueba con otro criterio de búsqueda o cambia el estado seleccionado."
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
                    animateDot={proveedor.estado.trim().toUpperCase() === "ACTIVO"}
                  />
                </TableCell>

                <TableCell className="text-right">
                  <div
                      className="flex justify-end"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <RowActionsMenu
                        ariaLabel={`Acciones para ${proveedor.razonSocial}`}
                        groups={[
                          {
                            actions: [
                              {
                                label: "Ver detalle",
                                icon: Eye,
                                onSelect: () => onView(proveedor),
                              },
                              {
                                label: "Editar",
                                icon: Pencil,
                                onSelect: () => onEdit(proveedor),
                              },
                              {
                                label: "Asociar productos",
                                icon: PackageCheck,
                                hidden: !canAssociateProducts,
                                onSelect: () => onAssociateProducts(proveedor),
                              },
                            ],
                          },
                          {
                            label: "Cambiar estado",
                            actions: [
                              {
                                label: "Inactivar proveedor",
                                icon: PowerOff,
                                variant: "destructive",
                                onSelect: () => onDelete(proveedor),
                              },
                            ],
                          },
                        ]}
                      />
                    </div>
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
