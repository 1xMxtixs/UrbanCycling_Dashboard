"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/sonner"
import { 
  Plus, 
  Trash2, 
  Loader2, 
  ShoppingBag, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  Printer, 
  X 
} from "lucide-react"
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
import { FormCreateCliente } from "@/app/(routes)/clientes/components/FormCreateCliente/FormCreateCliente"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Client {
  idCliente: number
  tipoCliente: string
  rut: string
  primerNombre: string | null
  segundoNombre: string | null
  apellidoPaterno: string | null
  apellidoMaterno: string | null
  razonSocial: string | null
}

interface Product {
  idProducto: number
  nombre: string
  precioVenta: number
  stockActual: number
  estado: string
}

interface SelectedProduct {
  idProducto: string
  cantidad: number
  precioUnitario: number
}

interface FormCreateVentaProps {
  setOpenModalCreate: (open: boolean) => void
}

export function FormCreateVenta({ setOpenModalCreate }: FormCreateVentaProps) {
  const router = useRouter()
  
  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [descuento, setDescuento] = useState<number>(0)
  const [metodoPago, setMetodoPago] = useState<string>("efectivo")
  const [estadoPago, setEstadoPago] = useState<string>("pagada")
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Guardará la respuesta de éxito para mostrar la confirmación
  const [saleResult, setSaleResult] = useState<any>(null)

  // Controla el diálogo secundario de registro rápido
  const [openQuickCreateClient, setOpenQuickCreateClient] = useState(false)

  async function fetchClients(selectNewest = false) {
    try {
      const res = await fetch("/api/clientes")
      if (res.ok) {
        const data = await res.json()
        setClients(data)
        if (selectNewest && data.length > 0) {
          // Encuentra el cliente con el idCliente más alto (el más reciente)
          const newest = data.reduce((prev: Client, current: Client) => 
            (prev.idCliente > current.idCliente) ? prev : current
          )
          setSelectedClientId(newest.idCliente.toString())
        }
      }
    } catch (err) {
      console.error("Error fetching clients:", err)
      toast.error("No se pudieron cargar los clientes")
    } finally {
      setIsLoadingClients(false)
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch("/api/inventory")
      if (res.ok) {
        const data = await res.json()
        setProducts(data.filter((p: any) => p.estado === "activo"))
      }
    } catch (err) {
      console.error("Error fetching products:", err)
      toast.error("No se pudieron cargar los productos")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    fetchClients()
    fetchProducts()
  }, [])

  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      { idProducto: "", cantidad: 1, precioUnitario: 0 },
    ])
  }

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index))
  }

  const handleProductChange = (index: number, idProducto: string) => {
    const matched = products.find((p) => p.idProducto.toString() === idProducto)
    const price = matched ? Number(matched.precioVenta) : 0
    
    const updated = [...selectedProducts]
    updated[index] = {
      ...updated[index],
      idProducto,
      precioUnitario: price,
      cantidad: 1, // Reset qty to 1 on product change
    }
    setSelectedProducts(updated)
  }

  const handleProductQuantityChange = (index: number, cantidad: number) => {
    const updated = [...selectedProducts]
    updated[index] = {
      ...updated[index],
      cantidad: Math.max(1, cantidad),
    }
    setSelectedProducts(updated)
  }

  // Cálculos financieros
  const totalProductsCost = selectedProducts.reduce(
    (sum, p) => sum + p.cantidad * p.precioUnitario,
    0
  )
  
  const subtotal = totalProductsCost
  const finalTotal = Math.max(0, subtotal - descuento)
  const neto = Math.round(finalTotal / 1.19)
  const iva = finalTotal - neto

  const handleQuickClientSuccess = () => {
    setOpenQuickCreateClient(false)
    toast.success("Cliente creado correctamente.")
    fetchClients(true) // Re-fetch y auto-selecciona el más nuevo
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedProducts.length === 0) {
      toast.error("Debe agregar al menos un producto a la venta.")
      return
    }

    const incompleteProductIdx = selectedProducts.findIndex((p) => !p.idProducto)
    if (incompleteProductIdx !== -1) {
      toast.error(`Debe seleccionar un producto en la línea #${incompleteProductIdx + 1}.`)
      return
    }

    // Validación de stock del lado del cliente
    for (let i = 0; i < selectedProducts.length; i++) {
      const sp = selectedProducts[i]
      const prod = products.find((p) => p.idProducto.toString() === sp.idProducto)
      if (prod && sp.cantidad > prod.stockActual) {
        toast.error(
          `Stock insuficiente para ${prod.nombre}. Solicitado: ${sp.cantidad}, Disponible: ${prod.stockActual}`
        )
        return
      }
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/punto-venta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: 1, // Vendedor / Administrador por defecto
          id_cliente: selectedClientId ? Number(selectedClientId) : null,
          estado_pago: estadoPago,
          descuento: descuento,
          productos: selectedProducts.map((p) => ({
            idProducto: Number(p.idProducto),
            cantidad: p.cantidad,
            precioUnitario: p.precioUnitario,
          })),
          metodo_pago: metodoPago,
          monto_pagado: finalTotal,
          estado_venta: "confirmada"
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (responseData.code === "STOCK_INSUFICIENTE") {
          toast.error(
            `Excepción 1: Stock insuficiente. ${responseData.message} (Disponibles: ${responseData.cantidadDisponible})`
          )
        } else {
          toast.error(responseData.message || "Error al procesar la venta.")
        }
        return
      }

      toast.success("Venta realizada correctamente.")
      setSaleResult(responseData)
    } catch (err) {
      console.error(err)
      toast.error("Error de conexión al procesar la venta.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseSuccess = () => {
    // Dispara refresco
    window.dispatchEvent(new Event("sales:refresh"))
    router.refresh()
    setOpenModalCreate(false)
  }

  // Vista de Recibo / Confirmación de Venta
  if (saleResult) {
    const saleData = saleResult.venta || {}
    const clientData = selectedClientId ? clients.find((c) => c.idCliente.toString() === selectedClientId) : undefined
    const clientLabel = clientData
      ? clientData.razonSocial
        ? clientData.razonSocial
        : `${clientData.primerNombre} ${clientData.apellidoPaterno || ""}`.trim()
      : "Cliente General"

    return (
      <div className="space-y-6 py-4 animate-in fade-in duration-300">
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <CheckCircle2 className="h-14 w-14 text-green-500 animate-bounce" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Venta Registrada Exitosamente
          </h3>
          <p className="text-xs text-muted-foreground">
            La operación fue grabada y el inventario actualizado.
          </p>
        </div>

        {/* Formato Recibo / Boleta */}
        <div className="border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-lg font-mono text-xs space-y-4">
          <div className="text-center border-b border-dashed border-slate-350 dark:border-slate-700 pb-2">
            <h4 className="font-bold text-sm">URBAN CYCLING</h4>
            <p className="text-[10px] text-muted-foreground">Boleta de Venta Directa</p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Ref: {saleResult.idPuntoVenta || `venta-${saleData.idVenta}`}
            </p>
          </div>

          <div className="space-y-1">
            <div>
              <span className="text-muted-foreground">Fecha: </span>
              <span className="font-semibold">{new Date().toLocaleString("es-CL")}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cliente: </span>
              <span className="font-semibold">{clientLabel}</span>
            </div>
            {clientData && (
              <div>
                <span className="text-muted-foreground">RUT: </span>
                <span className="font-semibold">{clientData.rut}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Vendedor ID: </span>
              <span className="font-semibold">1</span>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-slate-350 dark:border-slate-700 py-2">
            <table className="w-full">
              <thead>
                <tr className="text-left font-bold text-[10px] text-muted-foreground border-b border-slate-250 dark:border-slate-800 pb-1">
                  <th className="w-2/4">PRODUCTO</th>
                  <th className="w-1/4 text-center">CANT</th>
                  <th className="w-1/4 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {selectedProducts.map((sp, i) => {
                  const prod = products.find((p) => p.idProducto.toString() === sp.idProducto)
                  return (
                    <tr key={i} className="align-top">
                      <td className="py-1 max-w-[150px] truncate">{prod?.nombre || "Producto"}</td>
                      <td className="py-1 text-center font-bold">{sp.cantidad}</td>
                      <td className="py-1 text-right font-bold">
                        ${(sp.cantidad * sp.precioUnitario).toLocaleString("es-CL")}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-1.5 text-right font-semibold">
            <div className="flex justify-between">
              <span className="text-muted-foreground">SUBTOTAL:</span>
              <span>${subtotal.toLocaleString("es-CL")}</span>
            </div>
            {descuento > 0 && (
              <div className="flex justify-between text-red-500">
                <span className="font-bold">DESCUENTO:</span>
                <span>-${descuento.toLocaleString("es-CL")}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] text-muted-foreground font-normal">
              <span>NETO:</span>
              <span>${neto.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-normal">
              <span>IVA (19%):</span>
              <span>${iva.toLocaleString("es-CL")}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-dashed border-slate-350 dark:border-slate-700 pt-1.5">
              <span>TOTAL PAGADO:</span>
              <span>${finalTotal.toLocaleString("es-CL")}</span>
            </div>
          </div>

          <div className="text-center border-t border-dashed border-slate-350 dark:border-slate-700 pt-3">
            <p className="text-[10px] font-semibold uppercase">
              Método: <strong className="text-primary">{metodoPago}</strong> | Estado: <strong className="text-green-600">{estadoPago}</strong>
            </p>
            <p className="text-[9px] text-muted-foreground mt-2">¡Gracias por tu compra en Urban Cycling!</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button onClick={handleCloseSuccess}>Cerrar</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 py-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Selector de Cliente */}
          <div className="space-y-1.5">
            <Label htmlFor="cliente" className="text-xs font-semibold text-slate-700 dark:text-slate-400">
              Cliente <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
            </Label>
            {isLoadingClients ? (
              <div className="flex h-10 items-center justify-center rounded-lg border border-input px-3 py-2 text-xs text-muted-foreground bg-slate-50/50 dark:bg-slate-800/20">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                Cargando clientes...
              </div>
            ) : (
              <>
                <Select
                  value={selectedClientId || "none"}
                  onValueChange={(val) => setSelectedClientId(val === "none" ? "" : val)}
                >
                  <SelectTrigger className="w-full h-10 border border-slate-200 bg-background text-sm">
                    <SelectValue placeholder="-- Venta sin asociar (Cliente General) --" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="none">-- Venta sin asociar (Cliente General) --</SelectItem>
                    {clients.map((c) => {
                      const label = c.razonSocial
                        ? `${c.razonSocial} (${c.rut})`
                        : `${c.primerNombre} ${c.apellidoPaterno || ""} (${c.rut})`.trim()
                      return (
                        <SelectItem key={c.idCliente} value={String(c.idCliente)}>
                          {label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between text-[10px] mt-1 px-1">
                  <span className="text-muted-foreground">¿El cliente no está registrado?</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenQuickCreateClient(true)}
                      className="text-primary hover:underline font-bold cursor-pointer"
                    >
                      + Registrar aquí
                    </button>
                    <span className="text-slate-300">|</span>
                    <a
                      href="/clientes"
                      target="_blank"
                      className="text-muted-foreground hover:text-slate-700 hover:underline font-bold"
                    >
                      Ir a Clientes
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Fecha de Registro (Muted) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-400">
              Fecha de Venta
            </Label>
            <Input
              type="text"
              value={new Date().toLocaleDateString("es-ES")}
              disabled
              className="bg-slate-100/50 dark:bg-slate-800/50 cursor-not-allowed font-medium text-sm"
            />
          </div>
        </div>

        {/* Listado de Productos */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
            <Label className="text-sm font-bold flex items-center gap-1">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Productos / Accesorios a Vender
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddProduct}
              className="h-8 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir Línea
            </Button>
          </div>

          {selectedProducts.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
              <p className="text-xs text-muted-foreground italic">
                No se han agregado productos a la venta en mostrador.
              </p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleAddProduct}
                className="mt-1 text-xs text-primary font-bold"
              >
                Comienza agregando un producto
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedProducts.map((selProd, idx) => {
                const selectedItem = products.find((p) => p.idProducto.toString() === selProd.idProducto)
                const maxStock = selectedItem ? selectedItem.stockActual : 0
                const isOut = selectedItem ? selProd.cantidad > maxStock : false

                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-3 bg-slate-50/50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs animate-in slide-in-from-top-1 duration-150"
                  >
                    {/* Selector del Producto */}
                    <div className="flex-1 min-w-52">
                      {isLoadingProducts ? (
                        <div className="flex h-9 items-center justify-center rounded-md border border-input px-3 py-1 text-xs text-muted-foreground">
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          Cargando...
                        </div>
                      ) : (
                        <Select
                          value={selProd.idProducto || undefined}
                          onValueChange={(val) => handleProductChange(idx, val)}
                        >
                          <SelectTrigger className="h-9 w-full text-xs bg-background border border-slate-200">
                            <SelectValue placeholder="-- Selecciona un Producto --" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {products.map((p) => (
                              <SelectItem key={p.idProducto} value={String(p.idProducto)}>
                                {p.nombre} (Stock: {p.stockActual}) - ${Number(p.precioVenta).toLocaleString("es-CL")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Entrada de Cantidad */}
                    <div className="w-24">
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          max={maxStock || undefined}
                          value={selProd.cantidad}
                          onChange={(e) =>
                            handleProductQuantityChange(idx, Number(e.target.value))
                          }
                          className={`h-9 text-xs pr-6 ${isOut ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          placeholder="Cant."
                          required
                        />
                        {maxStock > 0 && (
                          <span className="absolute right-2 top-2.5 text-[9px] text-muted-foreground font-semibold">
                            /{maxStock}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precios e Informes */}
                    <div className="text-xs font-semibold w-24">
                      Uni: ${selProd.precioUnitario.toLocaleString("es-CL")}
                    </div>

                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 w-24 text-right">
                      Sub: ${(selProd.cantidad * selProd.precioUnitario).toLocaleString("es-CL")}
                    </div>

                    {/* Borrar Fila */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveProduct(idx)}
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/20 rounded-md cursor-pointer transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Alerta de Stock */}
                    {isOut && (
                      <div className="w-full text-[10px] text-red-500 font-bold px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-1 duration-150">
                        Advertencia de Caso de Uso: No hay suficiente stock disponible. (Stock Máximo: {maxStock})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalles Financieros y Pago */}
        <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-slate-100 dark:border-slate-850">
          {/* Configuración de Pago */}
          <div className="space-y-4">
            <Label className="text-sm font-bold flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-primary" />
              Información del Pago
            </Label>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Método de Pago */}
              <div className="space-y-1.5">
                <Label htmlFor="metodoPago" className="text-xs font-semibold">
                  Método de Pago
                </Label>
                <Select
                  value={metodoPago}
                  onValueChange={setMetodoPago}
                >
                  <SelectTrigger className="h-9 w-full text-xs bg-background border border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="debito">Tarjeta de Débito</SelectItem>
                    <SelectItem value="credito">Tarjeta de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estado de Pago */}
              <div className="space-y-1.5">
                <Label htmlFor="estadoPago" className="text-xs font-semibold">
                  Estado del Pago
                </Label>
                <Select
                  value={estadoPago}
                  onValueChange={setEstadoPago}
                >
                  <SelectTrigger className="h-9 w-full text-xs bg-background border border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="pagada">Pagada (Cierre de Venta)</SelectItem>
                    <SelectItem value="pendiente">Pendiente (Abono posterior)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descuento Global */}
            <div className="space-y-1.5">
              <Label htmlFor="descuento" className="text-xs font-semibold flex items-center gap-1">
                <Percent className="h-3 w-3" />
                Descuento Global ($)
              </Label>
              <Input
                id="descuento"
                type="number"
                min={0}
                max={subtotal}
                value={descuento}
                onChange={(e) => setDescuento(Math.min(subtotal, Math.max(0, Number(e.target.value))))}
                className="h-9 text-xs"
                placeholder="Descuento CLP"
              />
            </div>
          </div>

          {/* Resumen de Costos */}
          <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-250/50 dark:border-slate-800 space-y-3 text-xs font-semibold">
            <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200/50 dark:border-slate-800 pb-1.5">
              Resumen de Totales
            </h4>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal Productos:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                ${subtotal.toLocaleString("es-CL")}
              </span>
            </div>

            {descuento > 0 && (
              <div className="flex justify-between text-red-500">
                <span className="font-bold">Descuento Global Applied:</span>
                <span>-${descuento.toLocaleString("es-CL")}</span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground font-normal text-[11px] pt-1">
              <span>Neto Estimado (Afecto):</span>
              <span>${neto.toLocaleString("es-CL")}</span>
            </div>

            <div className="flex justify-between text-muted-foreground font-normal text-[11px]">
              <span>IVA (19%):</span>
              <span>${iva.toLocaleString("es-CL")}</span>
            </div>

            <div className="flex justify-between text-sm font-bold border-t border-slate-200/60 dark:border-slate-800 pt-2.5 text-primary">
              <span>TOTAL FINAL:</span>
              <span className="text-base">${finalTotal.toLocaleString("es-CL")}</span>
            </div>
          </div>
        </div>

        {/* Botones de Envío */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpenModalCreate(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || selectedProducts.some((p) => {
              const matched = products.find((pr) => pr.idProducto.toString() === p.idProducto)
              return matched && p.cantidad > matched.stockActual
            })}
            className="font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando Venta...
              </>
            ) : (
              "Registrar Venta"
            )}
          </Button>
        </div>
      </form>

      {/* Diálogo de Registro Rápido de Cliente */}
      <Dialog open={openQuickCreateClient} onOpenChange={setOpenQuickCreateClient}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Cliente Rápido</DialogTitle>
            <DialogDescription>
              Ingresa los datos para registrar un nuevo cliente en el sistema.
            </DialogDescription>
          </DialogHeader>
          <FormCreateCliente onSuccess={handleQuickClientSuccess} />
        </DialogContent>
      </Dialog>
    </>
  )
}
