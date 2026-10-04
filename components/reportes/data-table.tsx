"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  emptyMessage?: string
}

export function DataTable<TData>({
  columns,
  data,
  emptyMessage = "No hay datos para mostrar.",
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sortDir = header.column.getIsSorted()

                return (
                  <TableHead
                    key={header.id}
                    className="h-10 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={() =>
                          header.column.toggleSorting(sortDir === "asc")
                        }
                        className="flex items-center gap-1 transition-colors duration-150 hover:text-foreground"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                          {sortDir === "asc" && (
                            <ArrowUp className="h-3.5 w-3.5 transition-transform duration-200" />
                          )}
                          {sortDir === "desc" && (
                            <ArrowDown className="h-3.5 w-3.5 transition-transform duration-200" />
                          )}
                          {!sortDir && (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-40 transition-opacity duration-150" />
                          )}
                        </span>
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "border-border/60 transition-colors duration-150",
                  "hover:bg-muted/40"
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
