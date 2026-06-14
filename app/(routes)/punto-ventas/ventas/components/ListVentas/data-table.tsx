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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SaleOperation } from "./columns"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onViewDetails: (op: SaleOperation) => void
  onUpdateStatus: (idVenta: number, nextStatus: string, estadoVenta: string) => void
  updatingId: number | null
  onPayClick?: (idVenta: number, total: number) => void
  onGenerateReceipt?: (op: SaleOperation) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onViewDetails,
  onUpdateStatus,
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
      meta: {
        onViewDetails,
        onUpdateStatus,
        updatingId,
        onPayClick,
        onGenerateReceipt,
      },
      pagination: {
        pageSize: 8,
      },
    } as any,
    meta: {
      onViewDetails,
      onUpdateStatus,
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

  return (
    <div className="mt-4 rounded-lg bg-background p-4 shadow-md border border-slate-100 dark:border-slate-800 animate-in fade-in duration-300">
      <div className="mb-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar por ID o Cliente..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
            />
          </div>

          <Select
            value={
              (table.getColumn("estadoPago")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table.getColumn("estadoPago")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-56 h-10 border border-slate-200 bg-background text-sm">
              <SelectValue placeholder="Todos los estados de pago" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">Todos los estados de pago</SelectItem>
              <SelectItem value="pagada">Pagadas</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="anulada">Anuladas</SelectItem>
            </SelectContent>
          </Select>
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
