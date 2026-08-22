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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTableContainer } from "@/components/DataTableContainer"
import { EmptyState } from "@/components/EmptyState"
import { ChevronLeft, ChevronRight, Package, Search } from "lucide-react"

import type { ProductColumn } from "./columns"
import { KpiCards } from "./kpi-cards"

interface DataTableProps {
  columns: ColumnDef<ProductColumn>[]
  data: ProductColumn[]
}

export function DataTable({
  columns,
  data,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      sorting,
    },
  })

  const filteredRowCount = table.getFilteredRowModel().rows.length
  const searchValue = (table.getColumn("nombre")?.getFilterValue() as string) ?? ""

  return (
    <div className="space-y-6">
      <KpiCards data={data} />

      <DataTableContainer
        toolbar={
          <div className="space-y-3">
            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto por nombre..."
                  value={searchValue}
                  onChange={(event) =>
                    table.getColumn("nombre")?.setFilterValue(event.target.value)
                  }
                  className="pl-9"
                />
              </div>

              <Select
                value={
                  (table.getColumn("estado")?.getFilterValue() as string) ?? "all"
                }
                onValueChange={(value) =>
                  table.getColumn("estado")?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="h-9 w-full sm:w-40">
                  <SelectValue placeholder="Estado: Todos" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="activo">Solo Activos</SelectItem>
                  <SelectItem value="inactivo">Solo Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              {filteredRowCount} {filteredRowCount === 1 ? "producto encontrado" : "productos encontrados"}
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
              icon={Package}
              title="No se encontraron productos"
              description={
                searchValue
                  ? "No hay productos que coincidan con la búsqueda ingresada."
                  : "No hay productos registrados en el inventario."
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
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTableContainer>
    </div>
  )
}

