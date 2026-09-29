"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { useState } from "react";

import {
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DataTableContainer,
} from "@/components/common/DataTableContainer";

import {
  EmptyState,
} from "@/components/common/EmptyState";

import type { Garantia } from "../types";
import type { GarantiasTableMeta } from "./columns";

interface DataTableProps {
  columns: ColumnDef<Garantia>[];
  data: Garantia[];
  meta?: GarantiasTableMeta;
}

export function DataTable({
  columns,
  data,
  meta,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,

    state: {
      sorting,
      columnFilters,
    },

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,

    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),

    initialState: {
      pagination: {
        pageSize: 8,
      },
    },

    meta,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Buscar garantía, cliente u orden..."
            value={
              (table
                .getColumn("cliente")
                ?.getFilterValue() as string) ?? ""
            }
            onChange={(event) => {
              table
                .getColumn("cliente")
                ?.setFilterValue(event.target.value);
            }}
            className="h-10 rounded-xl pl-9"
          />
        </div>

        <div className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} solicitudes
        </div>
      </div>

      <DataTableContainer>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap"
                  >
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
                  data-state={
                    row.getIsSelected() && "selected"
                  }
                  className="hover:bg-muted/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-3"
                    >
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
                  className="h-48"
                >
                  <EmptyState
                    icon={ShieldCheck}
                    title="No hay solicitudes de garantía"
                    description="No se encontraron solicitudes que coincidan con la búsqueda."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DataTableContainer>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Página{" "}
          {table.getState().pagination.pageIndex + 1} de{" "}
          {Math.max(table.getPageCount(), 1)}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-xl cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-xl cursor-pointer"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}