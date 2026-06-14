"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/sonner"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  X,
  Loader2,
  Sparkles,
  Wrench,
  ShoppingBag,
  DollarSign,
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
  estado: string
}

interface SelectedProduct {
  idProducto: string
  cantidad: number
  precioUnitario: number
}

interface BikeInput {
  marca: string
  modelo: string
  color: string
  descripcion: string
  imagenUrl: string
  imageFile?: File | null
  imagePreview?: string | null
  isUploading: boolean
  isCollapsed: boolean
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
        className="max-h-[70vh] space-y-6 overflow-y-auto px-1"
      >
        {/* ── Información General ─────────────────────────────────── */}
        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
          <h3 className="text-slate-850 flex items-center gap-2 text-sm font-bold dark:text-slate-200">
            <Sparkles className="h-4 w-4 text-primary" />
            Información General
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Cliente Select */}
            <div className="space-y-1.5">
              <Label
                htmlFor="cliente"
                className="text-slate-650 text-xs font-semibold dark:text-slate-400"
              >
                Cliente <span className="text-red-500">*</span>
              </Label>
              {isLoadingClients ? (
                <div className="flex h-10 items-center justify-center rounded-lg border border-input px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando clientes...
                </div>
              ) : (
                <>
                  <Select
                    value={selectedClientId || undefined}
                    onValueChange={setSelectedClientId}
                  >
                    <SelectTrigger className="h-10 w-full border border-slate-200 bg-background text-sm">
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
                      <button
                        type="button"
                        onClick={() => setOpenQuickCreateClient(true)}
                        className="cursor-pointer font-bold text-primary hover:underline"
                      >
                        + Registrar aquí
                      </button>
                      <span className="text-slate-300">|</span>
                      <a
                        href="/clientes"
                        target="_blank"
                        className="font-bold text-muted-foreground hover:text-slate-700 hover:underline"
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
                className="text-slate-650 text-xs font-semibold dark:text-slate-400"
              >
                Fecha de Ingreso
              </Label>
              <Input
                id="fechaIngreso"
                type="date"
                value={fechaIngreso}
                disabled
                className="cursor-not-allowed bg-slate-100/50 dark:bg-slate-800/50"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Fecha Estimada Entrega */}
            <div className="space-y-1.5">
              <Label
                htmlFor="fechaEntrega"
                className="text-slate-650 text-xs font-semibold dark:text-slate-400"
              >
                Fecha Estimada de Entrega{" "}
                <span className="text-red-500">*</span>
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
                className="text-slate-650 text-xs font-semibold dark:text-slate-400"
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

        {/* ── Sección de Bicicletas (Accordion) ──────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Wrench className="h-4.5 w-4.5 text-primary" />
              <h3 className="text-slate-850 font-bold dark:text-slate-200">
                Bicicletas Asociadas
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted-foreground dark:bg-slate-800">
                {bikes.length}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBike}
              className="flex items-center gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir otra
            </Button>
          </div>

          <div className="space-y-3">
            {bikes.map((bike, idx) => {
              const isCollapsed = bike.isCollapsed
              const title =
                bike.marca || bike.modelo
                  ? `${bike.marca} ${bike.modelo}`.trim()
                  : `Bicicleta #${idx + 1}`

              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Header Acordeón */}
                  <div
                    onClick={() => toggleCollapse(idx)}
                    className="flex cursor-pointer items-center justify-between bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100/50 dark:bg-slate-950 dark:hover:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="dark:text-slate-350 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-700 dark:bg-slate-800">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {title}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20"
                        onClick={() => handleRemoveBike(idx)}
                        disabled={bikes.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <button
                        type="button"
                        onClick={() => toggleCollapse(idx)}
                        className="hover:text-slate-655 animate-in cursor-pointer rounded p-0.5 text-slate-400 transition-all"
                      >
                        {isCollapsed ? (
                          <ChevronDown className="h-4.5 w-4.5" />
                        ) : (
                          <ChevronUp className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Contenido Colapsable */}
                  {!isCollapsed && (
                    <div className="dark:border-slate-850 animate-in space-y-4 border-t border-slate-100 p-4 duration-200 fade-in">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {/* Marca */}
                        <div className="space-y-1">
                          <Label
                            htmlFor={`bike-marca-${idx}`}
                            className="text-xs font-semibold text-slate-500"
                          >
                            Marca <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`bike-marca-${idx}`}
                            placeholder="Ej: Trek, Giant"
                            value={bike.marca}
                            onChange={(e) =>
                              handleUpdateBikeField(
                                idx,
                                "marca",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        {/* Modelo */}
                        <div className="space-y-1">
                          <Label
                            htmlFor={`bike-modelo-${idx}`}
                            className="text-xs font-semibold text-slate-500"
                          >
                            Modelo <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`bike-modelo-${idx}`}
                            placeholder="Ej: Marlin 7, Talon"
                            value={bike.modelo}
                            onChange={(e) =>
                              handleUpdateBikeField(
                                idx,
                                "modelo",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        {/* Color */}
                        <div className="space-y-1">
                          <Label
                            htmlFor={`bike-color-${idx}`}
                            className="text-xs font-semibold text-slate-500"
                          >
                            Color <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`bike-color-${idx}`}
                            placeholder="Ej: Negro, Azul"
                            value={bike.color}
                            onChange={(e) =>
                              handleUpdateBikeField(
                                idx,
                                "color",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>
                      </div>

                      {/* Descripción de la Bicicleta */}
                      <div className="space-y-1">
                        <Label
                          htmlFor={`bike-desc-${idx}`}
                          className="text-xs font-semibold text-slate-500"
                        >
                          Estado / Observaciones de la Bicicleta
                        </Label>
                        <Textarea
                          id={`bike-desc-${idx}`}
                          placeholder="Observaciones de abolladuras o ruidos específicos..."
                          value={bike.descripcion}
                          onChange={(e) =>
                            handleUpdateBikeField(
                              idx,
                              "descripcion",
                              e.target.value
                            )
                          }
                          rows={2}
                        />
                      </div>

                      {/* Subida de Imagen por Bicicleta */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-500">
                          Foto de la Bicicleta (Opcional)
                        </Label>

                        {bike.imagePreview || bike.imagenUrl ? (
                          <div className="group relative h-40 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={bike.imagePreview || bike.imagenUrl}
                              alt={`Bicicleta #${idx + 1}`}
                              className="h-full w-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveBikeImage(idx)}
                              className="absolute top-2 right-2 cursor-pointer rounded-full bg-black/60 p-1.5 text-white opacity-80 transition-opacity hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <label
                              htmlFor={`bike-file-${idx}`}
                              className="flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 transition-all hover:bg-slate-100/50 dark:border-slate-700 dark:bg-slate-950/20 dark:hover:bg-slate-900/30"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                  <span className="text-xs font-medium">
                                    Subiendo foto...
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="h-6 w-6 text-slate-400" />
                                  <span className="text-xs font-semibold">
                                    Seleccionar foto
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    JPG, PNG — Máx. 5MB
                                  </span>
                                </>
                              )}
                            </label>
                            <input
                              id={`bike-file-${idx}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleBikeImageChange(idx, e)}
                              className="hidden"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Sección de Servicio y Repuestos ────────────────────── */}
        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
          <h3 className="text-slate-850 flex items-center gap-2 border-b border-slate-200/50 pb-2 text-sm font-bold dark:border-slate-800 dark:text-slate-200">
            <ShoppingBag className="h-4.5 w-4.5 text-primary" />
            Servicio y Productos (Repuestos)
          </h3>

          {/* Monto de Servicio Input */}
          <div className="max-w-xs space-y-1.5">
            <Label
              htmlFor="montoServicio"
              className="text-slate-650 flex items-center gap-1 text-xs font-semibold dark:text-slate-400"
            >
              <DollarSign className="h-3 w-3 text-slate-400" />
              Monto de Servicio (Mano de Obra)
            </Label>
            <Input
              id="montoServicio"
              type="number"
              min={0}
              placeholder="0"
              value={montoServicio || ""}
              onChange={(e) =>
                setMontoServicio(Math.max(0, Number(e.target.value)))
              }
            />
          </div>

          {/* Dynamic Products Input */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-400">
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
                    className="flex animate-in flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs duration-150 slide-in-from-top-1 dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Select Product */}
                    <div className="min-w-50 flex-1">
                      <Select
                        value={selProd.idProducto || undefined}
                        onValueChange={(val) => handleProductChange(idx, val)}
                      >
                        <SelectTrigger className="h-9 w-full border border-slate-200 bg-background text-xs">
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
                          handleProductQuantityChange(
                            idx,
                            Number(e.target.value)
                          )
                        }
                        className="h-9 text-xs"
                        placeholder="Cant."
                      />
                    </div>

                    {/* Unit Price Display */}
                    <div className="w-24 text-xs font-semibold text-slate-500">
                      Uni: ${selProd.precioUnitario.toLocaleString("es-CL")}
                    </div>

                    {/* Subtotal Price Display */}
                    <div className="w-28 text-xs font-bold text-slate-800 dark:text-slate-200">
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
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveProduct(idx)}
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
              onClick={handleAddProduct}
              className="flex h-8 items-center gap-1 px-2.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />+ Agregar repuesto/producto
            </Button>
          </div>
          {/* Summary calculations displays */}
          <div className="flex justify-end border-t border-slate-200/50 pt-4 dark:border-slate-800">
            <div className="grid w-full grid-cols-1 gap-4 sm:max-w-xl sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Total Repuesto
                </Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  value={`$${totalProductsCost.toLocaleString("es-CL")}`}
                  className="cursor-not-allowed bg-slate-100/50 text-right font-semibold dark:bg-slate-800/50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                  Monto Servicio
                </Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  value={`$${montoServicio.toLocaleString("es-CL")}`}
                  className="cursor-not-allowed bg-slate-100/50 text-right font-semibold dark:bg-slate-800/50"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold tracking-wider text-primary uppercase">
                  Monto Total
                </Label>
                <Input
                  type="text"
                  readOnly
                  disabled
                  value={`$${grandTotal.toLocaleString("es-CL")}`}
                  className="cursor-not-allowed border-primary/30 bg-primary/5 text-right font-black text-primary dark:bg-primary/10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Sección de Información de Pago ────────────────────── */}
        <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
          <h3 className="text-slate-850 flex items-center gap-2 border-b border-slate-200/50 pb-2 text-sm font-bold dark:border-slate-800 dark:text-slate-200">
            <DollarSign className="h-4.5 w-4.5 text-primary" />
            Información del Pago Inicial
          </h3>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Tipo de Pago / Estado Pago */}
            <div className="space-y-1.5">
              <Label
                htmlFor="estadoPago"
                className="text-slate-650 text-xs font-semibold dark:text-slate-400"
              >
                Tipo de Pago Inicial
              </Label>
              <Select value={estadoPago} onValueChange={setEstadoPago}>
                <SelectTrigger className="h-10 w-full border border-slate-200 bg-background text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="pendiente">
                    Pendiente (Sin Pago Inicial)
                  </SelectItem>
                  <SelectItem value="abono">Abono (Pago Parcial)</SelectItem>
                  <SelectItem value="pagada">
                    Pago Total (${grandTotal.toLocaleString("es-CL")})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Método de Pago */}
            {estadoPago !== "pendiente" && (
              <div className="animate-in space-y-1.5 duration-200 fade-in">
                <Label
                  htmlFor="metodoPago"
                  className="text-slate-650 text-xs font-semibold dark:text-slate-400"
                >
                  Método de Pago
                </Label>
                <Select value={metodoPago} onValueChange={setMetodoPago}>
                  <SelectTrigger className="h-10 w-full border border-slate-200 bg-background text-sm">
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
            )}

            {/* Monto del Abono */}
            {estadoPago === "abono" && (
              <div className="animate-in space-y-1.5 duration-200 fade-in">
                <Label
                  htmlFor="montoAbono"
                  className="text-slate-650 text-xs font-semibold dark:text-slate-400"
                >
                  Monto del Abono
                </Label>
                <Input
                  id="montoAbono"
                  type="number"
                  min={1}
                  max={grandTotal - 1}
                  value={montoAbono || ""}
                  onChange={(e) =>
                    setMontoAbono(Math.max(0, Number(e.target.value)))
                  }
                  placeholder="Monto en CLP"
                  required
                />
              </div>
            )}
          </div>
        </div>

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
