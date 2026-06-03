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
import { Button } from "@/components/ui/button"
import { type WorkOrder } from "./kpi-cards"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onViewDetails: (order: WorkOrder) => void
  onStatusChange: (orderId: number, nextStatus: string) => void
  updatingId: number | null
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onViewDetails,
  onStatusChange,
  updatingId,
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

  return (
    <div className="mt-4 rounded-lg bg-background p-4 shadow-md border border-slate-100 dark:border-slate-800">
      <div className="mb-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por ID, Cliente o Bicicleta..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
            />
          </div>

          <select
            className="border rounded-md px-3 py-2 h-10 bg-background text-sm cursor-pointer border-slate-200 focus:outline-none focus:ring-2 focus:ring-black transition-all"
            value={
              (table.getColumn("estadoOrden")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("estadoOrden")?.setFilterValue(event.target.value)
            }
          >
            <option value="">Todos los estados</option>
            <option value="por-realizar">Por realizar</option>
            <option value="activa">Activas (En curso)</option>
            <option value="espera">En Espera</option>
            <option value="completada">Completadas</option>
            <option value="retrasada">Retrasadas</option>
          </select>
        </div>

        <p className="text-xs text-slate-500 font-semibold">
          {table.getFilteredRowModel().rows.length} resultados encontrados
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-slate-500 dark:text-slate-400">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
