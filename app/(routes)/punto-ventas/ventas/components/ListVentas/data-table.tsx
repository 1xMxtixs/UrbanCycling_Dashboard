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
import { ChevronLeft, ChevronRight, ShoppingBag, Search } from "lucide-react"
import { SaleOperation } from "../../types"

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

  const filteredRowCount = table.getFilteredRowModel().rows.length

  return (
    <DataTableContainer
      toolbar={
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID o Cliente..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9"
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
              <SelectTrigger className="h-9 w-full sm:w-48">
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

          <p className="text-xs text-muted-foreground">
            {filteredRowCount} {filteredRowCount === 1 ? "venta encontrada" : "ventas encontradas"}
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
            icon={ShoppingBag}
            title="No se encontraron ventas"
            description={
              globalFilter
                ? "No hay ventas que coincidan con el término de búsqueda ingresado."
                : "No hay ventas registradas en este estado."
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
