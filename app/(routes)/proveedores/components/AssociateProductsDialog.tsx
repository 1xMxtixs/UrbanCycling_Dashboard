"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, PackageCheck, Search } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ProveedorListado } from "./types"

type InventoryProduct = {
  idProducto: number
  nombre: string
  tipoProducto: string
  stockActual: number
  codigoProveedor: string | null
}

type AssociateProductsDialogProps = {
  open: boolean
  proveedor: ProveedorListado | null
  onOpenChange: (open: boolean) => void
}

export function AssociateProductsDialog({
  open,
  proveedor,
  onOpenChange,
}: AssociateProductsDialogProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open || !proveedor) return

    let isCurrent = true
    const supplierRut = proveedor.rut
    async function loadProducts() {
      setIsLoading(true)
      setLoadError("")
      setSaveError("")
      setSearch("")

      try {
        const response = await fetch("/api/inventory", { cache: "no-store" })
        const result = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(
            result?.message || "No fue posible cargar los productos."
          )
        }

        const inventory = Array.isArray(result)
          ? (result as InventoryProduct[])
          : ((result?.products ?? []) as InventoryProduct[])

        if (isCurrent) {
          setProducts(inventory)
          setSelectedIds(
            inventory
              .filter((product) => product.codigoProveedor === supplierRut)
              .map((product) => product.idProducto)
          )
        }
      } catch (error) {
        if (isCurrent) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar los productos."
          )
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadProducts()
    return () => {
      isCurrent = false
    }
  }, [open, proveedor])

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return products
    return products.filter((product) =>
      `${product.idProducto} ${product.nombre} ${product.tipoProducto}`
        .toLocaleLowerCase()
        .includes(query)
    )
  }, [products, search])

  const hasChanges = products.some(
    (product) =>
      (product.codigoProveedor === proveedor?.rut) !==
      selectedIds.includes(product.idProducto)
  )

  const toggleProduct = (product: InventoryProduct) => {
    setSaveError("")
    setSelectedIds((current) =>
      current.includes(product.idProducto)
        ? current.filter((id) => id !== product.idProducto)
        : [...current, product.idProducto]
    )
  }

  const handleSave = async () => {
    if (!proveedor || isSaving) return

    const changedProducts = products.filter(
      (product) =>
        (product.codigoProveedor === proveedor.rut) !==
        selectedIds.includes(product.idProducto)
    )
    if (changedProducts.length === 0) {
      onOpenChange(false)
      return
    }

    setIsSaving(true)
    setSaveError("")

    try {
      const results = await Promise.all(
        changedProducts.map(async (product) => {
          const isSelected = selectedIds.includes(product.idProducto)
          const response = await fetch(`/api/inventory/${product.idProducto}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              codigoProveedor: isSelected ? proveedor.rut : null,
            }),
          })
          const result = await response.json().catch(() => null)
          return {
            ok: response.ok,
            message: result?.message as string | undefined,
          }
        })
      )

      const failed = results.filter((result) => !result.ok)
      if (failed.length > 0) {
        if (results.length !== failed.length) {
          window.dispatchEvent(new Event("inventory:refresh"))
        }
        throw new Error(
          failed.length === results.length
            ? failed[0]?.message || "No se pudieron guardar los productos."
            : `Se guardaron ${results.length - failed.length} de ${results.length} cambios. ${failed[0]?.message || "Revisa los productos restantes e inténtalo nuevamente."}`
        )
      }

      window.dispatchEvent(new Event("inventory:refresh"))
      const changedById = new Map(
        changedProducts.map((product) => [
          product.idProducto,
          selectedIds.includes(product.idProducto) ? proveedor.rut : null,
        ])
      )
      setProducts((current) =>
        current.map((product) =>
          changedById.has(product.idProducto)
            ? {
                ...product,
                codigoProveedor: changedById.get(product.idProducto) ?? null,
              }
            : product
        )
      )
      toast.success(
        `${changedProducts.length} ${changedProducts.length === 1 ? "producto actualizado" : "productos actualizados"} para ${proveedor.razonSocial}.`
      )
      onOpenChange(false)
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar los productos."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSaving) return
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] rounded-xl sm:max-w-[calc(100vw-3rem)] xl:max-w-[calc(100vw-20rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            Asociar productos
          </DialogTitle>
          <DialogDescription>
            Selecciona los productos que corresponden a {proveedor?.razonSocial}
            . El RUT {proveedor?.rut} se guardará en el código de proveedor.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o ID..."
            aria-label="Buscar productos"
            className="pl-9"
            disabled={isLoading || Boolean(loadError)}
          />
        </div>

        <div className="max-h-[min(55vh,480px)] overflow-y-auto rounded-lg border border-border">
          {isLoading ? (
            <div
              className="space-y-2 p-4"
              aria-busy="true"
              aria-label="Cargando productos"
            >
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : loadError ? (
            <div
              role="alert"
              className="flex items-start gap-2 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {loadError}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {products.length === 0
                ? "No hay productos registrados."
                : "No se encontraron productos para esa búsqueda."}
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/90 backdrop-blur">
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Asociar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const belongsToThisSupplier =
                    product.codigoProveedor === proveedor?.rut
                  const belongsToAnotherSupplier = Boolean(
                    product.codigoProveedor && !belongsToThisSupplier
                  )
                  const checked = selectedIds.includes(product.idProducto)
                  const associationStatus = belongsToAnotherSupplier
                    ? "Otro proveedor"
                    : belongsToThisSupplier
                      ? checked
                        ? "Asociado"
                        : "Se desasociará"
                      : checked
                        ? "Se asociará"
                        : "Sin proveedor"

                  return (
                    <TableRow key={product.idProducto}>
                      <TableCell className="min-w-0">
                        <p className="truncate font-medium">{product.nombre}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          #{product.idProducto} · {product.tipoProducto}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {product.stockActual} u
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center justify-end gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isSaving}
                            onChange={() => toggleProduct(product)}
                            aria-label={`Asociar ${product.nombre}`}
                            className="h-4 w-4 cursor-pointer accent-primary"
                          />
                          {belongsToAnotherSupplier && (
                            <Badge variant="outline" className="text-xs font-normal">
                              {checked ? "Se reasignará" : "Otro proveedor"}
                            </Badge>
                          )}
                          {!belongsToAnotherSupplier && (
                            <Badge
                              variant={checked ? "default" : "secondary"}
                              className="text-xs font-normal"
                            >
                              {associationStatus}
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {saveError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={
              isLoading || Boolean(loadError) || !hasChanges || isSaving
            }
            onClick={() => void handleSave()}
          >
            {isSaving ? (
              <>
                <Spinner className="mr-2" />
                Guardando...
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
