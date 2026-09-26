"use client"

import React from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Input } from "@/components/ui/input"
import { DataTableContainer } from "@/components/common/DataTableContainer"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarRange, ChevronLeft, ChevronRight, ClipboardList, Search, X } from "lucide-react"
import { WorkOrder } from "../../types"
import { includesNormalizedText } from "@/lib/search-normalization"

type PeriodFilterProps = {
  draft: {
    fechaInicio: string
    fechaFin: string
  }
  errors: {
    fechaInicio?: string
    fechaFin?: string
  }
  applied: {
    fechaInicio: string
    fechaFin: string
  } | null
  isApplying: boolean
  onChange: (field: "fechaInicio" | "fechaFin", value: string) => void
  onApply: () => void
  onClear: () => void
}

type EmptyStateProps = {
  title: string
  description: string
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onViewDetails: (order: WorkOrder) => void
  onStatusChange: (orderId: number, nextStatus: string) => void
  updatingId: number | null
  onPayClick?: (order: WorkOrder) => void
  onGenerateReceipt?: (order: WorkOrder) => void
  onRescheduleClick?: (order: WorkOrder) => void
  onCancelClick?: (order: WorkOrder) => void
  onAssignSuppliesClick?: (order: WorkOrder) => void
  onAuditClick?: (order: WorkOrder) => void
  onModifyServiceClick?: (order: WorkOrder) => void
  periodFilter: PeriodFilterProps
  emptyState?: EmptyStateProps
  initialSearch?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onViewDetails,
  onStatusChange,
  updatingId,
  onPayClick,
  onGenerateReceipt,
  onRescheduleClick,
  onCancelClick,
  onAssignSuppliesClick,
  onAuditClick,
  onModifyServiceClick,
  periodFilter,
  emptyState,
  initialSearch = "",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  React.useEffect(() => {
    setGlobalFilter(initialSearch)
  }, [initialSearch])

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: 8,
      },
    },
    meta: {
      onViewDetails,
      onStatusChange,
      updatingId,
      onPayClick,
      onGenerateReceipt,
      onRescheduleClick,
      onCancelClick,
      onAssignSuppliesClick,
      onAuditClick,
      onModifyServiceClick,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) =>
      row
        .getAllCells()
        .some((cell) =>
          includesNormalizedText(String(cell.getValue() ?? ""), String(filterValue ?? "")),
        ),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  if (!isMounted) {
    return null
  }

  const filteredRowCount = table.getFilteredRowModel().rows.length

  return (
    <DataTableContainer
      title="Órdenes de Trabajo"
      description={`${filteredRowCount} ${filteredRowCount === 1 ? "orden encontrada" : "órdenes encontradas"}`}
      toolbar={
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, Cliente o Bicicleta..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={
                (table.getColumn("estadoOrden")?.getFilterValue() as string) ?? "all"
              }
              onValueChange={(value) =>
                table.getColumn("estadoOrden")?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="h-9 w-full sm:w-56">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="por-realizar">Por realizar</SelectItem>
                <SelectItem value="activa">Activas (En curso)</SelectItem>
                <SelectItem value="espera">En Espera</SelectItem>
                <SelectItem value="por-entregar">Por entregar</SelectItem>
                <SelectItem value="completada">Completadas (Entregadas)</SelectItem>
                <SelectItem value="anulada">Anuladas</SelectItem>
                <SelectItem value="retrasada">Retrasadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <CalendarRange className="h-4 w-4 text-primary" />
              Filtrar por período
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] lg:items-end">
              <div className="space-y-1.5">
                <label htmlFor="fechaInicio" className="text-xs font-medium text-muted-foreground">
                  Desde
                </label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={periodFilter.draft.fechaInicio}
                  aria-invalid={Boolean(periodFilter.errors.fechaInicio)}
                  onChange={(event) => periodFilter.onChange("fechaInicio", event.target.value)}
                />
                {periodFilter.errors.fechaInicio && (
                  <p className="text-xs text-destructive">{periodFilter.errors.fechaInicio}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="fechaFin" className="text-xs font-medium text-muted-foreground">
                  Hasta
                </label>
                <Input
                  id="fechaFin"
                  type="date"
                  value={periodFilter.draft.fechaFin}
                  aria-invalid={Boolean(periodFilter.errors.fechaFin)}
                  onChange={(event) => periodFilter.onChange("fechaFin", event.target.value)}
                />
                {periodFilter.errors.fechaFin && (
                  <p className="text-xs text-destructive">{periodFilter.errors.fechaFin}</p>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={periodFilter.onApply}
                disabled={periodFilter.isApplying}
              >
                {periodFilter.isApplying ? "Filtrando..." : "Aplicar filtro"}
              </Button>
              {periodFilter.applied && (
                <Button type="button" size="sm" variant="outline" onClick={periodFilter.onClear}>
                  <X className="h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>
            {periodFilter.applied && (
              <p className="mt-3 text-xs text-muted-foreground">
                Período aplicado: {periodFilter.applied.fechaInicio} al {periodFilter.applied.fechaFin}.
              </p>
            )}
          </div>
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
                className="h-8 px-2"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 px-2"
              >
                Siguiente <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </>
        ) : undefined
      }
    >
      {filteredRowCount === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={ClipboardList}
            title={emptyState?.title || "No se encontraron órdenes"}
            description={
              emptyState?.description ||
              (globalFilter
                ? "No hay órdenes que coincidan con el término de búsqueda ingresado."
                : "No hay órdenes de trabajo registradas en este estado.")
            }
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTableContainer>
  )
}
