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
  DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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

  const [bikes, setBikes] = useState<BikeInput[]>([
    {
      marca: "",
      modelo: "",
      color: "",
      descripcion: "",
      imagenUrl: "",
      isUploading: false,
      isCollapsed: false,
    },
  ])

  const [montoServicio, setMontoServicio] = useState<number>(0)
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])

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
      bikes.map((b) => ({ ...b, isCollapsed: true })).concat([
        {
          marca: "",
          modelo: "",
          color: "",
          descripcion: "",
          imagenUrl: "",
          isUploading: false,
          isCollapsed: false,
        },
      ])
    )
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

  const handleBikeImageChange = async (
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

    handleUpdateBikeField(index, "isUploading", true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Error al subir imagen")
      }

      const data = await res.json()
      handleUpdateBikeField(index, "imagenUrl", data.url)
      toast.success("Imagen subida correctamente")
    } catch (err) {
      console.error(err)
      toast.error("Error al subir la imagen")
    } finally {
      handleUpdateBikeField(index, "isUploading", false)
    }
  }

  const handleRemoveBikeImage = (index: number) => {
    handleUpdateBikeField(index, "imagenUrl", "")
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

    const incompleteProductIdx = selectedProducts.findIndex((p) => !p.idProducto)
    if (incompleteProductIdx !== -1) {
      toast.error(`Debe seleccionar un producto en la línea #${incompleteProductIdx + 1}.`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/punto-venta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_usuario: 1, 
          id_cliente: Number(selectedClientId),
          estado_pago: "pendiente",
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
            bicicletas: bikes.map((b) => ({
              marca: b.marca.trim(),
              modelo: b.modelo.trim(),
              color: b.color.trim(),
              descripcion: b.descripcion.trim() || null,
              imagenUrl: b.imagenUrl || null,
            })),
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
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
      {/* ── Información General ─────────────────────────────────── */}
      <div className="space-y-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-850 dark:text-slate-200">
          <Sparkles className="h-4 w-4 text-primary" />
          Información General
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Cliente Select */}
          <div className="space-y-1.5">
            <Label htmlFor="cliente" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Cliente <span className="text-red-500">*</span>
            </Label>
            {isLoadingClients ? (
              <div className="flex h-10 items-center justify-center rounded-lg border border-input px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando clientes...
              </div>
            ) : (
              <select
                id="cliente"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">-- Selecciona un Cliente --</option>
                {clients.map((c) => {
                  const label = c.razonSocial
                    ? `${c.razonSocial} (${c.rut})`
                    : `${c.primerNombre} ${c.apellidoPaterno || ""} (${c.rut})`.trim()
                  return (
                    <option key={c.idCliente} value={c.idCliente}>
                      {label}
                    </option>
                  )
                })}
              </select>
            )}
          </div>

          {/* Fecha Ingreso (disabled) */}
          <div className="space-y-1.5">
            <Label htmlFor="fechaIngreso" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Fecha de Ingreso
            </Label>
            <Input
              id="fechaIngreso"
              type="date"
              value={fechaIngreso}
              disabled
              className="bg-slate-100/50 dark:bg-slate-800/50 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Fecha Estimada Entrega */}
          <div className="space-y-1.5">
            <Label htmlFor="fechaEntrega" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
              Fecha Estimada de Entrega <span className="text-red-500">*</span>
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
            <Label htmlFor="descripcion" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
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
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-4.5 w-4.5 text-primary" />
            <h3 className="font-bold text-slate-850 dark:text-slate-200">
              Bicicletas Asociadas
            </h3>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-muted-foreground">
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
            const title = bike.marca || bike.modelo
              ? `${bike.marca} ${bike.modelo}`.trim()
              : `Bicicleta #${idx + 1}`

            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
              >
                {/* Header Acordeón */}
                <div
                  onClick={() => toggleCollapse(idx)}
                  className="flex cursor-pointer items-center justify-between bg-slate-50 dark:bg-slate-950 px-4 py-3 hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-350">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                      {title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => handleRemoveBike(idx)}
                      disabled={bikes.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <button
                      type="button"
                      onClick={() => toggleCollapse(idx)}
                      className="text-slate-400 hover:text-slate-655 p-0.5 rounded cursor-pointer animate-in transition-all"
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
                  <div className="p-4 border-t border-slate-100 dark:border-slate-850 space-y-4 animate-in fade-in duration-200">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {/* Marca */}
                      <div className="space-y-1">
                        <Label htmlFor={`bike-marca-${idx}`} className="text-xs font-semibold text-slate-500">
                          Marca <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`bike-marca-${idx}`}
                          placeholder="Ej: Trek, Giant"
                          value={bike.marca}
                          onChange={(e) =>
                            handleUpdateBikeField(idx, "marca", e.target.value)
                          }
                          required
                        />
                      </div>

                      {/* Modelo */}
                      <div className="space-y-1">
                        <Label htmlFor={`bike-modelo-${idx}`} className="text-xs font-semibold text-slate-500">
                          Modelo <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`bike-modelo-${idx}`}
                          placeholder="Ej: Marlin 7, Talon"
                          value={bike.modelo}
                          onChange={(e) =>
                            handleUpdateBikeField(idx, "modelo", e.target.value)
                          }
                          required
                        />
                      </div>

                      {/* Color */}
                      <div className="space-y-1">
                        <Label htmlFor={`bike-color-${idx}`} className="text-xs font-semibold text-slate-500">
                          Color <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`bike-color-${idx}`}
                          placeholder="Ej: Negro, Azul"
                          value={bike.color}
                          onChange={(e) =>
                            handleUpdateBikeField(idx, "color", e.target.value)
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* Descripción de la Bicicleta */}
                    <div className="space-y-1">
                      <Label htmlFor={`bike-desc-${idx}`} className="text-xs font-semibold text-slate-500">
                        Estado / Observaciones de la Bicicleta
                      </Label>
                      <Textarea
                        id={`bike-desc-${idx}`}
                        placeholder="Observaciones de abolladuras o ruidos específicos..."
                        value={bike.descripcion}
                        onChange={(e) =>
                          handleUpdateBikeField(idx, "descripcion", e.target.value)
                        }
                        rows={2}
                      />
                    </div>

                    {/* Subida de Imagen por Bicicleta */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500">
                        Foto de la Bicicleta (Opcional)
                      </Label>

                      {bike.imagenUrl ? (
                        <div className="group relative h-40 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={bike.imagenUrl}
                            alt={`Bicicleta #${idx + 1}`}
                            className="h-full w-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveBikeImage(idx)}
                            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition-opacity opacity-80 hover:opacity-100 cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <label
                            htmlFor={`bike-file-${idx}`}
                            className="flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-950/20 dark:hover:bg-slate-900/30 transition-all text-slate-500"
                          >
                            {bike.isUploading ? (
                              <>
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="text-xs font-medium">Subiendo foto...</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-6 w-6 text-slate-400" />
                                <span className="text-xs font-semibold">Seleccionar foto</span>
                                <span className="text-[10px] text-slate-400">JPG, PNG — Máx. 5MB</span>
                              </>
                            )}
                          </label>
                          <input
                            id={`bike-file-${idx}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleBikeImageChange(idx, e)}
                            className="hidden"
                            disabled={bike.isUploading}
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
      <div className="space-y-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-850 dark:text-slate-200 border-b border-slate-200/50 dark:border-slate-800 pb-2">
          <ShoppingBag className="h-4.5 w-4.5 text-primary" />
          Servicio y Productos (Repuestos)
        </h3>

        {/* Monto de Servicio Input */}
        <div className="space-y-1.5 max-w-xs">
          <Label htmlFor="montoServicio" className="text-xs font-semibold text-slate-650 dark:text-slate-400 flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-slate-400" />
            Monto de Servicio (Mano de Obra)
          </Label>
          <Input
            id="montoServicio"
            type="number"
            min={0}
            placeholder="0"
            value={montoServicio || ""}
            onChange={(e) => setMontoServicio(Math.max(0, Number(e.target.value)))}
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
                  className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs animate-in slide-in-from-top-1 duration-150"
                >
                  {/* Select Product */}
                  <div className="flex-1 min-w-50">
                    <select
                      value={selProd.idProducto}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    >
                      <option value="">-- Selecciona un Producto --</option>
                      {products.map((p) => (
                        <option key={p.idProducto} value={p.idProducto}>
                          {p.nombre} (${Number(p.precioVenta).toLocaleString("es-CL")})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Input */}
                  <div className="w-20">
                    <Input
                      type="number"
                      min={1}
                      value={selProd.cantidad}
                      onChange={(e) =>
                        handleProductQuantityChange(idx, Number(e.target.value))
                      }
                      className="h-9 text-xs"
                      placeholder="Cant."
                    />
                  </div>

                  {/* Unit Price Display */}
                  <div className="text-xs text-slate-500 font-semibold w-24">
                    Uni: ${selProd.precioUnitario.toLocaleString("es-CL")}
                  </div>

                  {/* Subtotal Price Display */}
                  <div className="text-xs text-slate-800 dark:text-slate-200 font-bold w-28">
                    Sub: ${(selProd.cantidad * selProd.precioUnitario).toLocaleString("es-CL")}
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
            className="flex items-center gap-1 text-xs px-2.5 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            + Agregar repuesto/producto
          </Button>
        </div>
        {/* Summary calculations displays */}
        <div className="grid gap-4 border-t border-slate-200/50 dark:border-slate-800 pt-4 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Total Repuestos
            </Label>
            <Input
              type="text"
              readOnly
              disabled
              value={`$${totalProductsCost.toLocaleString("es-CL")}`}
              className="bg-slate-100/50 dark:bg-slate-800/50 font-semibold cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Monto Servicio (Mano de Obra)
            </Label>
            <Input
              type="text"
              readOnly
              disabled
              value={`$${montoServicio.toLocaleString("es-CL")}`}
              className="bg-slate-100/50 dark:bg-slate-800/50 font-semibold cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-primary tracking-wider">
              Monto Total (Total General)
            </Label>
            <Input
              type="text"
              readOnly
              disabled
              value={`$${grandTotal.toLocaleString("es-CL")}`}
              className="border-primary/30 bg-primary/5 dark:bg-primary/10 font-black text-primary cursor-not-allowed"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
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
  )
}
