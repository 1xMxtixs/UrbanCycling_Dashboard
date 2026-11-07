"use client"

import React from "react"
import { Trash2, ShoppingBag, Wrench, PackagePlus } from "lucide-react"
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

export interface Service {
  idServicio: number
  codigo: string
  nombre: string
  precioVenta: number
  estado: string
}

export interface SelectedProduct {
  idProducto: string
  cantidad: number
  precioUnitario: number
}

export type SelectedService = {
  cantidad: number
  precioUnitario: number
} & (
  | { tipo: "catalogo"; idServicio: string }
  | { tipo: "personalizado"; nombre: string }
)

interface OrderLinesSectionProps {
  products: Product[]
  services: Service[]
  selectedProducts: SelectedProduct[]
  selectedServices: SelectedService[]
  onAddService: () => void
  onRemoveService: (index: number) => void
  onServiceChange: (index: number, idServicio: string) => void
  onServiceQuantityChange: (index: number, cantidad: number) => void
  onServiceTypeChange: (index: number, tipo: SelectedService["tipo"]) => void
  onCustomServiceChange: (index: number, field: "nombre" | "precioUnitario", value: string) => void
  onAddProduct: () => void
  onRemoveProduct: (index: number) => void
  onProductChange: (index: number, idProducto: string) => void
  onProductQuantityChange: (index: number, cantidad: number) => void
}

