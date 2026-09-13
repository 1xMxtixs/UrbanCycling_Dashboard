"use client"

import React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTableContainer } from "@/components/common/DataTableContainer"
import { EmptyState } from "@/components/common/EmptyState"
import { ArrowLeftRight, ChevronLeft, ChevronRight, Search } from "lucide-react"
import type { MovementColumn } from "./columns"

interface DataTableProps {
  columns: ColumnDef<MovementColumn>[]
  data: MovementColumn[]
}

export function DataTable({ columns, data }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    state: { columnFilters, sorting },
  })

  const filteredRowCount = table.getFilteredRowModel().rows.length
  const searchValue = (table.getColumn("producto")?.getFilterValue() as string) ?? ""

  return (
    <DataTableContainer
      title="Historial de Movimientos"
      description={`${filteredRowCount} ${filteredRowCount === 1 ? "movimiento encontrado" : "movimientos encontrados"}`}
      toolbar={
        <div className="space-y-3">
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por producto..."
                value={searchValue}
                onChange={(e) => table.getColumn("producto")?.setFilterValue(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={(table.getColumn("tipoMovimiento")?.getFilterValue() as string) ?? "all"}
              onValueChange={(val) => table.getColumn("tipoMovimiento")?.setFilterValue(val === "all" ? "" : val)}
            >
              <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue placeholder="Operación: Todas" /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Todas las operaciones</SelectItem>
                <SelectItem value="ENTRADA">Solo Entradas</SelectItem>
                <SelectItem value="SALIDA">Solo Salidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      }
      footer={
        filteredRowCount > 0 ? (
          <>
            <div>Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}</div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="h-8 px-2">
                <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="h-8 px-2">
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
            icon={ArrowLeftRight}
            title="No se encontraron movimientos"
            description={
              searchValue || table.getColumn("tipoMovimiento")?.getFilterValue()
                ? "No hay movimientos que coincidan con los filtros aplicados."
                : "No hay movimientos de bodega registrados."
            }
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTableContainer>
  )
}
