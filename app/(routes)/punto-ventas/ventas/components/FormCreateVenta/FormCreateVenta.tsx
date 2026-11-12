"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Plus,
  Trash2,
  Loader2,
  ShoppingBag,
  DollarSign,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataField } from "@/components/common/DataField"
import { ESTADO_PAGO } from "@/lib/payment-status"
import { ESTADO_VENTA } from "@/lib/sale-status"
import { isRegistroActivo } from "@/lib/registro-status"
import { METODO_PAGO_DEFECTO, METODOS_PAGO } from "@/lib/payment-methods"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormDialog } from "@/components/forms/FormDialog"
import { FormCreateCliente } from "@/app/(routes)/clientes/components/FormCreateCliente/FormCreateCliente"

import { SaleSuccessReceipt } from "./SaleSuccessReceipt"
import type { Client } from "@/app/(routes)/punto-ventas/types"
import type { SaleCreationResult } from "../../types"

const createSaleLineKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `prod-${Date.now()}-${Math.random()}`

const focusSaleField = (id: string) => {
  const control = document.getElementById(id)
  if (!control) return

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches
  control.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "nearest",
  })
  requestAnimationFrame(() => control.focus())
}

interface Product {
  idProducto: number
  nombre: string
  precioVenta: number
  stockActual: number
  estado: string
}

interface SelectedProduct {
  keyId?: string
  idProducto: string
  cantidad: number
  precioUnitario: number
  descuentoUnitario: number
}

interface FormCreateVentaProps {
  setOpenModalCreate?: (open: boolean) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FormCreateVenta({
  setOpenModalCreate,
  open,
  onOpenChange,
}: FormCreateVentaProps) {
  const router = useRouter()
  const { data: session } = useSession()

  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)

  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  const [selectedClientId, setSelectedClientId] = useState<string>("")

  // Descuento global en pesos chilenos
  const [descuento, setDescuento] = useState<number>(0)

  const [metodoPago, setMetodoPago] = useState<string>(METODO_PAGO_DEFECTO)
  const [estadoPago, setEstadoPago] = useState<string>(ESTADO_PAGO.PAGADA)

