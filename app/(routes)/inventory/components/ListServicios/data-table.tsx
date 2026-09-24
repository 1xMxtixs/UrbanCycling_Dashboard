"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableContainer } from "@/components/common/DataTableContainer"
import { EmptyState } from "@/components/common/EmptyState"
import { Search, Wrench, ChevronLeft, ChevronRight } from "lucide-react"
import { ServiceKpiCards } from "./service-kpi-cards"
import { type ServiceColumn } from "../../types"

interface DataTableProps<TData extends ServiceColumn, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onViewDetails?: (id: number) => void
  onEdit?: (id: number) => void
  onToggleStatus?: (id: number) => Promise<void>
}

export function DataTable<TData extends ServiceColumn, TValue>({
  columns,
  data,
  onViewDetails,
  onEdit,
  onToggleStatus,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([
    { id: "estado", value: "activo" },
  ])
  const [serviceSearch, setServiceSearch] = React.useState("")
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filtrado de búsqueda exactamente como en productos
  const filteredData = React.useMemo(() => {
    const q = serviceSearch.trim().toLowerCase()
    if (!q) return data

    return data.filter(
      (service) =>
        service.nombre.toLowerCase().includes(q) ||
        service.codigo.toLowerCase().includes(q) ||
        (service.descripcion && service.descripcion.toLowerCase().includes(q))
    )
  }, [data, serviceSearch])

  const table = useReactTable({
    data: filteredData,
    columns,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    meta: {
      onViewDetails,
      onEdit,
      onToggleStatus,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  if (!isMounted) {
    return null
  }

  const filteredRowCount = table.getFilteredRowModel().rows.length

  return (
    <div className="space-y-6">
      {/* KPI Cards idénticas en diseño a las de productos */}
      <ServiceKpiCards data={data} />

      <DataTableContainer
        title="Catálogo de Servicios"
        description={`${filteredRowCount} ${filteredRowCount === 1 ? "servicio encontrado" : "servicios encontrados"}`}
        toolbar={
          <div className="space-y-3">
            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, código o labor..."
                  value={serviceSearch}
                  onChange={(event) => setServiceSearch(event.target.value)}
                  className="pl-9 h-9 rounded-lg"
                />
              </div>

              <Select
                value={
                  (table.getColumn("estado")?.getFilterValue() as string) ?? "activo"
                }
                onValueChange={(value) =>
                  table.getColumn("estado")?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="h-9 w-full sm:w-44 rounded-lg">
                  <SelectValue placeholder="Solo Activos" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="activo">Solo Activos</SelectItem>
                  <SelectItem value="inactivo">Solo Inactivos</SelectItem>
                  <SelectItem value="all">Todos los estados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              {filteredRowCount} {filteredRowCount === 1 ? "servicio encontrado" : "servicios encontrados"}
            </p>
          </div>
        }
        footer={
          filteredRowCount > 0 ? (
            <>
              <div>
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 px-2 rounded-lg"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 px-2 rounded-lg"
                >
                  Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : null
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-64 text-center"
                  >
                    <EmptyState
                      icon={Wrench}
                      title="No se encontraron servicios"
                      description="No hay registros que coincidan con los filtros o término de búsqueda ingresado."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DataTableContainer>
    </div>
  )
}
