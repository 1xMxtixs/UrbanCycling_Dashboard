"use client"

import React, { useEffect, useState } from "react"
import {
  Wrench,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Package,
  DollarSign,
  Calculator,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { StatusBadge } from "@/components/common/StatusBadge"
import { WorkOrder } from "../../types"

export interface ProductInventoryItem {
  idProducto: number
  nombre: string
  precioVenta: number | string
  stockActual: number
  stockMinimo?: number
  estado: string
}

export interface SupplyItem {
  idProducto: string
  cantidad: number
  precioUnitario: number
}

interface AssignSuppliesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder | null
  onSuccess?: () => void
}

export function AssignSuppliesDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: AssignSuppliesDialogProps) {
  const [products, setProducts] = useState<ProductInventoryItem[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Estado del formulario
  const [montoServicio, setMontoServicio] = useState<number>(0)
  const [supplies, setSupplies] = useState<SupplyItem[]>([])
  const [descuento, setDescuento] = useState<number>(0)

  // Cargar catálogo de productos de inventario
  useEffect(() => {
    if (!open) return

    async function loadProducts() {
      setIsLoadingProducts(true)
      try {
        const res = await fetch("/api/inventory", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setProducts(
            Array.isArray(data)
              ? data.filter(
                  (p: ProductInventoryItem) =>
                    p.estado?.toLowerCase() === "activo" || !p.estado
                )
              : []
          )
        }
      } catch (err) {
        console.error("Error al cargar productos:", err)
        toast.error("No se pudo cargar el inventario de insumos.")
      } finally {
        setIsLoadingProducts(false)
      }
    }

    loadProducts()
  }, [open])

  // Inicializar estado a partir de la orden seleccionada
  useEffect(() => {
    if (!order || !open) return

    // Obtener mano de obra inicial
    const initialLabor = (order.lineasDeOrdenDeTrabajo || [])
      .filter((l) => l.idServicio !== null && l.idServicio !== undefined)
      .reduce((sum, l) => sum + Number(l.precioUnitario || 0) * Number(l.cantidad || 1), 0)

    setMontoServicio(initialLabor)
    setDescuento(Number(order.descuento || 0))

    // Obtener insumos/productos iniciales
    const initialSupplies: SupplyItem[] = (order.lineasDeOrdenDeTrabajo || [])
      .filter((l) => l.idProducto !== null && l.idProducto !== undefined)
      .map((l) => ({
        idProducto: String(l.idProducto || l.producto?.idProducto || ""),
        cantidad: Number(l.cantidad || 1),
        precioUnitario: Number(l.precioUnitario || l.producto?.precioVenta || 0),
      }))

    setSupplies(
      initialSupplies.length > 0
        ? initialSupplies
        : []
    )
  }, [order, open])

  // Manejo de Insumos
  const handleAddSupply = () => {
    setSupplies((prev) => [
      ...prev,
      {
        idProducto: "",
        cantidad: 1,
        precioUnitario: 0,
      },
    ])
  }

  const handleRemoveSupply = (index: number) => {
    setSupplies((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProductChange = (index: number, productId: string) => {
    const selected = products.find((p) => String(p.idProducto) === productId)
    const price = selected ? Number(selected.precioVenta) : 0

    setSupplies((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        idProducto: productId,
        precioUnitario: price,
      }
      return updated
    })
  }

  const handleQuantityChange = (index: number, qty: number) => {
    const validQty = Math.max(1, qty)
    setSupplies((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        cantidad: validQty,
      }
      return updated
    })
  }

  // Cálculos de valorización en tiempo real
  const totalInsumos = supplies.reduce(
    (acc, item) => acc + (item.cantidad || 0) * (item.precioUnitario || 0),
    0
  )
  const subtotalNetoBruto = totalInsumos + (montoServicio || 0)
  const totalConDescuento = Math.max(0, subtotalNetoBruto - (descuento || 0))
  const montoNeto = Math.round(totalConDescuento / 1.19)
  const montoIva = totalConDescuento - montoNeto

  const totalPagado = Number(order?.totalPagado || 0)
  const saldoPendiente = Math.max(0, totalConDescuento - totalPagado)

  // Guardar asignación y valorización
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return

    // Validar productos duplicados o incompletos
    for (const sup of supplies) {
      if (!sup.idProducto) {
        toast.error("Por favor selecciona un producto en cada fila agregada.")
        return
      }
    }

    setIsSaving(true)
    try {
      // Formatear payload para actualizar orden y sus líneas
      const payload = {
        montoServicio,
        descuentoGlobal: descuento,
        productos: supplies.map((s) => ({
          id_producto: Number(s.idProducto),
          cantidad: s.cantidad,
          precio_unitario: s.precioUnitario,
        })),
      }

      const res = await fetch(`/api/punto-venta/orden-${order.idOrdenDeTrabajo}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Error al valorizar y asignar insumos")
      }

      toast.success("Insumos asignados y valorización actualizada correctamente.")
      onOpenChange(false)
      if (onSuccess) {
        onSuccess()
      }
      window.dispatchEvent(new Event("work-orders:refresh"))
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo actualizar la valorización de la orden.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black text-foreground flex items-center gap-2">
                  Asignación de Insumos & Valorización
                  <span className="text-muted-foreground font-normal text-sm">
                    (Orden #{order.idOrdenDeTrabajo})
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Asigna repuestos del inventario, define el valor de mano de obra y visualiza el cálculo financiero total.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 py-4 pr-1">
          {/* SECCIÓN 1: Mano de Obra y Descuentos */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <DollarSign className="h-4.5 w-4.5 text-primary" />
              <h4 className="text-sm font-bold text-foreground">
                Mano de Obra y Ajustes
              </h4>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="montoServicio" className="text-xs font-semibold text-foreground">
                  Monto de Servicio / Mano de Obra ($)
                </Label>
                <Input
                  id="montoServicio"
                  type="number"
                  min={0}
                  step={100}
                  placeholder="0"
                  value={montoServicio || ""}
                  onChange={(e) => setMontoServicio(Math.max(0, Number(e.target.value)))}
                  className="h-9 text-sm font-medium"
                />
                <p className="text-[11px] text-muted-foreground">
                  Costo técnico por servicios de mantención o reparación.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="descuentoGlobal" className="text-xs font-semibold text-foreground">
                  Descuento Global ($)
                </Label>
                <Input
                  id="descuentoGlobal"
                  type="number"
                  min={0}
                  step={100}
                  placeholder="0"
                  value={descuento || ""}
                  onChange={(e) => setDescuento(Math.max(0, Number(e.target.value)))}
                  className="h-9 text-sm font-medium"
                />
                <p className="text-[11px] text-muted-foreground">
                  Descuento promocional aplicable al total.
                </p>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Insumos / Repuestos Utilizados */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <Package className="h-4.5 w-4.5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Insumos & Repuestos de Taller
                </h4>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSupply}
                className="h-8 gap-1 text-xs font-semibold cursor-pointer border-dashed border-primary/50 text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Insumo
              </Button>
            </div>

            {isLoadingProducts ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Cargando catálogo de productos...
              </div>
            ) : supplies.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-xs font-medium text-foreground">
                  No hay insumos asignados a esta orden
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Haz clic en &quot;Agregar Insumo&quot; para añadir repuestos o piezas utilizadas.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {supplies.map((item, idx) => {
                  const selectedProduct = products.find(
                    (p) => String(p.idProducto) === item.idProducto
                  )
                  const hasStockWarning =
                    selectedProduct && selectedProduct.stockActual < item.cantidad

                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-border bg-muted/25 p-3 space-y-2 text-xs transition-colors hover:border-border/80"
                    >
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Selector de Producto */}
                        <div className="flex-1 min-w-[220px]">
                          <Label className="text-[11px] text-muted-foreground mb-1 block">
                            Producto / Repuesto #{idx + 1}
                          </Label>
                          <Select
                            value={item.idProducto || undefined}
                            onValueChange={(val) => handleProductChange(idx, val)}
                          >
                            <SelectTrigger className="h-9 w-full bg-background text-xs">
                              <SelectValue placeholder="-- Seleccionar Producto --" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="max-h-60">
                              {products.map((prod) => (
                                <SelectItem
                                  key={prod.idProducto}
                                  value={String(prod.idProducto)}
                                  className="text-xs"
                                >
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <span className="font-medium">{prod.nombre}</span>
                                    <span className="text-muted-foreground">
                                      (${Number(prod.precioVenta).toLocaleString("es-CL")} | Stock: {prod.stockActual})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Cantidad */}
                        <div className="w-24">
                          <Label className="text-[11px] text-muted-foreground mb-1 block">
                            Cantidad
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.cantidad}
                            onChange={(e) =>
                              handleQuantityChange(idx, Number(e.target.value))
                            }
                            className="h-9 text-xs bg-background"
                          />
                        </div>

                        {/* Precio Unitario */}
                        <div className="w-28">
                          <Label className="text-[11px] text-muted-foreground mb-1 block">
                            Precio Unit.
                          </Label>
                          <div className="h-9 flex items-center px-2.5 rounded-md border border-border bg-muted/40 font-mono text-xs font-semibold text-foreground">
                            ${item.precioUnitario.toLocaleString("es-CL")}
                          </div>
                        </div>

                        {/* Subtotal Línea */}
                        <div className="w-32">
                          <Label className="text-[11px] text-muted-foreground mb-1 block">
                            Subtotal
                          </Label>
                          <div className="h-9 flex items-center px-2.5 rounded-md border border-border bg-muted/40 font-mono text-xs font-bold text-foreground">
                            ${(item.cantidad * item.precioUnitario).toLocaleString("es-CL")}
                          </div>
                        </div>

                        {/* Botón Eliminar */}
                        <div className="pt-4">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSupply(idx)}
                            className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Eliminar insumo</span>
                          </Button>
                        </div>
                      </div>

                      {/* Advertencia de stock bajo/insuficiente */}
                      {hasStockWarning && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-500 bg-rose-500/10 px-2 py-1 rounded">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Stock insuficiente en bodega (Disponible: {selectedProduct.stockActual} unid.)
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* SECCIÓN 3: Panel de Valorización Dinámica */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-primary/10 pb-2">
              <div className="flex items-center gap-2">
                <Calculator className="h-4.5 w-4.5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Resumen de Valorización Total
                </h4>
              </div>
              <StatusBadge
                status={saldoPendiente === 0 ? "success" : "warning"}
                label={saldoPendiente === 0 ? "Completamente Pagada" : `Saldo Pendiente: $${saldoPendiente.toLocaleString("es-CL")}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <DataField
                label="Total Insumos / Repuestos"
                value={`$${totalInsumos.toLocaleString("es-CL")}`}
              />
              <DataField
                label="Mano de Obra / Servicio"
                value={`$${montoServicio.toLocaleString("es-CL")}`}
              />
              <DataField
                label="Monto Neto (sin IVA)"
                value={`$${montoNeto.toLocaleString("es-CL")}`}
              />
              <DataField
                label="IVA Estimado (19%)"
                value={`$${montoIva.toLocaleString("es-CL")}`}
              />
            </div>

            <div className="rounded-lg bg-background border border-border p-3 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Total Final a Facturar
                </span>
                <span className="text-2xl font-black text-primary">
                  ${totalConDescuento.toLocaleString("es-CL")}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Abonado / Pagado:
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ${totalPagado.toLocaleString("es-CL")}
                  </span>
                </div>
                <div className="border-l border-border pl-4">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Saldo a Cobrar:
                  </span>
                  <span
                    className={`font-black ${
                      saldoPendiente > 0
                        ? "text-rose-500"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    ${saldoPendiente.toLocaleString("es-CL")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Info className="h-3.5 w-3.5 text-primary" />
              Los montos calculados actualizan el valor total de la orden de trabajo para efectos de cobro y facturación tributaria.
            </div>
          </div>

          {/* Pie de diálogo */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando Valorización...
                </>
              ) : (
                "Guardar Valorización"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
