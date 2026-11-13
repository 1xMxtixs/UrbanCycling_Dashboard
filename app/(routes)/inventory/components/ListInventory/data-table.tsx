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
  Check,
  ChevronLeft,
  ChevronRight,
  Package,
  Search,
  Truck,
  Tags,
  X,
} from "lucide-react"

import type { ProductColumn } from "./columns"
import type { InventoryCategory } from "../../types"
import { KpiCards } from "./kpi-cards"
import { ESTADO_REGISTRO } from "@/lib/registro-status"
import { includesNormalizedText } from "@/lib/search-normalization"

interface DataTableProps {
  columns: ColumnDef<ProductColumn>[]
  data: ProductColumn[]
  categories: InventoryCategory[]
  initialSearch?: string
  canAssociate?: boolean
  onAssociateProducts?: (productIds: number[]) => void
  onManageCategories?: () => void
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
    return { type: "name", query: trimmedValue.toLowerCase() }
  }

  const idValue = trimmedValue.slice(1).trim()
  const id = Number(idValue)

  if (!/^\d+$/.test(idValue) || !Number.isSafeInteger(id) || id <= 0) {
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
  canAssociate = false,
  onAssociateProducts,
  onManageCategories,
}: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [{ id: "estado", value: ESTADO_REGISTRO.ACTIVO }]
  )
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("all")
  const effectiveCategoryId = categories.some((category) => String(category.idCategoria) === selectedCategoryId) ? selectedCategoryId : "all"
  const [productSearch, setProductSearch] = React.useState(initialSearch)
  const [isSelectingProducts, setIsSelectingProducts] = React.useState(false)
  const [selectedProductIds, setSelectedProductIds] = React.useState<number[]>(
    []
  )

  const cancelProductSelection = () => {
    setIsSelectingProducts(false)
    setSelectedProductIds([])
  }

  const acceptProductSelection = () => {
    if (selectedProductIds.length === 0) return
    const productIds = [...selectedProductIds]
    cancelProductSelection()
    onAssociateProducts?.(productIds)
  }

  const selectionColumn = React.useMemo<ColumnDef<ProductColumn> | null>(() => {
    if (!isSelectingProducts) return null

    return {
      id: "associateSelection",
      header: "Seleccionar",
      cell: ({ row }) => {
        const product = row.original
        const checked = selectedProductIds.includes(product.idProducto)
        return (
          <input
            type="checkbox"
            aria-label={`Seleccionar ${product.nombre}`}
            checked={checked}
            onChange={(event) => {
              setSelectedProductIds((current) =>
                event.target.checked
                  ? [...current, product.idProducto]
                  : current.filter((id) => id !== product.idProducto)
              )
            }}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
        )
      },
    }
  }, [isSelectingProducts, selectedProductIds])

  const visibleColumns = React.useMemo(
    () => (selectionColumn ? [selectionColumn, ...columns] : columns),
    [columns, selectionColumn]
  )

  React.useEffect(() => {
    if (initialSearch) {
      setProductSearch(initialSearch)
    }
  }, [initialSearch])

  const productSearchState = React.useMemo(
    () => parseProductSearch(productSearch),
    [productSearch]
  )

  const categoryFilteredData = React.useMemo(() => {
    const productsByCategory =
      effectiveCategoryId === "all"
        ? data
        : data.filter((product) =>
            product.categoriasProducto?.some(
              (category) => String(category.idCategoria) === effectiveCategoryId
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
        (product) => product.idProducto === productSearchState.id
      )
    }

    return productsByCategory.filter(
      (product) =>
        includesNormalizedText(product.nombre, productSearchState.query) ||
        includesNormalizedText(product.tipoProducto, productSearchState.query)
    )
  }, [data, productSearchState, effectiveCategoryId])

  const table = useReactTable({
    data: categoryFilteredData,
    columns: visibleColumns,
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
        actions={
          canAssociate &&
          (isSelectingProducts ? (
            <span className="text-xs text-muted-foreground">
              {selectedProductIds.length} seleccionados
            </span>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsSelectingProducts(true)}>
              <Truck className="mr-2 h-4 w-4" />
              Asociar proveedor
            </Button>
          ))
        }
        toolbar={
          <div className="space-y-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  aria-label="Buscar productos por nombre o ID"
                  aria-describedby={
                    productSearchState.type === "invalid-id"
                      ? "product-search-help product-search-error"
                      : "product-search-help"
                  }
                  aria-invalid={productSearchState.type === "invalid-id"}
                  placeholder="Buscar por nombre o #ID..."
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  className="h-10 w-full rounded-xl border-border/80 bg-background pl-10 text-sm shadow-2xs focus-visible:ring-primary/30"
                />
              </div>

            <div className="sr-only">
              <p
                id="product-search-help"
                className="text-xs text-muted-foreground"
              >
                Usa # seguido del ID para una búsqueda exacta.
              </p>
            </div>

              <div className="w-full shrink-0 sm:w-56">
                <Select
                  value={
                    (table.getColumn("estado")?.getFilterValue() as string) ||
                    "all"
                  }
                  onValueChange={(value) =>
                    table
                      .getColumn("estado")
                      ?.setFilterValue(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger aria-label="Filtrar productos por estado" className="h-10 data-[size=default]:h-10 w-full rounded-xl border-border/80 bg-background text-sm shadow-2xs sm:w-56">
                    <SelectValue placeholder="Estado: Todos" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value={ESTADO_REGISTRO.ACTIVO}>
                      Solo Activos
                    </SelectItem>
                    <SelectItem value={ESTADO_REGISTRO.INACTIVO}>
                      Solo Inactivos
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full shrink-0 sm:w-56">
                <Select
                  value={effectiveCategoryId}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger aria-label="Filtrar productos por categoría" className="h-10 data-[size=default]:h-10 w-full rounded-xl border-border/80 bg-background text-sm shadow-2xs sm:w-56">
                    <SelectValue placeholder="Categoría: Todas" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.idCategoria}
                        value={String(category.idCategoria)}
                      >
                        {category.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {onManageCategories && <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onManageCategories}><Tags className="h-4 w-4" /> Administrar categorías</Button>}
            </div>
            {productSearchState.type === "invalid-id" && (
              <p id="product-search-error" className="text-xs text-destructive">
                {productSearchState.message}
              </p>
            )}
          </div>
        }
        footer={
          filteredRowCount > 0 || isSelectingProducts ? (
            <>
              {isSelectingProducts && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelProductSelection}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedProductIds.length === 0}
                    onClick={acceptProductSelection}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Aceptar
                  </Button>
                </div>
              )}
              <div>
                Página {table.getState().pagination.pageIndex + 1} de{" "}
                {table.getPageCount() || 1}
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
                <TableRow
                  key={row.id}
                  data-state={
                    selectedProductIds.includes(row.original.idProducto)
                      ? "selected"
                      : undefined
                  }
                >
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
