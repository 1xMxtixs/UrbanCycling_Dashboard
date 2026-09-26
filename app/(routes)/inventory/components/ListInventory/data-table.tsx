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
import { DataTableContainer } from "@/components/common/DataTableContainer"
import { EmptyState } from "@/components/common/EmptyState"
import { ChevronLeft, ChevronRight, Package, Search } from "lucide-react"

import type { ProductColumn } from "./columns"
import type { InventoryCategory } from "../../types"
import { KpiCards } from "./kpi-cards"
import { includesNormalizedText, normalizeSearchText } from "@/lib/search-normalization"

interface DataTableProps {
  columns: ColumnDef<ProductColumn>[]
  data: ProductColumn[]
  categories: InventoryCategory[]
  initialSearch?: string
}

type ProductSearch =
  | { type: "all" }
  | { type: "id"; id: number }
  | { type: "name"; query: string }
  | { type: "invalid-id"; message: string }

function parseProductSearch(value: string): ProductSearch {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return { type: "all" }
  }

  if (!trimmedValue.startsWith("#")) {
    return { type: "name", query: normalizeSearchText(trimmedValue) }
  }

  const idValue = trimmedValue.slice(1).trim()
  const id = Number(idValue)

  if (
    !/^\d+$/.test(idValue) ||
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    return {
      type: "invalid-id",
      message: "Ingresa un ID numérico positivo después de #.",
    }
  }

  return { type: "id", id }
}

export function DataTable({
  columns,
  data,
  categories,
  initialSearch = "",
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("all")
  const [productSearch, setProductSearch] = React.useState(initialSearch)

  React.useEffect(() => {
    setProductSearch(initialSearch)
  }, [initialSearch])

  const productSearchState = React.useMemo(
    () => parseProductSearch(productSearch),
    [productSearch],
  )


  const categoryFilteredData = React.useMemo(() => {
    const productsByCategory =
      selectedCategoryId === "all"
        ? data
        : data.filter((product) =>
            product.categoriasProducto?.some(
              (category) => String(category.idCategoria) === selectedCategoryId
            )
          )

    if (productSearchState.type === "all") {
      return productsByCategory
    }

    if (productSearchState.type === "invalid-id") {
      return []
    }

    if (productSearchState.type === "id") {
      return productsByCategory.filter(
        (product) => product.idProducto === productSearchState.id,
      )
    }

    return productsByCategory.filter((product) =>
      includesNormalizedText(product.nombre, productSearchState.query),
    )
  }, [data, productSearchState, selectedCategoryId])

  const table = useReactTable({
    data: categoryFilteredData,
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
  return (
    <div className="space-y-6">
      <KpiCards data={data} />

      <DataTableContainer
        title="Catálogo de Productos"
        description={`${table.getFilteredRowModel().rows.length} ${table.getFilteredRowModel().rows.length === 1 ? "producto encontrado" : "productos encontrados"}`}
        toolbar={
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-describedby={
                  productSearchState.type === "invalid-id"
                    ? "product-search-help product-search-error"
                    : "product-search-help"
                }
                aria-invalid={productSearchState.type === "invalid-id"}
                placeholder="Buscar por nombre o #ID..."
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-1">
              <p id="product-search-help" className="text-xs text-muted-foreground">
                Usa # seguido del ID para una búsqueda exacta.
              </p>
              {productSearchState.type === "invalid-id" && (
                <p id="product-search-error" className="text-xs text-destructive">
                  {productSearchState.message}
                </p>
              )}
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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

              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="h-9 w-full sm:w-48">
                  <SelectValue placeholder="Categoría: Todas" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.idCategoria} value={String(category.idCategoria)}>
                      {category.nombre}
                    </SelectItem>
                  ))}
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
                productSearchState.type === "invalid-id"
                  ? productSearchState.message
                  : productSearchState.type !== "all"
                    ? "No hay productos que coincidan con la búsqueda ingresada."
                    : selectedCategoryId !== "all"
                      ? "No hay productos asociados a la categoría seleccionada."
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