export function OrderLinesSection({
  products,
  services,
  selectedProducts,
  selectedServices,
  onAddService,
  onRemoveService,
  onServiceChange,
  onServiceQuantityChange,
  onServiceTypeChange,
  onCustomServiceChange,
  onAddProduct,
  onRemoveProduct,
  onProductChange,
  onProductQuantityChange,
}: OrderLinesSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <h3 className="text-foreground flex items-center gap-2 border-b border-border pb-2 text-sm font-bold">
        <ShoppingBag className="h-4.5 w-4.5 text-muted-foreground" />
        Servicio y Productos (Repuestos)
      </h3>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 border-b border-border pb-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-xs font-bold text-foreground">Servicios</h4>
          {selectedServices.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddService}
              className="h-8 items-center gap-1 text-xs font-semibold"
            >
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              Agregar servicio
            </Button>
          )}
        </div>

        {selectedServices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
            <p className="max-w-sm text-xs text-muted-foreground">
              Al agregar una línea podrás elegir un servicio del catálogo o ingresar uno personalizado.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddService}
              className="text-xs font-semibold"
            >
              <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
              Añadir primer servicio
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedServices.map((selService, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-lg border border-border/70 bg-muted/50 p-3 animate-in slide-in-from-top-1 duration-150 motion-reduce:animate-none"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`order-service-type-${idx}`} className="text-xs font-semibold text-muted-foreground">
                      Tipo de servicio
                    </Label>
                    <Select
                      value={selService.tipo}
                      onValueChange={(value: SelectedService["tipo"]) => onServiceTypeChange(idx, value)}
                    >
                      <SelectTrigger id={`order-service-type-${idx}`} aria-label={`Tipo de servicio ${idx + 1}`} className="h-9 w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="catalogo">Catálogo</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    {selService.tipo === "personalizado" ? (
                      <>
                        <Label htmlFor={`order-service-name-${idx}`} className="text-xs font-semibold text-muted-foreground">
                          Nombre del servicio
                        </Label>
                        <Input
                          id={`order-service-name-${idx}`}
                          aria-label={`Nombre del servicio ${idx + 1}`}
                          maxLength={100}
                          required
                          value={selService.nombre}
                          onChange={(e) => onCustomServiceChange(idx, "nombre", e.target.value)}
                          className="h-9 text-xs"
                        />
                      </>
                    ) : (
                      <>
                        <Label htmlFor={`order-service-catalog-${idx}`} className="text-xs font-semibold text-muted-foreground">
                          Servicio
                        </Label>
                        <Select
                          value={selService.idServicio || undefined}
                          onValueChange={(val) => onServiceChange(idx, val)}
                        >
                          <SelectTrigger
                            id={`order-service-catalog-${idx}`}
                            aria-label={`Servicio de catálogo ${idx + 1}`}
                            className="h-9 w-full border-input bg-background text-xs"
                          >
                            <SelectValue placeholder="Selecciona un servicio" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {services.map((s) => (
                              <SelectItem key={s.idServicio} value={String(s.idServicio)}>
                                {s.codigo} - {s.nombre} (${Number(s.precioVenta).toLocaleString("es-CL")})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`order-service-quantity-${idx}`} className="text-xs font-semibold text-muted-foreground">
                      Cantidad
                    </Label>
                    <Input
                      id={`order-service-quantity-${idx}`}
                      type="number"
                      min={1}
                      step={1}
                      aria-label={`Cantidad del servicio ${idx + 1}`}
                      value={selService.cantidad}
                      onChange={(e) => onServiceQuantityChange(idx, Number(e.target.value))}
                      className="h-9 text-xs"
                    />
                  </div>

                  {selService.tipo === "personalizado" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor={`order-service-price-${idx}`} className="text-xs font-semibold text-muted-foreground">
                        Precio unitario
                      </Label>
                      <Input
                        id={`order-service-price-${idx}`}
                        aria-label={`Precio unitario del servicio ${idx + 1}`}
                        type="number"
                        min={0}
                        max={999999999999}
                        step={1}
                        required
                        value={Number.isFinite(selService.precioUnitario) ? selService.precioUnitario : ""}
                        onChange={(e) => onCustomServiceChange(idx, "precioUnitario", e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  ) : (
                    <DataField
                      label="Precio unitario"
                      value={`$${selService.precioUnitario.toLocaleString("es-CL")}`}
                      className="self-center"
                    />
                  )}

                  <DataField
                    label="Subtotal"
                    value={`$${(selService.cantidad * selService.precioUnitario).toLocaleString("es-CL")}`}
                    className="self-center"
                  />

                  <div className="flex items-end justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Quitar servicio ${idx + 1}`}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onRemoveService(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-2 border-b border-border pb-2 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-xs font-bold text-foreground">Productos/Repuestos usados</h4>
          {selectedProducts.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddProduct}
              className="h-8 items-center gap-1 text-xs font-semibold"
            >
              <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              Agregar repuesto/producto
            </Button>
          )}
        </div>

        {selectedProducts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
            <p className="max-w-sm text-xs text-muted-foreground">
              Al agregar una línea podrás elegir el repuesto, definir la cantidad y revisar el subtotal.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddProduct}
              className="text-xs font-semibold"
            >
              <PackagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              Añadir primer repuesto
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedProducts.map((selProd, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-lg border border-border/70 bg-muted/50 p-3 animate-in slide-in-from-top-1 duration-150 motion-reduce:animate-none"
              >
                <div className="flex items-end gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Label htmlFor={`order-product-${idx}`} className="text-xs font-semibold text-muted-foreground">
                      Producto o repuesto
                    </Label>
                  <Select
                    value={selProd.idProducto || undefined}
                    onValueChange={(val) => onProductChange(idx, val)}
                  >
                    <SelectTrigger
                      id={`order-product-${idx}`}
                      aria-label={`Producto ${idx + 1}`}
                      className="h-9 w-full border-input bg-background text-xs"
                    >
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Quitar producto ${idx + 1}`}
                    className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onRemoveProduct(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`order-product-quantity-${idx}`} className="text-xs font-semibold text-muted-foreground">
                      Cantidad
                    </Label>
                  <Input
                    id={`order-product-quantity-${idx}`}
                    type="number"
                    min={1}
                    aria-label={`Cantidad del producto ${idx + 1}`}
                    value={selProd.cantidad}
                    onChange={(e) =>
                      onProductQuantityChange(
                        idx,
                        Number(e.target.value)
                      )
                    }
                    className="h-9 text-xs"
                  />
                </div>

                  <DataField
                    label="Precio unitario"
                    value={`$${selProd.precioUnitario.toLocaleString("es-CL")}`}
                    className="self-center"
                  />
                  <DataField
                    label="Subtotal"
                    value={`$${(selProd.cantidad * selProd.precioUnitario).toLocaleString("es-CL")}`}
                    className="self-center"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
