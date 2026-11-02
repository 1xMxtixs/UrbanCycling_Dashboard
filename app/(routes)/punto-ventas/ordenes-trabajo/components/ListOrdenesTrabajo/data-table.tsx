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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  onApply: () => Promise<boolean>
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
  const [periodOpen, setPeriodOpen] = React.useState(false)

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
      title="Listado de órdenes"
      description={`${filteredRowCount} ${filteredRowCount === 1 ? "orden encontrada" : "órdenes encontradas"}`}
      toolbar={
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
            value={(table.getColumn("estadoOrden")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => table.getColumn("estadoOrden")?.setFilterValue(value === "all" ? "" : value)}
          >
            <SelectTrigger className="h-9 w-full sm:w-56"><SelectValue placeholder="Todos los estados" /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="por-realizar">Por realizar</SelectItem>
              <SelectItem value="activa">En curso</SelectItem>
              <SelectItem value="espera">En espera</SelectItem>
              <SelectItem value="por-entregar">Por entregar</SelectItem>
              <SelectItem value="completada">Completadas (Entregadas)</SelectItem>
              <SelectItem value="anulada">Anuladas</SelectItem>
              <SelectItem value="retrasada">Retrasadas</SelectItem>
            </SelectContent>
          </Select>
          <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
            <div className="flex items-center gap-1">
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-9 gap-2">
                  <CalendarRange className="h-4 w-4" aria-hidden="true" />
                  {periodFilter.applied
                    ? `${new Date(`${periodFilter.applied.fechaInicio}T00:00:00`).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })} – ${new Date(`${periodFilter.applied.fechaFin}T00:00:00`).toLocaleDateString("es-CL", { day: "2-digit", month: "short" })}`
                    : "Período"}
                </Button>
              </PopoverTrigger>
              {periodFilter.applied && (
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Limpiar período" onClick={() => { void periodFilter.onClear(); setPeriodOpen(false) }}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
            </div>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label htmlFor="fechaInicio" className="text-xs font-medium text-muted-foreground">Desde</label>
                  <Input id="fechaInicio" type="date" value={periodFilter.draft.fechaInicio} aria-invalid={Boolean(periodFilter.errors.fechaInicio)} aria-describedby={periodFilter.errors.fechaInicio ? "fechaInicio-error" : undefined} onChange={(event) => periodFilter.onChange("fechaInicio", event.target.value)} />
                  {periodFilter.errors.fechaInicio && <p id="fechaInicio-error" className="text-xs text-destructive">{periodFilter.errors.fechaInicio}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="fechaFin" className="text-xs font-medium text-muted-foreground">Hasta</label>
                  <Input id="fechaFin" type="date" value={periodFilter.draft.fechaFin} aria-invalid={Boolean(periodFilter.errors.fechaFin)} aria-describedby={periodFilter.errors.fechaFin ? "fechaFin-error" : undefined} onChange={(event) => periodFilter.onChange("fechaFin", event.target.value)} />
                  {periodFilter.errors.fechaFin && <p id="fechaFin-error" className="text-xs text-destructive">{periodFilter.errors.fechaFin}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  {periodFilter.applied && <Button type="button" size="sm" variant="ghost" onClick={() => { void periodFilter.onClear(); setPeriodOpen(false) }}>Limpiar</Button>}
                  <Button type="button" size="sm" onClick={async () => { if (await periodFilter.onApply()) setPeriodOpen(false) }} disabled={periodFilter.isApplying}>
                    {periodFilter.isApplying ? "Filtrando..." : "Aplicar filtro"}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
                  <TableHead key={header.id} className={header.id === "acciones" ? "text-right" : undefined}>
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
              <TableRow
                key={row.id}
                className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                tabIndex={0}
                onClick={() => onViewDetails(row.original as WorkOrder)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    onViewDetails(row.original as WorkOrder)
                  }
                }}
              >
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
