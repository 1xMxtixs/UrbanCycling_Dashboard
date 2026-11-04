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
import { DataTableContainer } from "@/components/common/DataTableContainer"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { ESTADO_PAGO } from "@/lib/payment-status"
import { formatClientName } from "@/lib/formatters"
import { includesNormalizedText, normalizeSearchText } from "@/lib/search-normalization"
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
  onCancelClick?: (op: SaleOperation) => void
  initialSearch?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onViewDetails,
  onUpdateStatus,
  updatingId,
  onPayClick,
  onGenerateReceipt,
  onCancelClick,
  initialSearch = "",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sincroniza el filtro al llegar desde el buscador transversal, incluso si
  // la lista de ventas ya estaba montada antes del cambio de URL.
  React.useEffect(() => {
    const filterTimer = window.setTimeout(() => {
      setGlobalFilter(initialSearch)
    }, 0)

    return () => window.clearTimeout(filterTimer)
  }, [initialSearch])

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
      onUpdateStatus,
      updatingId,
      onPayClick,
      onGenerateReceipt,
      onCancelClick,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "").trim().replace(/^#/, "").trim()
      if (!query) return true

      const sale = row.original as SaleOperation
      const clientName = sale.cliente
        ? formatClientName(sale.cliente)
        : "Cliente general"
      const productNames = sale.venta?.lineasDeVenta?.map((line) => line.producto?.nombre ?? "") ?? []
      const matchesText = [
        String(sale.venta?.idVenta ?? ""),
        clientName,
        sale.cliente?.rut ?? "",
        ...productNames,
      ].some((value) => includesNormalizedText(value, query))

      const normalizedQuery = normalizeSearchText(query).replace(/[.\-\s]/g, "")
      const normalizedRut = normalizeSearchText(sale.cliente?.rut).replace(/[.\-\s]/g, "")
      const matchesRut = normalizedQuery.length >= 3 && normalizedRut.includes(normalizedQuery)

      return matchesText || matchesRut
    },
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
      title="Registro de Ventas"
      description={`${filteredRowCount} ${filteredRowCount === 1 ? "venta encontrada" : "ventas encontradas"}`}
      toolbar={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Buscar por N.º de venta, cliente o producto…"
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                aria-label="Buscar ventas por número, cliente o producto"
                className="h-10 w-full rounded-xl border-border/80 bg-background pl-10 text-sm shadow-2xs focus-visible:ring-primary/30"
              />
            </div>

            <div className="w-full shrink-0 sm:w-56">
            <Select
              value={
                (table.getColumn("estadoPago")?.getFilterValue() as string) ?? "all"
              }
              onValueChange={(value) =>
                table.getColumn("estadoPago")?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="h-10 data-[size=default]:h-10 w-full rounded-xl border-border/80 bg-background text-sm shadow-2xs sm:w-56" aria-label="Filtrar por estado de pago">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value={ESTADO_PAGO.PAGADA}>Pagadas</SelectItem>
                <SelectItem value={ESTADO_PAGO.PENDIENTE}>Pendientes</SelectItem>
                <SelectItem value={ESTADO_PAGO.PARCIAL}>Parciales</SelectItem>
                <SelectItem value={ESTADO_PAGO.REEMBOLSADA}>Reembolsadas</SelectItem>
                <SelectItem value={ESTADO_PAGO.ANULADA}>Anuladas</SelectItem>
              </SelectContent>
            </Select>
            </div>
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
              <TableRow
                key={row.id}
                className="cursor-pointer"
                tabIndex={0}
                aria-label={`Ver detalle de venta #${(row.original as SaleOperation).venta.idVenta}`}
                onClick={() => onViewDetails(row.original as SaleOperation)}
                onKeyDown={(event) => {
                  if (
                    event.target === event.currentTarget &&
                    (event.key === "Enter" || event.key === " ")
                  ) {
                    event.preventDefault()
                    onViewDetails(row.original as SaleOperation)
                  }
                }}
              >
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
