"use client";

import {
  ColumnDef,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  meta?: {
    onViewDetails?: (
      id: number
    ) => void;

    onEdit?: (
      id: number
    ) => void;

    onResolve?: (
      id: number
    ) => void;
  };
}

export function DataTable<
  TData,
  TValue
>({
  columns,
  data,
  meta,
}: DataTableProps<
  TData,
  TValue
>) {
  const [
    sorting,
    setSorting,
  ] = useState<SortingState>(
    []
  );

  const table =
    useReactTable({
      data,
      columns,

      state: {
        sorting,
      },

      onSortingChange:
        setSorting,

      getCoreRowModel:
        getCoreRowModel(),

      getSortedRowModel:
        getSortedRowModel(),

      getFilteredRowModel:
        getFilteredRowModel(),

      getPaginationRowModel:
        getPaginationRowModel(),

      meta,
    });

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table
              .getHeaderGroups()
              .map(
                (headerGroup) => (
                  <TableRow
                    key={
                      headerGroup.id
                    }
                  >
                    {headerGroup.headers.map(
                      (header) => (
                        <TableHead
                          key={
                            header.id
                          }
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header
                                  .column
                                  .columnDef
                                  .header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    )}
                  </TableRow>
                )
              )}
          </TableHeader>

          <TableBody>
            {table.getRowModel()
              .rows.length ? (
              table
                .getRowModel()
                .rows.map(
                  (row) => (
                    <TableRow
                      key={row.id}
                    >
                      {row
                        .getVisibleCells()
                        .map(
                          (cell) => (
                            <TableCell
                              key={
                                cell.id
                              }
                            >
                              {flexRender(
                                cell
                                  .column
                                  .columnDef
                                  .cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          )
                        )}
                    </TableRow>
                  )
                )
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length
                  }
                  className="h-24 text-center"
                >
                  No hay garantías registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}