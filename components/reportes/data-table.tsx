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

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right"
  }
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  emptyMessage?: string
  bordered?: boolean
}

export function DataTable<TData>({
  columns,
  data,
  emptyMessage = "No hay datos para mostrar.",
  bordered = true,
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
    <div className={cn("w-full overflow-hidden", bordered && "rounded-md border border-border")}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortDir = header.column.getIsSorted()
                  const right = header.column.columnDef.meta?.align === "right"
                  const headerTitle =
                    typeof header.column.columnDef.header === "string"
                      ? header.column.columnDef.header
                      : header.id
                  const nextSortDirection =
                    sortDir === "asc" ? "descendente" : "ascendente"

                  return (
                    <TableHead
                      key={header.id}
                      className={cn("h-10 text-xs font-semibold text-muted-foreground", right && "text-right")}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={() =>
                            header.column.toggleSorting(sortDir === "asc")
                          }
                          aria-label={`Ordenar por ${headerTitle} en orden ${nextSortDirection}`}
                          className={cn("flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-colors duration-150 motion-reduce:transition-none hover:text-foreground", right && "ml-auto")}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                            {sortDir === "asc" && (
                              <ArrowUp className="h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none" />
                            )}
                            {sortDir === "desc" && (
                              <ArrowDown className="h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none" />
                            )}
                            {!sortDir && (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-40 transition-opacity duration-150 motion-reduce:transition-none" />
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
                    "border-border/60 transition-colors duration-150 motion-reduce:transition-none",
                    "hover:bg-muted/40"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cn("py-2.5", cell.column.columnDef.meta?.align === "right" && "text-right")}>
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
    </div>
  )
}
