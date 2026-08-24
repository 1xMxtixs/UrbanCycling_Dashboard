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
import { DataField } from "@/components/common/DataField"
import { StatusBadge } from "@/components/common/StatusBadge"

type ProductDetailSheetProps = {
  product: ProductColumn | null
  open: boolean
  onOpenChange: (open: boolean) => void
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
  const isOutOfStock = product?.stockActual === 0
  const isLowStock = product ? product.stockActual <= product.stockMinimo && !isOutOfStock : false

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md p-6 bg-card border-l border-border/80">
        {product ? (
          <>
            <SheetHeader className="pb-4 border-b border-border/60">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Ficha de Producto #{product.idProducto}
                </span>
                <StatusBadge
                  status={product.estado === "activo" ? "success" : "neutral"}
                  label={product.estado}
                  showDot={false}
                />
              </div>
              <SheetTitle className="text-xl font-bold text-foreground">{product.nombre}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Especificaciones técnicas y niveles de inventario en bodega.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 pt-4">
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/40 shadow-xs">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={product.nombre}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <PackageSearch className="size-10 stroke-[1.5]" />
                    <span className="text-xs font-medium">Sin imagen adjunta</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge
                  status={isOutOfStock ? "danger" : isLowStock ? "warning" : "success"}
                  label={isOutOfStock ? "Sin existencias" : isLowStock ? "Stock bajo mínimo" : "Stock disponible"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Tipo / Categoría
                  </span>
                  <p className="text-sm font-bold text-foreground">{product.tipoProducto}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Precio Venta
                  </span>
                  <p className="text-base font-extrabold text-foreground">{formatPrice(product.precioVenta)}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Stock Disponible
                  </span>
                  <p className="text-sm font-bold text-foreground">{product.stockActual} unidades</p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Stock Mínimo
                  </span>
                  <p className="text-sm font-bold text-muted-foreground">{product.stockMinimo} unidades</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción del Producto</p>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
                  {product.descripcion || "Sin descripción adicional registrada para este producto."}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
