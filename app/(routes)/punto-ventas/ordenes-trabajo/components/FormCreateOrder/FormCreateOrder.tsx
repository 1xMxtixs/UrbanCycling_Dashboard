"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Loader2,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormCreateCliente } from "@/app/(routes)/clientes/components/FormCreateCliente/FormCreateCliente"


import { BikesSection, BikeInput } from "./BikesSection"
import { OrderLinesSection, Product, SelectedProduct } from "./OrderLinesSection"
import { PaymentInitialSection } from "./PaymentInitialSection"

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

interface FormCreateOrderProps {
  setOpenModalCreate: (open: boolean) => void
}

export function FormCreateOrder({ setOpenModalCreate }: FormCreateOrderProps) {
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [fechaIngreso] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [fechaEntrega, setFechaEntrega] = useState<string>("")
  const [descripcion, setDescripcion] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [estadoPago, setEstadoPago] = useState<string>("pendiente")
  const [metodoPago, setMetodoPago] = useState<string>("efectivo")
  const [montoAbono, setMontoAbono] = useState<number>(0)

  const [openQuickCreateClient, setOpenQuickCreateClient] = useState(false)

  const [bikes, setBikes] = useState<BikeInput[]>([
    {
      marca: "",
      modelo: "",
      color: "",
      descripcion: "",
      imagenUrl: "",
      imageFile: null,
      imagePreview: null,
      isUploading: false,
      isCollapsed: false,
    },
  ])

  const [montoServicio, setMontoServicio] = useState<number>(0)
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  )

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

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clientes")
        if (res.ok) {
          const data = await res.json()
          setClients(data)
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

    fetchClients()
    fetchProducts()
  }, [])

  const handleAddBike = () => {
    setBikes(
      bikes
        .map((b) => ({ ...b, isCollapsed: true }))
        .concat([
          {
            marca: "",
            modelo: "",
            color: "",
            descripcion: "",
            imagenUrl: "",
            imageFile: null,
            imagePreview: null,
            isUploading: false,
            isCollapsed: false,
          },
        ])
    )
  }

  const handleQuickClientSuccess = () => {
    setOpenQuickCreateClient(false)
    toast.success("Cliente creado correctamente.")
    fetchClients(true) // Re-fetch y auto-selecciona el más nuevo
  }

  const handleRemoveBike = (index: number) => {
    if (bikes.length <= 1) {
      toast.warning("Debe asociar al menos una bicicleta a la orden.")
      return
    }
    setBikes(bikes.filter((_, i) => i !== index))
  }

  const handleUpdateBikeField = (
    index: number,
    field: keyof BikeInput,
    value: any
  ) => {
    const updated = [...bikes]
    updated[index] = { ...updated[index], [field]: value }
    setBikes(updated)
  }

  const toggleCollapse = (index: number) => {
    const updated = [...bikes]
    updated[index].isCollapsed = !updated[index].isCollapsed
    setBikes(updated)
  }

  const handleBikeImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no permitido. Solo JPG, PNG, WEBP, GIF.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen supera el tamaño máximo de 5 MB.")
      return
    }

    const previewUrl = URL.createObjectURL(file)
    const updated = [...bikes]
    updated[index] = {
      ...updated[index],
      imageFile: file,
      imagePreview: previewUrl,
    }
    setBikes(updated)
  }

  const handleRemoveBikeImage = (index: number) => {
    const updated = [...bikes]
    updated[index] = {
      ...updated[index],
      imageFile: null,
      imagePreview: null,
      imagenUrl: "",
    }
    setBikes(updated)
  }

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

  const totalProductsCost = selectedProducts.reduce(
    (sum, p) => sum + p.cantidad * p.precioUnitario,
    0
  )
  const grandTotal = totalProductsCost + montoServicio

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId) {
      toast.error("Debe seleccionar un cliente.")
      return
    }

    if (!fechaEntrega) {
      toast.error("Debe ingresar una fecha estimada de entrega.")
      return
    }

    const incompleteBikeIdx = bikes.findIndex(
      (b) => !b.marca.trim() || !b.modelo.trim() || !b.color.trim()
    )
    if (incompleteBikeIdx !== -1) {
      toast.error(
        `La bicicleta #${incompleteBikeIdx + 1} está incompleta. Debe indicar Marca, Modelo y Color.`
      )
      const updated = [...bikes]
      updated[incompleteBikeIdx].isCollapsed = false
      setBikes(updated)
      return
    }

    const incompleteProductIdx = selectedProducts.findIndex(
      (p) => !p.idProducto
    )
    if (incompleteProductIdx !== -1) {
      toast.error(
        `Debe seleccionar un producto en la línea #${incompleteProductIdx + 1}.`
      )
      return
    }

    if (
      estadoPago === "abono" &&
      (montoAbono <= 0 || montoAbono >= grandTotal)
    ) {
      toast.error(
        `El abono debe ser mayor a 0 y menor al total de la orden ($${grandTotal.toLocaleString("es-CL")}).`
      )
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Upload any pending bike images
      const bikesData = await Promise.all(
        bikes.map(async (b, idx) => {
          let finalImageUrl = b.imagenUrl || null
          if (b.imageFile) {
            const formData = new FormData()
            formData.append("file", b.imageFile)
            const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })
            if (!res.ok) {
              throw new Error(
                `Error al subir la imagen de la bicicleta #${idx + 1}`
              )
            }
            const data = await res.json()
            finalImageUrl = data.url
          }
          return {
            marca: b.marca.trim(),
            modelo: b.modelo.trim(),
            color: b.color.trim(),
            descripcion: b.descripcion.trim() || null,
            imagenUrl: finalImageUrl,
          }
        })
      )

      const response = await fetch("/api/punto-venta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: 1,
          id_cliente: Number(selectedClientId),
          estado_pago: estadoPago,
          metodo_pago: estadoPago === "pendiente" ? null : metodoPago,
          monto_pagado:
            estadoPago === "pagada"
              ? grandTotal
              : estadoPago === "abono"
                ? montoAbono
                : 0,
          descuento: 0,
          ordenTrabajo: {
            fechaEntregaEstimada: new Date(fechaEntrega).toISOString(),
            observacionesIngreso: descripcion.trim() || null,
            estadoOrden: "Por realizar",
            montoServicio,
            productos: selectedProducts.map((p) => ({
              idProducto: Number(p.idProducto),
              cantidad: p.cantidad,
              precioUnitario: p.precioUnitario,
            })),
            bicicletas: bikesData,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al crear la orden")
      }

      toast.success("Orden de trabajo creada correctamente")
      window.dispatchEvent(new Event("work-orders:refresh"))
      router.refresh()
      setOpenModalCreate(false)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "No se pudo registrar la orden de trabajo")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 py-1"
      >
        {/* ── Información General ─────────────────────────────────── */}
        <div className="space-y-4 rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
          <h3 className="text-foreground flex items-center gap-2 border-b border-border pb-2 text-sm font-bold">
            <Sparkles className="h-4 w-4 text-primary" />
            Información General
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Cliente Select */}
            <div className="space-y-1.5">
              <Label
                htmlFor="cliente"
                className="text-muted-foreground text-xs font-semibold"
              >
                Cliente <span className="text-destructive">*</span>
              </Label>
              {isLoadingClients ? (
                <div className="flex h-10 items-center justify-center rounded-lg border border-input px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  Cargando clientes...
                </div>
              ) : (
                <>
                  <Select
                    value={selectedClientId || undefined}
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger className="h-10 w-full bg-background border-input text-sm">
                      <SelectValue placeholder="-- Selecciona un Cliente --" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {clients.map((c) => {
                        const label = c.razonSocial
                          ? `${c.razonSocial} (${c.rut})`
                          : `${c.primerNombre} ${c.apellidoPaterno || ""} (${c.rut})`.trim()
                        return (
                          <SelectItem
                            key={c.idCliente}
                            value={String(c.idCliente)}
                          >
                            {label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <div className="mt-1 flex items-center justify-between px-1 text-[10px]">
                    <span className="text-muted-foreground">
                      ¿El cliente no está registrado?
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="link"
                        size="sm"
                        type="button"
                        onClick={() => setOpenQuickCreateClient(true)}
                        className="h-auto p-0 font-bold"
                      >
                        + Registrar aquí
                      </Button>
                      <span className="text-muted-foreground/40">|</span>
                      <a
                        href="/clientes"
                        target="_blank"
                        className="font-bold text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Ir a Clientes
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Fecha Ingreso (disabled) */}
            <div className="space-y-1.5">
              <Label
                htmlFor="fechaIngreso"
                className="text-muted-foreground text-xs font-semibold"
              >
                Fecha de Ingreso
              </Label>
              <Input
                id="fechaIngreso"
                type="date"
                value={fechaIngreso}
                disabled
                className="cursor-not-allowed bg-muted text-muted-foreground"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Fecha Estimada Entrega */}
            <div className="space-y-1.5">
              <Label
                htmlFor="fechaEntrega"
                className="text-muted-foreground text-xs font-semibold"
              >
                Fecha Estimada de Entrega{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fechaEntrega"
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                min={fechaIngreso}
                required
              />
            </div>

            {/* Descripción del Trabajo */}
            <div className="space-y-1.5 md:col-span-2">
              <Label
                htmlFor="descripcion"
                className="text-muted-foreground text-xs font-semibold"
              >
                Descripción del Trabajo a Realizar
              </Label>
              <Textarea
                id="descripcion"
                placeholder="Ej: Mantención general de transmisión, centrado de llantas..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <BikesSection
          bikes={bikes}
          isSubmitting={isSubmitting}
          onAddBike={handleAddBike}
          onRemoveBike={handleRemoveBike}
          onUpdateBikeField={handleUpdateBikeField}
          onToggleCollapse={toggleCollapse}
          onBikeImageChange={handleBikeImageChange}
          onRemoveBikeImage={handleRemoveBikeImage}
        />

        <OrderLinesSection
          products={products}
          selectedProducts={selectedProducts}
          montoServicio={montoServicio}
          totalProductsCost={totalProductsCost}
          grandTotal={grandTotal}
          onMontoServicioChange={setMontoServicio}
          onAddProduct={handleAddProduct}
          onRemoveProduct={handleRemoveProduct}
          onProductChange={handleProductChange}
          onProductQuantityChange={handleProductQuantityChange}
        />

        <PaymentInitialSection
          estadoPago={estadoPago}
          metodoPago={metodoPago}
          montoAbono={montoAbono}
          grandTotal={grandTotal}
          onEstadoPagoChange={setEstadoPago}
          onMetodoPagoChange={setMetodoPago}
          onMontoAbonoChange={setMontoAbono}
        />

        <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
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
            disabled={isSubmitting || bikes.some((b) => b.isUploading)}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando orden...
              </span>
            ) : (
              "Crear Orden de Trabajo"
            )}
          </Button>
        </div>
      </form>

      {/* Diálogo de Registro Rápido de Cliente */}
      <Dialog
        open={openQuickCreateClient}
        onOpenChange={setOpenQuickCreateClient}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
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
