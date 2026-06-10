// Panel lateral para visualizar el detalle informativo de un producto.
"use client"

import {
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  Hash,
  PackageSearch,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import type { ProductColumn } from "./columns"

type ProductDetailSheetProps = {
  product: ProductColumn | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getStockStatus(product: ProductColumn) {
  if (product.stockActual === 0) {
    return {
      label: "Sin stock",
      className:
        "bg-destructive/10 text-destructive dark:bg-destructive/20",
    }
  }

  if (product.stockActual <= product.stockMinimo) {
    return {
      label: "Stock bajo",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
    }
  }

  return {
    label: "Disponible",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200",
  }
}

function formatPrice(value: number | string) {
  return `$${Number(value).toLocaleString("es-CL")}`
}

export function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: ProductDetailSheetProps) {
  const imageUrl = product?.imagenesProducto?.[0]?.url
  const stockStatus = product ? getStockStatus(product) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        {product ? (
          <>
            <SheetHeader className="border-b">
              <SheetTitle>{product.nombre}</SheetTitle>
              <SheetDescription>
                Detalle completo del producto registrado en inventario.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-4 pb-6">
              <div className="overflow-hidden rounded-lg border bg-muted">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={product.nombre}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <PackageSearch className="size-10" />
                    <span className="text-sm">Sin imagen disponible</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stockStatus?.className}`}
                >
                  {stockStatus?.label}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground">
                  {product.estado}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Hash className="size-3.5" />
                    ID
                  </div>
                  <p className="mt-1 font-medium">#{product.idProducto}</p>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Boxes className="size-3.5" />
                    Tipo
                  </div>
                  <p className="mt-1 font-medium">{product.tipoProducto}</p>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="size-3.5" />
                    Stock
                  </div>
                  <p className="mt-1 font-medium">
                    {product.stockActual} disponibles
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Minimo: {product.stockMinimo}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CircleDollarSign className="size-3.5" />
                    Precio venta
                  </div>
                  <p className="mt-1 font-medium">
                    {formatPrice(product.precioVenta)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Descripcion</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {product.descripcion || "Sin descripcion registrada."}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