  const [selectedProducts, setSelectedProducts] = useState<
    SelectedProduct[]
  >([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState("")

  const [saleResult, setSaleResult] = useState<SaleCreationResult | null>(null)

  const [openQuickCreateClient, setOpenQuickCreateClient] =
    useState(false)

  async function fetchClients(selectNewest = false) {
    try {
      const res = await fetch("/api/clientes")

      if (res.ok) {
        const data = await res.json()

        setClients(data)

        if (selectNewest && data.length > 0) {
          const newest = data.reduce(
            (prev: Client, current: Client) =>
              prev.idCliente > current.idCliente ? prev : current
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

        setProducts(data.filter((p: Product) => isRegistroActivo(p.estado)))
      }
    } catch (err) {
      console.error("Error fetching products:", err)
      toast.error("No se pudieron cargar los productos")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      void fetchClients()
      void fetchProducts()
    })
  }, [])

  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      {
        keyId: createSaleLineKey(),
        idProducto: "",
        cantidad: 1,
        precioUnitario: 0,
        descuentoUnitario: 0,
      },
    ])
  }

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(
      selectedProducts.filter((_, i) => i !== index)
    )
  }

  // Cambiar producto
  const handleProductChange = (
    index: number,
    idProducto: string
  ) => {
    const matched = products.find(
      (p) => p.idProducto.toString() === idProducto
    )

    const price = matched ? Number(matched.precioVenta) : 0

    const updated = [...selectedProducts]

    updated[index] = {
      ...updated[index],
      idProducto,
      precioUnitario: price,
      cantidad: 1,
      descuentoUnitario: 0,
    }

    setSelectedProducts(updated)
  }

  // Cambiar cantidad
  const handleProductQuantityChange = (
    index: number,
    cantidad: number
  ) => {
    const updated = [...selectedProducts]

    const cantidadValida = Math.max(1, cantidad)

    updated[index] = {
      ...updated[index],
      cantidad: cantidadValida,
      descuentoUnitario: Math.min(
        updated[index].descuentoUnitario,
        updated[index].precioUnitario
      ),
    }

    setSelectedProducts(updated)
  }

  // Cambiar descuento unitario
  const handleProductDiscountChange = (
    index: number,
    descuentoUnitario: number
  ) => {
    const updated = [...selectedProducts]

    const product = updated[index]

    const descuentoValido = Math.min(
      product.precioUnitario,
      Math.max(0, descuentoUnitario)
    )

    updated[index] = {
      ...product,
      descuentoUnitario: descuentoValido,
    }

    setSelectedProducts(updated)
  }

  // Subtotal de productos antes de descuentos
  const totalProductsCost = selectedProducts.reduce(
    (sum, p) =>
      sum + p.cantidad * p.precioUnitario,
    0
  )

  // Total de descuentos por producto
  const totalLineDiscounts = selectedProducts.reduce(
    (sum, p) =>
      sum + p.cantidad * p.descuentoUnitario,
    0
  )

  // Subtotal después de descuentos por línea
  const subtotalAfterLineDiscounts = Math.max(
    0,
    totalProductsCost - totalLineDiscounts
  )

  // El descuento global no puede superar lo que queda
  const descuentoGlobal = Math.min(
    descuento,
    subtotalAfterLineDiscounts
  )

  // Total final
  const finalTotal = Math.max(
    0,
    subtotalAfterLineDiscounts - descuentoGlobal
  )

  const subtotal = totalProductsCost

  const neto = Math.round(finalTotal / 1.19)
  const iva = finalTotal - neto

  const handleQuickClientSuccess = () => {
    setOpenQuickCreateClient(false)


    fetchClients(true)
  }

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()
    setValidationError("")

    if (!session?.user?.idUsuario) {
      toast.error("Tu sesión expiró. Vuelve a iniciar sesión.")
      return
    }

    if (selectedProducts.length === 0) {
      setValidationError("Debe agregar al menos un producto a la venta.")
      focusSaleField("sale-add-first-product")
      return
    }

    const incompleteProductIdx =
      selectedProducts.findIndex(
        (p) => !p.idProducto
      )

    if (incompleteProductIdx !== -1) {
      setValidationError(`Debe seleccionar un producto en la línea #${incompleteProductIdx + 1}.`)
      focusSaleField(`sale-product-${incompleteProductIdx}`)
      return
    }

    // Validación de stock
    for (let i = 0; i < selectedProducts.length; i++) {
      const sp = selectedProducts[i]

      const prod = products.find(
        (p) =>
          p.idProducto.toString() === sp.idProducto
      )

      if (
        prod &&
        sp.cantidad > prod.stockActual
      ) {
        setValidationError(
          `Stock insuficiente para ${prod.nombre}. Solicitado: ${sp.cantidad}, disponible: ${prod.stockActual}.`
        )
        focusSaleField(`sale-quantity-${i}`)
        return
      }
    }

    // Validación de descuentos unitarios
    const invalidDiscountIdx =
      selectedProducts.findIndex(
        (p) =>
          p.descuentoUnitario < 0 ||
          p.descuentoUnitario >
            p.precioUnitario
      )

    if (invalidDiscountIdx !== -1) {
      setValidationError(
        `Descuento inválido en la línea #${invalidDiscountIdx + 1}. No puede superar el precio unitario.`
      )
      focusSaleField(`sale-discount-${invalidDiscountIdx}`)
      return
    }

    // Validación del descuento global
    if (
      descuentoGlobal < 0 ||
      descuentoGlobal >
        subtotalAfterLineDiscounts
    ) {
      setValidationError("El descuento global no puede superar el subtotal disponible.")
      focusSaleField("descuento")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        "/api/punto-venta",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_usuario: session.user.idUsuario,
            id_cliente: selectedClientId
              ? Number(selectedClientId)
              : null,

            estado_pago: estadoPago,

            // Descuento global
            descuento: descuentoGlobal,

            productos:
              selectedProducts.map((p) => ({
                idProducto: Number(
                  p.idProducto
                ),
                cantidad: p.cantidad,
                precioUnitario:
                  p.precioUnitario,

                // Descuento monetario por unidad
                descuentoUnitario:
                  p.descuentoUnitario,
              })),

            metodo_pago: metodoPago,
            // El POST rechaza monto 0 junto con metodo_pago y crea un pago con este importe.
            // Por eso no se cambia a 0 aquí; el backend puede finalizar como pagada una venta pendiente.
            monto_pagado: finalTotal,
            estado_venta: ESTADO_VENTA.COMPLETADA,
          }),
        }
      )

      const responseData =
        await response.json()

      if (!response.ok) {
        if (
          responseData.code ===
          "STOCK_INSUFICIENTE"
        ) {
          const availableSuffix = responseData.cantidadDisponible !== undefined
            ? ` (disponibles: ${responseData.cantidadDisponible})`
            : ""
          toast.error(`Stock insuficiente. ${responseData.message}${availableSuffix}`)
        } else {
          toast.error(
            responseData.message ||
              "Error al procesar la venta."
          )
        }

        return
      }

      toast.success(
        "Venta realizada correctamente."
      )

      setSaleResult(responseData)
    } catch (err) {
      console.error(err)

      toast.error(
        "Error de conexión al procesar la venta."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setValidationError("")
    setSelectedClientId("")
    setDescuento(0)
    setMetodoPago(METODO_PAGO_DEFECTO)
    setEstadoPago(ESTADO_PAGO.PAGADA)
    setSelectedProducts([])
    setSaleResult(null)
  }

  const closeModal = () => {
    setOpenModalCreate?.(false)
    onOpenChange?.(false)
  }

  const handleDiscardDraft = () => {
    resetForm()
    closeModal()
  }

  const handleCloseSuccess = () => {
    resetForm()
    closeModal()

    window.dispatchEvent(
      new Event("sales:refresh")
    )

    router.refresh()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && saleResult) {
      handleCloseSuccess()
      return
    }

    setOpenModalCreate?.(nextOpen)
    onOpenChange?.(nextOpen)
  }

  // Vista de recibo
  if (saleResult) {
    const clientData = selectedClientId
      ? clients.find(
          (c) =>
            c.idCliente.toString() ===
            selectedClientId
        )
      : undefined

    const clientLabel = clientData
      ? clientData.razonSocial
        ? clientData.razonSocial
        : `${clientData.primerNombre} ${
            clientData.apellidoPaterno || ""
          }`.trim()
      : "Cliente general"

    const receiptContent = (
      <SaleSuccessReceipt
        saleResult={saleResult}
        clientLabel={clientLabel}
        clientRut={clientData?.rut}
        selectedProducts={selectedProducts}
        products={products}
        subtotal={subtotal}
        descuento={
          totalLineDiscounts +
          descuentoGlobal
        }
        neto={neto}
        iva={iva}
        finalTotal={finalTotal}
        metodoPago={metodoPago}
        estadoPago={estadoPago}
        vendedor={session?.user?.name ?? "—"}
        onClose={handleCloseSuccess}
      />
    )

    if (open !== undefined || onOpenChange !== undefined) {
      return (
        <FormDialog
          open={open}
          onOpenChange={handleOpenChange}
          title="Comprobante de Venta"
          description="Venta procesada con éxito. Puedes imprimir o guardar el comprobante."
          size="3xl"
        >
          {receiptContent}
        </FormDialog>
      )
    }

    return receiptContent
  }

  const footerContent = (
    <div className="space-y-3">
      {validationError && (
        <p role="alert" className="text-sm text-destructive">
          {validationError}
        </p>
      )}
      <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={handleDiscardDraft}
          disabled={isSubmitting}
        >
          Descartar borrador
        </Button>
        <Button
          type="submit"
          form="form-create-venta"
          disabled={isSubmitting}
          className="font-bold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
              Procesando Venta...
            </>
          ) : (
            "Registrar Venta"
          )}
        </Button>
      </div>
    </div>
  )

  const contentBody = (
    <form
      id="form-create-venta"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section className="space-y-4 rounded-xl border border-border p-4">
        <h3 className="flex items-center gap-2 border-b border-border pb-2 text-sm font-bold text-foreground">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          Información de la venta
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">

        {/* Selector de Cliente */}
        <div>
          <Label
            htmlFor="cliente"
            className="inline-block mb-1.5 font-medium text-foreground"
          >
            Cliente{" "}
            <span className="text-xs text-muted-foreground font-normal">
              (Opcional)
            </span>
          </Label>

            {isLoadingClients ? (
              <div className="flex h-10 items-center justify-center rounded-lg border border-input px-3 py-2 text-xs text-muted-foreground bg-muted/40">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
                Cargando clientes...
              </div>
            ) : (
              <>
                <Select
                  value={
                    selectedClientId ||
                    "none"
                  }
                  onValueChange={(val) =>
                    setSelectedClientId(
                      val === "none"
                        ? ""
                        : val
                    )
                  }
                >
                  <SelectTrigger className="w-full h-10 border-input bg-background text-sm">
                    <SelectValue placeholder="-- Venta sin asociar (Cliente General) --" />
                  </SelectTrigger>

                  <SelectContent position="popper">
                    <SelectItem value="none">
                      -- Venta sin asociar (Cliente General) --
                    </SelectItem>

                    {clients.map((c) => {
                      const nombreCliente = c.razonSocial
                        || `${c.primerNombre} ${c.apellidoPaterno || ""}`.trim()
                      const label = c.rut
                        ? `${nombreCliente} (${c.rut})`
                        : nombreCliente

                      return (
                        <SelectItem
                          key={c.idCliente}
                          value={String(
                            c.idCliente
                          )}
                        >
                          {label}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-between text-[10px] mt-1 px-1">
                  <span className="text-muted-foreground">
                    ¿El cliente no está registrado?
                  </span>

                  <div className="flex gap-2">
                    <Button
                      variant="link"
                      size="sm"
                      type="button"
                      onClick={() =>
                        setOpenQuickCreateClient(
                          true
                        )
                      }
                      className="h-auto p-0 font-bold"
                    >
                      + Registrar aquí
                    </Button>

                    <span className="text-muted-foreground/40">
                      |
                    </span>

                    <a
                      href="/clientes"
                      target="_blank"
                      className="text-muted-foreground hover:text-foreground hover:underline font-bold"
                    >
                      Ir a Clientes
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Fecha */}
          <div>
            <Label htmlFor="fechaVenta" className="inline-block mb-1.5 font-medium text-foreground">
              Fecha de Venta
            </Label>

            <Input
              id="fechaVenta"
              type="text"
              value={new Date().toLocaleDateString("es-CL")}
              disabled
              className="cursor-not-allowed bg-muted text-sm font-medium text-muted-foreground"
            />
          </div>
          </div>
        </section>

        {/* Productos */}
        <section className="space-y-4 rounded-xl border border-border p-4">
          <div className="flex flex-col gap-2 border-b border-border pb-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              Productos / Accesorios a Vender
            </h3>

            {selectedProducts.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddProduct}
                className="h-8 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir línea
              </Button>
            )}
          </div>

          {selectedProducts.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
              <p className="max-w-sm text-xs text-muted-foreground">
                Al agregar una línea podrás elegir el producto, definir la cantidad y el descuento por unidad.
              </p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddProduct}
                id="sale-add-first-product"
                className="text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Añadir primer producto
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {selectedProducts.map(
                (selProd, idx) => {
                  const selectedItem =
                    products.find(
                      (p) =>
                        p.idProducto.toString() ===
                        selProd.idProducto
                    )

                  const maxStock =
                    selectedItem
                      ? selectedItem.stockActual
                      : 0

                  const subtotalLinea =
                    selProd.cantidad *
                    (
                      selProd.precioUnitario -
                      selProd.descuentoUnitario
                    )

                  return (
                    <div
                      key={selProd.keyId || `prod-${selProd.idProducto || idx}-${idx}`}
                      className="space-y-3 rounded-lg border border-border/70 bg-muted/50 p-3 animate-in slide-in-from-top-1 duration-150 motion-reduce:animate-none"
                    >
                      <div className="flex items-end gap-3">
                        <div className="min-w-0 flex-1">
                          <Label htmlFor={`sale-product-${idx}`} className="inline-block mb-1.5 font-medium text-foreground">
                            Producto
                          </Label>
                        {isLoadingProducts ? (
                          <div className="flex h-9 items-center justify-center rounded-md border border-input px-3 py-1 text-xs text-muted-foreground">
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            Cargando...
                          </div>
                        ) : (
                          <Select
                            value={
                              selProd.idProducto ||
                              undefined
                            }
                            onValueChange={(val) =>
                              handleProductChange(
                                idx,
                                val
                              )
                            }
                          >
                            <SelectTrigger
                              id={`sale-product-${idx}`}
                              aria-label={`Producto ${idx + 1}`}
                              className="h-9 w-full border-input bg-background text-xs"
                            >
                              <SelectValue placeholder="-- Selecciona un Producto --" />
                            </SelectTrigger>

                            <SelectContent position="popper">
                              {products.map(
                                (p) => (
                                  <SelectItem
                                    key={
                                      p.idProducto
                                    }
                                    value={String(
                                      p.idProducto
                                    )}
                                  >
                                    {p.nombre} - $
                                    {Number(
                                      p.precioVenta
                                    ).toLocaleString(
                                      "es-CL"
                                    )}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Eliminar ${selectedItem?.nombre || `producto #${idx + 1}`}`}
                          onClick={() => handleRemoveProduct(idx)}
                          className="h-8 w-8 shrink-0 cursor-pointer rounded-md text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar {selectedItem?.nombre || `producto #${idx + 1}`}</span>
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
                        <div>
                          <Label htmlFor={`sale-quantity-${idx}`} className="inline-block mb-1.5 font-medium text-foreground">
                            Cantidad
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`sale-quantity-${idx}`}
                              type="number"
                              min={1}
                              value={selProd.cantidad}
                              disabled={!selProd.idProducto}
                              onChange={(e) =>
                                handleProductQuantityChange(idx, Number(e.target.value))
                              }
                              className="h-9 text-xs"
                              aria-label={`Cantidad para ${selectedItem?.nombre || `producto #${idx + 1}`}`}
                            />
                            {selectedItem && (
                              <span className="shrink-0 text-xs text-muted-foreground" aria-hidden="true">
                                / {maxStock}
                              </span>
                            )}
                          </div>
                        </div>

                        <DataField
                          label="Precio unitario"
                          value={`$${selProd.precioUnitario.toLocaleString("es-CL")}`}
                          className="self-center"
                        />

                        <div>
                          <Label htmlFor={`sale-discount-${idx}`} className="inline-block mb-1.5 font-medium text-foreground">
                            Descuento por unidad
                          </Label>
                          <Input
                            id={`sale-discount-${idx}`}
                            type="text"
                            inputMode="numeric"
                            placeholder="$0"
                            disabled={!selProd.idProducto}
                            value={
                              selProd.descuentoUnitario > 0
                                ? `$${selProd.descuentoUnitario.toLocaleString("es-CL")}`
                                : ""
                            }
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "")
                              const val = digits ? Math.min(selProd.precioUnitario, Number(digits)) : 0
                              handleProductDiscountChange(idx, val)
                            }}
                            className="h-9 text-xs"
                            aria-label={`Descuento unitario para ${selectedItem?.nombre || `producto #${idx + 1}`}`}
                          />
                        </div>

                        <DataField
                          label="Subtotal de línea"
                          value={`$${subtotalLinea.toLocaleString("es-CL")}`}
                          className="self-center"
                        />
                      </div>

                    </div>
                  )
                }
              )}
            </div>
          )}
        </section>

        {/* Detalles financieros y pago */}
        <section className="space-y-3 rounded-xl border border-border p-4">

          {/* Pago */}
          <div className="space-y-3">
            <h3 className="flex items-center gap-2 border-b border-border pb-2 text-sm font-bold text-foreground">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Pago y descuentos
            </h3>

            <div className="grid gap-3 sm:grid-cols-3">

              {/* Método */}
              <div>
                <Label
                  htmlFor="metodoPago"
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Método de Pago
                </Label>

                <Select
                  value={metodoPago}
                  onValueChange={setMetodoPago}
                >
                  <SelectTrigger className="h-10 data-[size=default]:h-10 w-full border-input bg-background text-sm">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent position="popper">
                    {METODOS_PAGO.map((metodo) => (
                      <SelectItem key={metodo.codigo} value={metodo.codigo}>
                        {metodo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estado */}
              <div>
                <Label
                  htmlFor="estadoPago"
                  className="inline-block mb-1.5 font-medium text-foreground"
                >
                  Estado del Pago
                </Label>

                <Select
                  value={estadoPago}
                  onValueChange={setEstadoPago}
                >
                  <SelectTrigger className="h-10 data-[size=default]:h-10 w-full border-input bg-background text-sm">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent position="popper">
                    <SelectItem value={ESTADO_PAGO.PAGADA}>
                      Pagada (Cierre de Venta)
                    </SelectItem>
                    <SelectItem value={ESTADO_PAGO.PENDIENTE}>
                      Pendiente (Abono posterior)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            {/* Descuento global */}
            <div>
              <Label
                htmlFor="descuento"
                className="inline-block mb-1.5 font-medium text-foreground"
              >
                Descuento Global
              </Label>

              <Input
                id="descuento"
                type="text"
                inputMode="numeric"
                placeholder="$0"
                value={descuento > 0 ? `$${descuento.toLocaleString("es-CL")}` : ""}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "")
                  const val = digits ? Math.min(subtotalAfterLineDiscounts, Number(digits)) : 0
                  setDescuento(val)
                }}
                className="h-10 text-sm"
              />
            </div>
          </div>
          </div>

          {/* Resumen */}
          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/50 p-4 text-xs font-semibold">
            <h4 className="border-b border-border pb-1.5 text-xs font-semibold tracking-tight text-foreground">
              Resumen de Totales
            </h4>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal Productos:
              </span>

              <span className="font-bold text-foreground">
                $
                {subtotal.toLocaleString(
                  "es-CL"
                )}
              </span>
            </div>

            {totalLineDiscounts > 0 && (
              <div className="flex justify-between text-destructive">
                <span className="font-bold">
                  Descuentos por Productos:
                </span>

                <span>
                  -$
                  {totalLineDiscounts.toLocaleString(
                    "es-CL"
                  )}
                </span>
              </div>
            )}

            {descuentoGlobal > 0 && (
              <div className="flex justify-between text-destructive">
                <span className="font-bold">
                  Descuento Global:
                </span>

                <span>
                  -$
                  {descuentoGlobal.toLocaleString(
                    "es-CL"
                  )}
                </span>
              </div>
            )}

            <div className="flex justify-between text-muted-foreground font-normal text-[11px] pt-1">
              <span>
                Neto Estimado (Afecto):
              </span>

              <span>
                $
                {neto.toLocaleString(
                  "es-CL"
                )}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground font-normal text-[11px]">
              <span>IVA (19%):</span>

              <span>
                $
                {iva.toLocaleString(
                  "es-CL"
                )}
              </span>
            </div>

            <div className="flex justify-between text-sm font-bold border-t border-border pt-2.5 text-foreground">
              <span>Total final:</span>

              <span className="text-sm">
                $
                {finalTotal.toLocaleString(
                  "es-CL"
                )}
              </span>
            </div>
          </div>
        </section>
      </form>
  )

  if (open !== undefined || onOpenChange !== undefined) {
    return (
      <>
        <FormDialog
          open={open}
          onOpenChange={handleOpenChange}
          title="Registrar Venta Directa"
          description="Selecciona el cliente, añade los productos y registra el pago para completar la transacción."
          size="3xl"
          footer={footerContent}
        >
          {contentBody}
        </FormDialog>

        {/* Registro rápido de cliente */}
        <FormCreateCliente
          open={openQuickCreateClient}
          onOpenChange={setOpenQuickCreateClient}
          title="Registrar cliente rápido"
          description="Ingresa los datos para registrar un nuevo cliente en el sistema."
          size="md"
          onSuccess={handleQuickClientSuccess}
          onCancel={() => setOpenQuickCreateClient(false)}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {contentBody}
        {footerContent}
      </div>

      {/* Registro rápido de cliente */}
      <FormCreateCliente
        open={openQuickCreateClient}
        onOpenChange={setOpenQuickCreateClient}
        title="Registrar cliente rápido"
        description="Ingresa los datos para registrar un nuevo cliente en el sistema."
        size="md"
        onSuccess={handleQuickClientSuccess}
        onCancel={() => setOpenQuickCreateClient(false)}
      />
    </>
  )
}
