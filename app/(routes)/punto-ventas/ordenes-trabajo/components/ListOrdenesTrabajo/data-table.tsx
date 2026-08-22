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
import { DataTableContainer } from "@/components/DataTableContainer"
import { EmptyState } from "@/components/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ClipboardList, Search } from "lucide-react"
import { WorkOrder } from "../../types"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onViewDetails: (order: WorkOrder) => void
  onStatusChange: (orderId: number, nextStatus: string) => void
  updatingId: number | null
  onPayClick?: (order: WorkOrder) => void
  onGenerateReceipt?: (order: WorkOrder) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onViewDetails,
  onStatusChange,
  updatingId,
  onPayClick,
  onGenerateReceipt,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

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
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
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
      toolbar={
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
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
              <SelectTrigger className="h-9 w-full sm:w-48">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="por-realizar">Por realizar</SelectItem>
                <SelectItem value="activa">Activas (En curso)</SelectItem>
                <SelectItem value="espera">En Espera</SelectItem>
                <SelectItem value="por-entregar">Por entregar</SelectItem>
                <SelectItem value="completada">Completadas</SelectItem>
                <SelectItem value="retrasada">Retrasadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredRowCount} {filteredRowCount === 1 ? "orden encontrada" : "órdenes encontradas"}
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
            title="No se encontraron órdenes"
            description={
              globalFilter
                ? "No hay órdenes que coincidan con el término de búsqueda ingresado."
                : "No hay órdenes de trabajo registradas en este estado."
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

