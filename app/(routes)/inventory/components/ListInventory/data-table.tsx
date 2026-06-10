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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { ProductColumn } from "./columns"

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
  const outOfStockCount = data.filter(
    (product) => product.stockActual === 0,
  ).length
  const lowStockCount = data.filter(
    (product) =>
      product.stockActual > 0 && product.stockActual <= product.stockMinimo,
  ).length

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

  return (
    <div className="rounded-lg bg-background p-4 shadow-md">
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-semibold text-destructive">
            {outOfStockCount} productos sin stock
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Productos que no tienen unidades disponibles.
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            {lowStockCount} productos con stock bajo
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Productos con stock igual o menor al minimo definido.
          </p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar producto..."
              value={
                (table.getColumn("nombre")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("nombre")?.setFilterValue(event.target.value)
              }
            />
          </div>

          <select
            className="h-8 rounded-lg border border-input bg-background px-3 text-sm"
            value={
              (table.getColumn("estado")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("estado")?.setFilterValue(event.target.value)
            }
          >
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} resultados encontrados
        </p>
      </div>

      <div className="rounded-md border">
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No se encontraron productos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2 py-4">
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
