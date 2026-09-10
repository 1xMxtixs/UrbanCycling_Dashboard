"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, PackageX } from "lucide-react"

import { DataTable } from "./data-table"
import { getColumns, type ProductColumn } from "./columns"
import { ProductDetailSheet } from "./ProductDetailSheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ListInventory() {
  const [inventory, setInventory] = useState<ProductColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedProduct, setSelectedProduct] =
    useState<ProductColumn | null>(null)

  const [openDetail, setOpenDetail] = useState(false)
  const [openLowStock, setOpenLowStock] = useState(false)
  const [openOutOfStock, setOpenOutOfStock] = useState(false)

  useEffect(() => {
    async function getInventory() {
      try {
        const response = await fetch("/api/inventory", {
          cache: "no-store",
        })

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton
              key={index}
              className="h-24 rounded-xl"
            />
          ))}
        </div>

        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  // Productos con stock bajo
  const lowStockProducts = inventory.filter(
    (product) =>
      product.stockActual > 0 &&
      product.stockActual <= product.stockMinimo,
  )

  // Productos sin stock
  const outOfStockProducts = inventory.filter(
    (product) => product.stockActual === 0,
  )

  const columns = getColumns((product) => {
    setSelectedProduct(product)
    setOpenDetail(true)
  })

  return (
    <>
      {/* ALERTAS */}
      {(lowStockProducts.length > 0 ||
        outOfStockProducts.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">

          {/* ALERTA STOCK BAJO */}
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

          {/* ALERTA SIN STOCK */}
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

      {/* TABLA DE INVENTARIO */}
      <DataTable
        columns={columns}
        data={inventory}
      />

      {/* MODAL STOCK BAJO */}
      <Dialog
        open={openLowStock}
        onOpenChange={setOpenLowStock}
      >
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
                  <p className="text-sm font-semibold">
                    {product.nombre}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Stock mínimo: {product.stockMinimo} u
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-yellow-600 dark:text-yellow-500">
                    {product.stockActual} u
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Stock actual
                  </p>
                </div>

              </div>
            ))}

          </div>

        </DialogContent>
      </Dialog>

      {/* MODAL SIN STOCK */}
      <Dialog
        open={openOutOfStock}
        onOpenChange={setOpenOutOfStock}
      >
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
                  <p className="text-sm font-semibold">
                    {product.nombre}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Stock mínimo: {product.stockMinimo} u
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-red-600 dark:text-red-500">
                    0 u
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Sin stock
                  </p>
                </div>

              </div>
            ))}

          </div>

        </DialogContent>
      </Dialog>

      {/* DETALLE DEL PRODUCTO */}
      <ProductDetailSheet
        product={selectedProduct}
        open={openDetail}
        onOpenChange={setOpenDetail}
      />
    </>
  )
}