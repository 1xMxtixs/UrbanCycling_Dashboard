"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Loader2,
  Sparkles,
  Bike,
  CalendarDays,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormDialog } from "@/components/forms/FormDialog"
import { FormCreateCliente } from "@/app/(routes)/clientes/components/FormCreateCliente/FormCreateCliente"


import { BikesSection, BikeInput } from "./BikesSection"
import { MAX_BICYCLE_IMAGES } from "@/lib/bicycle-images"
import { ESTADO_PAGO } from "@/lib/payment-status"
import { isRegistroActivo } from "@/lib/registro-status"
import { METODO_PAGO_DEFECTO } from "@/lib/payment-methods"
import { ESTADO_OT } from "@/lib/work-order-status"
import {
  OrderLinesSection,
  Product,
  SelectedProduct,
  SelectedService,
  Service,
} from "./OrderLinesSection"
import { PaymentInitialSection } from "./PaymentInitialSection"
import type { Client } from "@/app/(routes)/punto-ventas/types"

const focusOrderField = (id: string) => {
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

interface FormCreateOrderProps {
  setOpenModalCreate?: (open: boolean) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function FormCreateOrder({
  setOpenModalCreate,
  open,
  onOpenChange,
}: FormCreateOrderProps) {
  const router = useRouter()

  const [clients, setClients] = useState<Client[]>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [, setIsLoadingProducts] = useState(true)
  const [services, setServices] = useState<Service[]>([])

  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [fechaIngreso] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [fechaEntrega, setFechaEntrega] = useState<string>("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [descripcion, setDescripcion] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [conBicicleta, setConBicicleta] = useState(true)

  const [estadoPago, setEstadoPago] = useState<string>(ESTADO_PAGO.PENDIENTE)
  const [metodoPago, setMetodoPago] = useState<string>(METODO_PAGO_DEFECTO)
  const [montoAbono, setMontoAbono] = useState<number>(0)

  const [openQuickCreateClient, setOpenQuickCreateClient] = useState(false)

  const EMPTY_BIKE: BikeInput = {
    marca: "",
    modelo: "",
    color: "",
    descripcion: "",
    imagenUrl: "",
    imageFiles: [],
    imagePreviews: [],
    isUploading: false,
    isCollapsed: false,
  }

  const [bikes, setBikes] = useState<BikeInput[]>([{ ...EMPTY_BIKE }])

  const handleToggleBike = (checked: boolean) => {
    setConBicicleta(checked)
    if (checked && bikes.length === 0) {
      setBikes([{ ...EMPTY_BIKE }])
    }
  }

  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  )

  async function fetchClients(selectNewest = false) {
      try {
        const res = await fetch("/api/clientes")
        if (res.ok) {
          const data = (await res.json()) as Client[]
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
          const data = (await res.json()) as Client[]
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
          const data = (await res.json()) as Product[]
          setProducts(data.filter((p) => isRegistroActivo(p.estado)))
        }
      } catch (err) {
        console.error("Error fetching products:", err)
        toast.error("No se pudieron cargar los productos")
      } finally {
        setIsLoadingProducts(false)
      }
    }

    async function fetchServices() {
      try {
        const res = await fetch("/api/servicios?estado=activo")
        if (res.ok) {
          const data = (await res.json()) as Service[]
          setServices(data)
        }
      } catch (err) {
        console.error("Error fetching services:", err)
        toast.error("No se pudieron cargar los servicios")
      }
    }

    fetchClients()
    fetchProducts()
    fetchServices()
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
            imageFiles: [],
            imagePreviews: [],
            isUploading: false,
            isCollapsed: false,
          },
        ])
    )
  }

  const handleQuickClientSuccess = () => {
    setOpenQuickCreateClient(false)
    fetchClients(true) // Re-fetch y auto-selecciona el más nuevo
  }

  const handleRemoveBike = (index: number) => {
    if (conBicicleta && bikes.length <= 1) {
      toast.warning("Debe asociar al menos una bicicleta a la orden.")
      return
    }
    bikes[index].imagePreviews.forEach((preview) => URL.revokeObjectURL(preview))
    setBikes(bikes.filter((_, i) => i !== index))
  }

  const handleUpdateBikeField = (
    index: number,
    field: keyof BikeInput,
    value: BikeInput[keyof BikeInput]
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

  const handleAddBikeImage = (index: number, file: File, preview: string) => {
    if (bikes[index].imageFiles.length >= MAX_BICYCLE_IMAGES) {
      URL.revokeObjectURL(preview)
      toast.warning(
        `Solo se pueden asociar hasta ${MAX_BICYCLE_IMAGES} fotos por bicicleta.`
      )
      return
    }

    const updated = [...bikes]
    updated[index] = {
      ...updated[index],
      imageFiles: [...updated[index].imageFiles, file],
      imagePreviews: [...updated[index].imagePreviews, preview],
    }
    setBikes(updated)
  }

  const handleRemoveBikeImage = (bikeIndex: number, imageIndex: number) => {
    const updated = [...bikes]
    const bike = updated[bikeIndex]
    const preview = bike.imagePreviews[imageIndex]
    if (preview) URL.revokeObjectURL(preview)
    updated[bikeIndex] = {
      ...bike,
      imageFiles: bike.imageFiles.filter((_, i) => i !== imageIndex),
      imagePreviews: bike.imagePreviews.filter((_, i) => i !== imageIndex),
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

  const handleAddService = () => {
    setSelectedServices([
      ...selectedServices,
      { tipo: "catalogo", idServicio: "", cantidad: 1, precioUnitario: 0 },
    ])
  }

  const handleRemoveService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index))
  }

  const handleServiceChange = (index: number, idServicio: string) => {
    const matched = services.find((s) => s.idServicio.toString() === idServicio)
    const price = matched ? Number(matched.precioVenta) : 0

    const updated = [...selectedServices]
    updated[index] = {
      ...updated[index],
      tipo: "catalogo",
      idServicio,
      precioUnitario: price,
    }
    setSelectedServices(updated)
  }

  const handleServiceTypeChange = (index: number, tipo: SelectedService["tipo"]) => {
    setSelectedServices((current) => current.map((service, i) => i === index
      ? tipo === "personalizado"
        ? { tipo, nombre: "", cantidad: service.cantidad, precioUnitario: 0 }
        : { tipo, idServicio: "", cantidad: service.cantidad, precioUnitario: 0 }
      : service))
  }

  const handleCustomServiceChange = (index: number, field: "nombre" | "precioUnitario", value: string) => {
    setSelectedServices((current) => current.map((service, i) => {
      if (i !== index || service.tipo !== "personalizado") return service
      const cleanVal = field === "precioUnitario" ? value.replace(/\D/g, "") : value
      return field === "nombre"
        ? { ...service, nombre: cleanVal }
        : { ...service, precioUnitario: cleanVal === "" ? Number.NaN : Number(cleanVal) }
    }))
  }

  const handleServiceQuantityChange = (index: number, cantidad: number) => {
    const updated = [...selectedServices]
    updated[index] = {
      ...updated[index],
      cantidad: Math.max(1, cantidad),
    }
    setSelectedServices(updated)
  }

  const totalProductsCost = selectedProducts.reduce(
    (sum, p) => sum + p.cantidad * p.precioUnitario,
    0
  )
  const totalServicesCost = selectedServices.reduce(
    (sum, s) => sum + s.cantidad * s.precioUnitario,
    0
  )
  const grandTotal = totalProductsCost + totalServicesCost

  const resetForm = () => {
    setValidationError("")
    setSelectedClientId("")
    setFechaEntrega("")
    setIsCalendarOpen(false)
    setDescripcion("")
    setConBicicleta(true)
    setBikes([{ ...EMPTY_BIKE }])
    setSelectedServices([])
    setSelectedProducts([])
    setEstadoPago(ESTADO_PAGO.PENDIENTE)
    setMetodoPago(METODO_PAGO_DEFECTO)
    setMontoAbono(0)
  }

  const handleClose = () => {
    resetForm()
    setOpenModalCreate?.(false)
    onOpenChange?.(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm()
    }
    setOpenModalCreate?.(nextOpen)
    onOpenChange?.(nextOpen)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setValidationError("")

    if (!selectedClientId) {
      setValidationError("Debe seleccionar un cliente.")
      focusOrderField("cliente")
      return
    }

    if (!fechaEntrega) {
      setValidationError("Debe ingresar una fecha estimada de entrega.")
      focusOrderField("fechaEntrega")
      return
    }

    if (conBicicleta) {
      const incompleteBikeIdx = bikes.findIndex(
        (b) => !b.marca.trim() || !b.modelo.trim() || !b.color.trim()
      )
      if (incompleteBikeIdx !== -1) {
        const bike = bikes[incompleteBikeIdx]
        const field = !bike.marca.trim()
          ? { key: "marca", label: "La marca" }
          : !bike.modelo.trim()
            ? { key: "modelo", label: "El modelo" }
            : { key: "color", label: "El color" }
        const updated = [...bikes]
        updated[incompleteBikeIdx].isCollapsed = false
        setBikes(updated)
        setValidationError(
          `${field.label} es obligatorio en la bicicleta #${incompleteBikeIdx + 1}.`
        )
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            focusOrderField(`bike-${incompleteBikeIdx}-${field.key}`)
          )
        )
        return
      }
    }

    const incompleteProductIdx = selectedProducts.findIndex(
      (p) => !p.idProducto
    )
    if (incompleteProductIdx !== -1) {
      setValidationError(
        `Debe seleccionar un producto en la línea #${incompleteProductIdx + 1}.`
      )
      focusOrderField(`order-product-${incompleteProductIdx}`)
      return
    }

    const invalidProductIdx = selectedProducts.findIndex(
      (product) => !Number.isSafeInteger(product.cantidad) || product.cantidad <= 0
    )
    if (invalidProductIdx !== -1) {
      setValidationError(
        `La cantidad del producto en la línea #${invalidProductIdx + 1} debe ser un entero mayor que cero.`
      )
      focusOrderField(`order-product-quantity-${invalidProductIdx}`)
      return
    }

    const incompleteServiceIdx = selectedServices.findIndex(
      (s) =>
        (s.tipo === "catalogo" ? !s.idServicio : !s.nombre.trim() || s.nombre.trim().length > 100) ||
        !Number.isSafeInteger(s.cantidad) || s.cantidad <= 0 ||
        !Number.isSafeInteger(s.precioUnitario) || s.precioUnitario < 0 || s.precioUnitario > 999999999999 ||
        s.cantidad * s.precioUnitario > 999999999999
    )
    if (incompleteServiceIdx !== -1) {
      const service = selectedServices[incompleteServiceIdx]
      const field = service.tipo === "catalogo" && !service.idServicio
        ? { id: `order-service-catalog-${incompleteServiceIdx}`, label: "Debe seleccionar un servicio" }
        : service.tipo === "personalizado" && (!service.nombre.trim() || service.nombre.trim().length > 100)
          ? { id: `order-service-name-${incompleteServiceIdx}`, label: "Debe ingresar un nombre de servicio válido" }
          : !Number.isSafeInteger(service.cantidad) || service.cantidad <= 0
            ? { id: `order-service-quantity-${incompleteServiceIdx}`, label: "La cantidad del servicio debe ser un entero mayor que cero" }
            : { id: `order-service-price-${incompleteServiceIdx}`, label: "El precio del servicio debe ser válido" }
      setValidationError(
        `${field.label} en la línea #${incompleteServiceIdx + 1}.`
      )
      focusOrderField(field.id)
      return
    }

    if (
      estadoPago === ESTADO_PAGO.PARCIAL &&
      (montoAbono <= 0 || montoAbono >= grandTotal)
    ) {
      setValidationError(
        `El abono debe ser mayor a 0 y menor al total de la orden ($${grandTotal.toLocaleString("es-CL")}).`
      )
      focusOrderField("montoAbono")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Upload any pending bike images (solo si hay bicicleta asociada)
      const bikesData = conBicicleta
        ? await Promise.all(
            bikes.map(async (b, idx) => {
              const imagenes: string[] = []
              for (const [imageIdx, file] of b.imageFiles.entries()) {
                const formData = new FormData()
                formData.append("file", file)
                const res = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                })
                if (!res.ok) {
                  throw new Error(
                    `Error al subir la foto ${imageIdx + 1} de la bicicleta #${idx + 1}`
                  )
                }
                const data = (await res.json()) as { url?: string }
                if (!data.url) {
                  throw new Error(
                    `El servidor no devolvió una URL para la foto ${imageIdx + 1} de la bicicleta #${idx + 1}`
                  )
                }
                imagenes.push(data.url)
              }
              return {
                marca: b.marca.trim(),
                modelo: b.modelo.trim(),
                color: b.color.trim(),
                descripcion: b.descripcion.trim() || null,
                imagenUrl: b.imagenUrl || null,
                imagenes,
              }
            })
          )
        : []

      const response = await fetch("/api/punto-venta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_cliente: Number(selectedClientId),
          estado_pago: estadoPago,
          metodo_pago: estadoPago === ESTADO_PAGO.PENDIENTE ? null : metodoPago,
          monto_pagado:
            estadoPago === ESTADO_PAGO.PAGADA
              ? grandTotal
              : estadoPago === ESTADO_PAGO.PARCIAL
                ? montoAbono
                : 0,
          descuento: 0,
          ordenTrabajo: {
            fechaEntregaEstimada: new Date(fechaEntrega).toISOString(),
            observacionesIngreso: descripcion.trim() || null,
            estadoOrden: ESTADO_OT.POR_REALIZAR,
            servicios: selectedServices.map((s) => ({
              ...(s.tipo === "catalogo"
                ? { tipo: s.tipo, idServicio: Number(s.idServicio) }
                : { tipo: s.tipo, nombre: s.nombre.trim() }),
              cantidad: s.cantidad,
              precioUnitario: s.precioUnitario,
            })),
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
      handleClose()
    } catch (err: unknown) {
      console.error(err)
      toast.error(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la orden de trabajo"
      )
    } finally {
      setIsSubmitting(false)
    }
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
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="form-create-order"
          disabled={isSubmitting || (conBicicleta && bikes.some((b) => b.isUploading))}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              Guardando orden...
            </span>
          ) : (
            "Crear Orden de Trabajo"
          )}
        </Button>
      </div>
    </div>
  )

  const contentBody = (
    <form
      id="form-create-order"
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* ── Información General ─────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-border p-4">
        <h3 className="text-foreground flex items-center gap-2 border-b border-border pb-2 text-sm font-bold">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          Información General
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Cliente Select */}
          <div>
            <Label
              htmlFor="cliente"
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Cliente
            </Label>
            {isLoadingClients ? (
              <div className="flex h-10 items-center justify-center rounded-lg border border-input px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
                Cargando clientes...
              </div>
            ) : (
              <>
                <Select
                  value={selectedClientId || undefined}
                  onValueChange={setSelectedClientId}
                >
                  <SelectTrigger id="cliente" className="h-10 w-full bg-background border-input text-sm">
                    <SelectValue placeholder="-- Selecciona un Cliente --" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {clients.map((c) => {
                      const nombreCliente = c.razonSocial
                        || `${c.primerNombre} ${c.apellidoPaterno || ""}`.trim()
                      const label = c.rut
                        ? `${nombreCliente} (${c.rut})`
                        : nombreCliente
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
          <div>
            <Label
              htmlFor="fechaIngreso"
              className="inline-block mb-1.5 font-medium text-foreground"
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
          <div>
            <Label
              htmlFor="fechaEntrega"
              required
              className="inline-block mb-1.5 font-medium text-foreground"
            >
              Fecha Estimada de Entrega
            </Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="fechaEntrega"
                  type="button"
                  variant="outline"
                  aria-label="Elegir fecha estimada de entrega"
                  aria-required="true"
                  aria-haspopup="dialog"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  {fechaEntrega
                    ? new Date(`${fechaEntrega}T00:00:00`).toLocaleDateString(
                        "es-CL",
                        { dateStyle: "long" }
                      )
                    : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={
                    fechaEntrega
                      ? new Date(`${fechaEntrega}T00:00:00`)
                      : undefined
                  }
                  onSelect={(date) => {
                    if (!date) return
                    setFechaEntrega(format(date, "yyyy-MM-dd"))
                    setIsCalendarOpen(false)
                  }}
                  disabled={{ before: new Date(`${fechaIngreso}T00:00:00`) }}
                  locale={es}
                  className="rounded-lg border"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Descripción del Trabajo */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <Label
                htmlFor="descripcion"
                className="inline-block font-medium text-foreground"
              >
                Descripción del Trabajo a Realizar{" "}
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <span className="text-xs text-muted-foreground">
                {descripcion.length}/500
              </span>
            </div>
            <Textarea
              id="descripcion"
              placeholder="Ej: Mantención general de transmisión, centrado de llantas..."
              value={descripcion}
              maxLength={500}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── Toggle Bicicleta ─────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Bike className="h-4.5 w-4.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Asociar bicicleta{" "}
              <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {conBicicleta
                ? "La orden incluye una o más bicicletas"
                : "Venta de servicio rápido sin bicicleta registrada"}
            </p>
          </div>
        </div>
        <Switch
          id="toggle-bicicleta"
          checked={conBicicleta}
          onCheckedChange={handleToggleBike}
          disabled={isSubmitting}
          aria-label="Asociar bicicleta a la orden"
        />
      </div>

      {conBicicleta && (
        <BikesSection
          bikes={bikes}
          isSubmitting={isSubmitting}
          onAddBike={handleAddBike}
          onRemoveBike={handleRemoveBike}
          onUpdateBikeField={handleUpdateBikeField}
          onToggleCollapse={toggleCollapse}
          onAddBikeImage={handleAddBikeImage}
          onRemoveBikeImage={handleRemoveBikeImage}
        />
      )}

      <OrderLinesSection
        products={products}
        services={services}
        selectedProducts={selectedProducts}
        selectedServices={selectedServices}
        onAddService={handleAddService}
        onRemoveService={handleRemoveService}
        onServiceChange={handleServiceChange}
        onServiceQuantityChange={handleServiceQuantityChange}
        onServiceTypeChange={handleServiceTypeChange}
        onCustomServiceChange={handleCustomServiceChange}
        onAddProduct={handleAddProduct}
        onRemoveProduct={handleRemoveProduct}
        onProductChange={handleProductChange}
        onProductQuantityChange={handleProductQuantityChange}
      />

      <PaymentInitialSection
        estadoPago={estadoPago}
        metodoPago={metodoPago}
        montoAbono={montoAbono}
        totalProductsCost={totalProductsCost}
        totalServicesCost={totalServicesCost}
        grandTotal={grandTotal}
        onEstadoPagoChange={setEstadoPago}
        onMetodoPagoChange={setMetodoPago}
        onMontoAbonoChange={setMontoAbono}
      />
    </form>
  )

  if (open !== undefined || onOpenChange !== undefined) {
    return (
      <>
        <FormDialog
          open={open}
          onOpenChange={handleOpenChange}
          title="Ingreso de Orden de Trabajo"
          description="Completa los datos del cliente, selecciona los vehículos y define los servicios y repuestos requeridos."
          size="3xl"
          footer={footerContent}
        >
          {contentBody}
        </FormDialog>

        {/* Diálogo de Registro Rápido de Cliente */}
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

      {/* Diálogo de Registro Rápido de Cliente */}
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
