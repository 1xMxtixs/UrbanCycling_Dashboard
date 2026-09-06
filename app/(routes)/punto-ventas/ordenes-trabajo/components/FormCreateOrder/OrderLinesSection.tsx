"use client"

import React from "react"
import { Plus, Trash2, ShoppingBag, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataField } from "@/components/common/DataField"

export interface Product {
  idProducto: number
  nombre: string
  precioVenta: number
  estado: string
}

export interface SelectedProduct {
  idProducto: string
  cantidad: number
  precioUnitario: number
}

interface OrderLinesSectionProps {
  products: Product[]
  selectedProducts: SelectedProduct[]
  montoServicio: number
  totalProductsCost: number
  grandTotal: number
  onMontoServicioChange: (monto: number) => void
  onAddProduct: () => void
  onRemoveProduct: (index: number) => void
  onProductChange: (index: number, idProducto: string) => void
  onProductQuantityChange: (index: number, cantidad: number) => void
}

export function OrderLinesSection({
  products,
  selectedProducts,
  montoServicio,
  totalProductsCost,
  grandTotal,
  onMontoServicioChange,
  onAddProduct,
  onRemoveProduct,
  onProductChange,
  onProductQuantityChange,
}: OrderLinesSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
      <h3 className="text-foreground flex items-center gap-2 border-b border-border pb-2 text-sm font-bold">
        <ShoppingBag className="h-4.5 w-4.5 text-primary" />
        Servicio y Productos (Repuestos)
      </h3>

      {/* Monto de Servicio Input */}
      <div className="max-w-xs space-y-1.5">
        <Label
          htmlFor="montoServicio"
          className="text-muted-foreground flex items-center gap-1 text-xs font-semibold"
        >
          <DollarSign className="h-3 w-3 text-muted-foreground" />
          Monto de Servicio (Mano de Obra)
        </Label>
        <Input
          id="montoServicio"
          type="number"
          min={0}
          placeholder="0"
          value={montoServicio || ""}
          onChange={(e) =>
            onMontoServicioChange(Math.max(0, Number(e.target.value)))
          }
        />
      </div>

      {/* Dynamic Products Input */}
      <div className="space-y-3">
        <Label className="text-xs font-bold text-foreground">
          Productos/Repuestos Usados
        </Label>

        {selectedProducts.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No se han agregado productos a la orden.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedProducts.map((selProd, idx) => (
              <div
                key={idx}
                className="flex animate-in flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-2.5 shadow-xs duration-150 slide-in-from-top-1"
              >
                {/* Select Product */}
                <div className="min-w-50 flex-1">
                  <Select
                    value={selProd.idProducto || undefined}
                    onValueChange={(val) => onProductChange(idx, val)}
                  >
                    <SelectTrigger className="h-9 w-full border-input bg-background text-xs">
                      <SelectValue placeholder="-- Selecciona un Producto --" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {products.map((p) => (
                        <SelectItem
                          key={p.idProducto}
                          value={String(p.idProducto)}
                        >
                          {p.nombre} ($
                          {Number(p.precioVenta).toLocaleString("es-CL")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity Input */}
                <div className="w-20">
                  <Input
                    type="number"
                    min={1}
                    value={selProd.cantidad}
                    onChange={(e) =>
                      onProductQuantityChange(
                        idx,
                        Number(e.target.value)
                      )
                    }
                    className="h-9 text-xs"
                    placeholder="Cant."
                  />
                </div>

                {/* Unit Price Display */}
                <div className="w-24 text-xs font-semibold text-muted-foreground">
                  Uni: ${selProd.precioUnitario.toLocaleString("es-CL")}
                </div>

                {/* Subtotal Price Display */}
                <div className="w-28 text-xs font-bold text-foreground">
                  Sub: $
                  {(
                    selProd.cantidad * selProd.precioUnitario
                  ).toLocaleString("es-CL")}
                </div>

                {/* Delete Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onRemoveProduct(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddProduct}
          className="flex h-8 items-center gap-1 px-2.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />+ Agregar repuesto/producto
        </Button>
      </div>

      {/* Summary calculations displays con DataField */}
      <div className="flex justify-end border-t border-border pt-4">
        <div className="grid w-full grid-cols-2 gap-3 sm:max-w-2xl sm:grid-cols-4">
          <DataField
            label="Total Repuestos"
            value={`$${totalProductsCost.toLocaleString("es-CL")}`}
          />
          <DataField
            label="Monto Servicio"
            value={`$${montoServicio.toLocaleString("es-CL")}`}
          />
          <DataField
            label="Monto Neto"
            value={`$${Math.round(grandTotal / 1.19).toLocaleString("es-CL")}`}
          />
          <DataField
            label="Monto Total"
            value={`$${grandTotal.toLocaleString("es-CL")}`}
            valueClassName="text-primary font-black text-sm"
          />
        </div>
      </div>
    </div>
  )
}
