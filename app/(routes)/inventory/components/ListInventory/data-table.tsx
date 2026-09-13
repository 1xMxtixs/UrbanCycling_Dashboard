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
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Package,
  Search,
  X,
} from "lucide-react"

import type { ProductColumn } from "./columns"
import type { InventoryCategory } from "../../types"
import { KpiCards } from "./kpi-cards"

interface DataTableProps {
  columns: ColumnDef<ProductColumn>[]
  data: ProductColumn[]
  categories: InventoryCategory[]
}

type ProductIdSearchStatus =
  | "idle"
  | "invalid"
  | "loading"
  | "found"
  | "not-found"
  | "error"

export function DataTable({
  columns,
  data,
  categories,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("all")
  const [productIdQuery, setProductIdQuery] = React.useState("")
  const [productIdResult, setProductIdResult] =
    React.useState<ProductColumn | null>(null)
  const [productIdSearchStatus, setProductIdSearchStatus] =
    React.useState<ProductIdSearchStatus>("idle")
  const [productIdSearchMessage, setProductIdSearchMessage] = React.useState("")
  const searchRequestId = React.useRef(0)

  const clearProductIdSearch = () => {
    searchRequestId.current += 1
    setProductIdQuery("")
    setProductIdResult(null)
    setProductIdSearchStatus("idle")
    setProductIdSearchMessage("")
  }

  const handleProductIdSearch = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const normalizedProductId = productIdQuery.trim()

    if (!normalizedProductId) {
      setProductIdResult(null)
      setProductIdSearchStatus("invalid")
      setProductIdSearchMessage("Debe ingresar el código del producto.")
      return
    }

    const productId = Number(normalizedProductId)
    if (
      !/^\d+$/.test(normalizedProductId) ||
      !Number.isSafeInteger(productId) ||
      productId <= 0
    ) {
      setProductIdResult(null)
      setProductIdSearchStatus("invalid")
      setProductIdSearchMessage("El código debe ser un número entero positivo.")
      return
    }

    const requestId = searchRequestId.current + 1
    searchRequestId.current = requestId
    setProductIdResult(null)
    setProductIdSearchStatus("loading")
    setProductIdSearchMessage("")

    try {
      const response = await fetch(
        `/api/inventory?idProducto=${encodeURIComponent(normalizedProductId)}`,
        { cache: "no-store" }
      )
      const responseData = await response.json().catch(() => null)

      if (requestId !== searchRequestId.current) {
        return
      }

      if (response.ok) {
        setProductIdResult(responseData as ProductColumn)
        setProductIdSearchStatus("found")
        return
      }

      setProductIdSearchStatus(
        responseData?.code === "PRODUCTO_NO_ENCONTRADO" ? "not-found" : "error"
      )
      setProductIdSearchMessage(
        responseData?.message ?? "No fue posible buscar el producto."
      )
    } catch {
      if (requestId !== searchRequestId.current) {
        return
      }

      setProductIdSearchStatus("error")
      setProductIdSearchMessage(
        "No fue posible buscar el producto. Intenta nuevamente."
      )
    }
  }

  const categoryFilteredData = React.useMemo(() => {
    const productIdSearchData =
      productIdSearchStatus === "found" && productIdResult
        ? [productIdResult]
        : productIdSearchStatus === "loading" ||
            productIdSearchStatus === "not-found" ||
            productIdSearchStatus === "error"
          ? []
          : data

    return selectedCategoryId === "all"
      ? productIdSearchData
      : productIdSearchData.filter((product) =>
          product.categoriasProducto?.some(
            (category) => String(category.idCategoria) === selectedCategoryId
          )
        )
  }, [data, productIdResult, productIdSearchStatus, selectedCategoryId])

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
  const searchValue = (table.getColumn("nombre")?.getFilterValue() as string) ?? ""

  return (
    <div className="space-y-6">
      <KpiCards data={data} />

      <DataTableContainer
        title="Catálogo de Productos"
        description={`${table.getFilteredRowModel().rows.length} ${table.getFilteredRowModel().rows.length === 1 ? "producto encontrado" : "productos encontrados"}`}
        toolbar={
          <div className="space-y-3">
            <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
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

              <form
                className="flex w-full gap-2 lg:w-80"
                onSubmit={handleProductIdSearch}
              >
                <div className="relative flex-1">
                  <Input
                    aria-describedby={
                      productIdSearchMessage
                        ? "product-id-search-message"
                        : undefined
                    }
                    aria-invalid={productIdSearchStatus === "invalid"}
                    inputMode="numeric"
                    placeholder="Buscar por código..."
                    value={productIdQuery}
                    onChange={(event) => {
                      searchRequestId.current += 1
                      setProductIdQuery(event.target.value)
                      setProductIdResult(null)
                      setProductIdSearchStatus("idle")
                      setProductIdSearchMessage("")
                    }}
                    className="pr-9"
                  />
                  {(productIdQuery || productIdSearchStatus !== "idle") && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 h-9 w-9"
                      onClick={clearProductIdSearch}
                      aria-label="Limpiar búsqueda por código"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={productIdSearchStatus === "loading"}
                  className="h-9 shrink-0"
                >
                  {productIdSearchStatus === "loading" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="sr-only sm:not-sr-only sm:ml-2">Buscar</span>
                </Button>
              </form>
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

            {productIdSearchMessage && (
              <p
                id="product-id-search-message"
                aria-live="polite"
                className="text-xs text-destructive"
              >
                {productIdSearchMessage}
              </p>
            )}

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
                productIdSearchStatus === "loading"
                  ? "Buscando el producto por código..."
                  : productIdSearchStatus === "not-found"
                    ? productIdSearchMessage
                    : productIdSearchStatus === "error"
                      ? productIdSearchMessage
                      : selectedCategoryId !== "all"
                        ? "No hay productos asociados a la categoría seleccionada."
                        : searchValue
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
