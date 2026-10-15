"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useSession } from "next-auth/react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  PackageX,
  Truck,
} from "lucide-react"
import { toast } from "sonner"

import { PERMISSIONS } from "@/lib/permissions"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "./data-table"
import { getColumns, type ProductColumn } from "./columns"
import { ProductDetailSheet } from "./ProductDetailSheet"
import { FormEditInventory } from "../FormEditInventory"
import { InventoryMovementDialog } from "../InventoryMovementDialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { FormDialog } from "@/components/forms/FormDialog"
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog"
import type { InventoryCategory } from "../../types"
import { ESTADO_REGISTRO, isRegistroActivo } from "@/lib/registro-status"
import { useDismissedSearchParam } from "@/hooks/use-dismissed-search-param"
import { Button } from "@/components/ui/button"

type SupplierOption = {
  idProveedor: number
  razonSocial: string
  nombreFantasia: string | null
  rut: string
}

export function ListInventory() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const productIdParam = searchParams.get("productId")
  const searchParam = searchParams.get("search") ?? ""
  const { dismissCurrentParameter, isCurrentParameterDismissed } =
    useDismissedSearchParam(productIdParam)

  const canUpdate = Boolean(
    session?.user?.permisos?.includes(PERMISSIONS.INVENTORY_UPDATE)
  )

  const [inventory, setInventory] = useState<ProductColumn[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<ProductColumn | null>(
    null
  )
  const [openDetail, setOpenDetail] = useState(false)
  const [selectedMovementProduct, setSelectedMovementProduct] =
    useState<ProductColumn | null>(null)
  const [openMovement, setOpenMovement] = useState(false)
  const [productToEdit, setProductToEdit] = useState<ProductColumn | null>(null)
  const [openEdit, setOpenEdit] = useState(false)
  const [openLowStock, setOpenLowStock] = useState(false)
  const [openOutOfStock, setOpenOutOfStock] = useState(false)
  const [productToToggle, setProductToToggle] = useState<ProductColumn | null>(
    null
  )
  const [openToggleDialog, setOpenToggleDialog] = useState(false)
  const [isSubmittingToggle, setIsSubmittingToggle] = useState(false)
  const [associateDialogOpen, setAssociateDialogOpen] = useState(false)
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([])
  const [supplierLoadError, setSupplierLoadError] = useState("")
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null
  )
  const [productsToAssociate, setProductsToAssociate] = useState<number[]>([])
  const [isSavingAssociation, setIsSavingAssociation] = useState(false)
  const [associationError, setAssociationError] = useState("")

  const canAssociateSupplier = Boolean(
    canUpdate && session?.user?.permisos?.includes(PERMISSIONS.SUPPLIERS_READ)
  )

  useEffect(() => {
    async function getInventory() {
      try {
        const [response, categoriesResponse] = await Promise.all([
          fetch("/api/inventory", { cache: "no-store" }),
          fetch("/api/inventory/categories", { cache: "no-store" }),
        ])

        const categoriesData = await categoriesResponse.json().catch(() => null)
        setCategories(
          categoriesResponse.ok ? (categoriesData?.categories ?? []) : []
        )

        if (!response.ok) {
          setInventory([])
          return
        }

        const data = (await response.json()) as ProductColumn[]
        setInventory(data)
      } finally {
        setIsLoading(false)
      }
    }

    const timerId = window.setTimeout(() => {
      getInventory()
    }, 0)

    window.addEventListener("inventory:refresh", getInventory)

    return () => {
      window.clearTimeout(timerId)
      window.removeEventListener("inventory:refresh", getInventory)
    }
  }, [])

  // Auto-apertura de ficha de producto si viene ?productId=...
  useEffect(() => {
    if (
      !productIdParam ||
      isCurrentParameterDismissed() ||
      inventory.length === 0
    )
      return

    const targetId = Number(productIdParam)
    if (!isNaN(targetId)) {
      const found = inventory.find((p) => p.idProducto === targetId)
      if (found) {
        const openDetailTimer = window.setTimeout(() => {
          setSelectedProduct(found)
          setOpenDetail(true)
        }, 0)

        return () => window.clearTimeout(openDetailTimer)
      }
    }
  }, [inventory, isCurrentParameterDismissed, productIdParam])

  const handleDetailOpenChange = (open: boolean) => {
    setOpenDetail(open)

    if (open || !productIdParam) return

    dismissCurrentParameter()
    const params = new URLSearchParams(searchParams.toString())
    params.delete("productId")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const activeProducts = inventory.filter((product) =>
    isRegistroActivo(product.estado)
  )

  const lowStockProducts = activeProducts.filter(
    (product) =>
      product.stockActual > 0 && product.stockActual <= product.stockMinimo
  )

  const outOfStockProducts = activeProducts.filter(
    (product) => product.stockActual === 0
  )

  const handleViewDetail = (product: ProductColumn) => {
    setSelectedProduct(product)
    setOpenDetail(true)
  }

  const handleEditProduct = (product: ProductColumn) => {
    setOpenDetail(false)
    setProductToEdit(product)
    setOpenEdit(true)
  }

  const handleRegisterMovement = (product: ProductColumn) => {
    setSelectedMovementProduct(product)
    setOpenMovement(true)
  }

  const handleToggleProductStatus = (product: ProductColumn) => {
    setProductToToggle(product)
    setOpenToggleDialog(true)
  }

  const handleOpenSupplierDialog = async (productIds: number[]) => {
    setProductsToAssociate(productIds)
    setSelectedSupplierId(null)
    setAssociationError("")
    setSupplierLoadError("")
    setAssociateDialogOpen(true)
    setIsLoadingSuppliers(true)

    try {
      const response = await fetch("/api/proveedores", { cache: "no-store" })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(
          result?.message || "No fue posible cargar los proveedores."
        )
      }
      setSuppliers(Array.isArray(result?.providers) ? result.providers : [])
    } catch (error) {
      setSupplierLoadError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los proveedores."
      )
    } finally {
      setIsLoadingSuppliers(false)
    }
  }

  const handleSaveSupplierAssociation = async () => {
    const supplier = suppliers.find(
      (item) => item.idProveedor === selectedSupplierId
    )
    if (!supplier || productsToAssociate.length === 0) return

    setIsSavingAssociation(true)
    setAssociationError("")

    try {
      const results = await Promise.all(
        productsToAssociate.map(async (productId) => {
          const response = await fetch(`/api/inventory/${productId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigoProveedor: supplier.rut }),
          })
          const result = await response.json().catch(() => null)
          return {
            productId,
            ok: response.ok,
            message: result?.message as string | undefined,
          }
        })
      )

      const failed = results.filter((result) => !result.ok)
      if (failed.length > 0) {
        window.dispatchEvent(new Event("inventory:refresh"))
        throw new Error(
          failed.length === results.length
            ? failed[0]?.message || "No se pudieron asociar los productos."
            : `Se asociaron ${results.length - failed.length} de ${results.length} productos. ${failed[0]?.message || "Revisa los productos restantes e inténtalo nuevamente."}`
        )
      }

      window.dispatchEvent(new Event("inventory:refresh"))
      toast.success(
        `${results.length} ${results.length === 1 ? "producto asociado" : "productos asociados"} a ${supplier.razonSocial}.`
      )
      setAssociateDialogOpen(false)
      setProductsToAssociate([])
    } catch (error) {
      setAssociationError(
        error instanceof Error
          ? error.message
          : "No se pudieron asociar los productos."
      )
    } finally {
      setIsSavingAssociation(false)
    }
  }

  const handleConfirmToggle = async () => {
    if (!productToToggle) return

    const nuevoEstado = isRegistroActivo(productToToggle.estado)
      ? ESTADO_REGISTRO.INACTIVO
      : ESTADO_REGISTRO.ACTIVO

    try {
      setIsSubmittingToggle(true)
      const res = await fetch(`/api/inventory/${productToToggle.idProducto}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(
          data?.message ||
            "No se pudo actualizar el estado del producto. Intenta nuevamente."
        )
      }

      window.dispatchEvent(new Event("inventory:refresh"))
      toast.success(
        nuevoEstado === ESTADO_REGISTRO.ACTIVO
          ? "Producto reactivado correctamente"
          : "Producto inactivado correctamente"
      )
      setOpenToggleDialog(false)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado del producto. Intenta nuevamente."
      )
      setOpenToggleDialog(false)
    } finally {
      setIsSubmittingToggle(false)
    }
  }

  const columns = getColumns(
    handleViewDetail,
    handleRegisterMovement,
    handleToggleProductStatus,
    canUpdate
  )

  return (
    <>
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {lowStockProducts.length > 0 && (
            <button
              type="button"
              onClick={() => setOpenLowStock(true)}
              className="w-full text-left"
            >
              <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 transition-colors hover:bg-yellow-500/15">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-500/15">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Stock bajo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lowStockProducts.length === 1
                      ? "Hay 1 producto con stock bajo."
                      : `Hay ${lowStockProducts.length} productos con stock bajo.`}
                  </p>
                  <p className="mt-1 text-xs font-medium text-yellow-600 dark:text-yellow-500">
                    Ver productos →
                  </p>
                </div>
              </div>
            </button>
          )}

          {outOfStockProducts.length > 0 && (
            <button
              type="button"
              onClick={() => setOpenOutOfStock(true)}
              className="w-full text-left"
            >
              <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 transition-colors hover:bg-red-500/15">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                  <PackageX className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Productos agotados
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {outOfStockProducts.length === 1
                      ? "Hay 1 producto sin stock."
                      : `Hay ${outOfStockProducts.length} productos sin stock.`}
                  </p>
                  <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-500">
                    Ver productos →
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={inventory}
        categories={categories}
        initialSearch={searchParam}
        canAssociate={canAssociateSupplier}
        onAssociateProducts={handleOpenSupplierDialog}
      />

      <Dialog
        open={associateDialogOpen}
        onOpenChange={(open) => {
          if (isSavingAssociation) return
          setAssociateDialogOpen(open)
          if (!open) {
            setProductsToAssociate([])
            setSelectedSupplierId(null)
            setAssociationError("")
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Asociar proveedor
            </DialogTitle>
            <DialogDescription>
              Elige el proveedor para {productsToAssociate.length}{" "}
              {productsToAssociate.length === 1
                ? "producto seleccionado"
                : "productos seleccionados"}
              . Se guardará su RUT en el código de proveedor.
            </DialogDescription>
          </DialogHeader>

          {isLoadingSuppliers ? (
            <div
              className="space-y-3 py-2"
              aria-busy="true"
              aria-label="Cargando proveedores"
            >
              {[...Array(3)].map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : supplierLoadError ? (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {supplierLoadError}
            </div>
          ) : suppliers.length === 0 ? (
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              No hay proveedores activos disponibles.
            </div>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto py-1">
              {suppliers.map((supplier) => {
                const selected = supplier.idProveedor === selectedSupplierId
                return (
                  <button
                    key={supplier.idProveedor}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      setSelectedSupplierId(supplier.idProveedor)
                      setAssociationError("")
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors ${selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {supplier.razonSocial}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {supplier.nombreFantasia || "Proveedor"} · RUT:{" "}
                        {supplier.rut}
                      </span>
                    </span>
                    {selected && (
                      <CheckCircle2 className="ml-3 h-5 w-5 shrink-0 text-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {associationError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {associationError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSavingAssociation}
              onClick={() => setAssociateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={
                isLoadingSuppliers ||
                Boolean(supplierLoadError) ||
                !selectedSupplierId ||
                isSavingAssociation
              }
              onClick={() => void handleSaveSupplierAssociation()}
            >
              {isSavingAssociation ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openLowStock} onOpenChange={setOpenLowStock}>
        <DialogContent className="max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Productos con stock bajo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {lowStockProducts.map((product) => (
              <div
                key={product.idProducto}
                className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/30 p-3"
              >
                <div>
                  <p className="text-sm font-semibold">{product.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock mínimo: {product.stockMinimo} u
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-yellow-600 dark:text-yellow-500">
                    {product.stockActual} u
                  </p>
                  <p className="text-xs text-muted-foreground">Stock actual</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openOutOfStock} onOpenChange={setOpenOutOfStock}>
        <DialogContent className="max-w-2xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageX className="h-5 w-5 text-red-500" />
              Productos agotados
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {outOfStockProducts.map((product) => (
              <div
                key={product.idProducto}
                className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/30 p-3"
              >
                <div>
                  <p className="text-sm font-semibold">{product.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock mínimo: {product.stockMinimo} u
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600 dark:text-red-500">
                    0 u
                  </p>
                  <p className="text-xs text-muted-foreground">Sin stock</p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ProductDetailSheet
        product={selectedProduct}
        open={openDetail}
        onOpenChange={handleDetailOpenChange}
        onEdit={handleEditProduct}
      />
      <InventoryMovementDialog
        product={selectedMovementProduct}
        open={openMovement}
        onOpenChange={setOpenMovement}
      />
      {productToToggle && (
        <StatusToggleDialog
          open={openToggleDialog}
          onOpenChange={setOpenToggleDialog}
          entityLabel="producto"
          entityName={productToToggle.nombre}
          isActive={isRegistroActivo(productToToggle.estado)}
          onConfirm={handleConfirmToggle}
          isSubmitting={isSubmittingToggle}
        />
      )}
      <Dialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open)
          if (!open) setProductToEdit(null)
        }}
      >
        {productToEdit ? (
          <FormDialog
            title="Editar ficha de producto"
            description="Actualiza los datos del producto sin modificar su identificador único."
            size="2xl"
          >
            <FormEditInventory
              product={productToEdit}
              onCompleted={() => {
                setOpenEdit(false)
                setProductToEdit(null)
                window.dispatchEvent(new Event("inventory:refresh"))
              }}
              onCancel={() => {
                setOpenEdit(false)
                setProductToEdit(null)
              }}
            />
          </FormDialog>
        ) : null}
      </Dialog>
    </>
  )
}
