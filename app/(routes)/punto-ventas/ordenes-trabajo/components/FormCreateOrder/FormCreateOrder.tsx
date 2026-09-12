"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Sparkles } from "lucide-react"

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

import {
  BikesSection,
  BikeInput,
} from "./BikesSection"

import {
  OrderLinesSection,
  Product,
  SelectedProduct,
} from "./OrderLinesSection"

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

export function FormCreateOrder({
  setOpenModalCreate,
}: FormCreateOrderProps) {
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

  const [estadoPago, setEstadoPago] =
    useState<string>("pendiente")

  const [metodoPago, setMetodoPago] =
    useState<string>("efectivo")

  const [montoAbono, setMontoAbono] =
    useState<number>(0)

  const [openQuickCreateClient, setOpenQuickCreateClient] =
    useState(false)

  const createEmptyBike = (): BikeInput => ({
    marca: "",
    modelo: "",
    color: "",
    descripcion: "",
    imagenUrl: "",
    imageFiles: [],
    imagePreviews: [],
    isUploading: false,
    isCollapsed: false,
  })

  const [bikes, setBikes] = useState<BikeInput[]>([
    createEmptyBike(),
  ])

  const [montoServicio, setMontoServicio] =
    useState<number>(0)

  const [selectedProducts, setSelectedProducts] =
    useState<SelectedProduct[]>([])

  async function fetchClients(selectNewest = false) {
    try {
      const res = await fetch("/api/clientes")

      if (res.ok) {
        const data = await res.json()

        setClients(data)

        if (selectNewest && data.length > 0) {
          const newest = data.reduce(
            (prev: Client, current: Client) =>
              prev.idCliente > current.idCliente
                ? prev
                : current
          )

          setSelectedClientId(
            newest.idCliente.toString()
          )
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
    async function loadClients() {
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

          setProducts(
            data.filter(
              (p: any) => p.estado === "activo"
            )
          )
        }
      } catch (err) {
        console.error("Error fetching products:", err)
        toast.error("No se pudieron cargar los productos")
      } finally {
        setIsLoadingProducts(false)
      }
    }

    loadClients()
    fetchProducts()
  }, [])

  const handleAddBike = () => {
    setBikes(
      bikes
        .map((bike) => ({
          ...bike,
          isCollapsed: true,
        }))
        .concat([createEmptyBike()])
    )
  }

  const handleQuickClientSuccess = () => {
    setOpenQuickCreateClient(false)

    toast.success("Cliente creado correctamente.")

    fetchClients(true)
  }

  const handleRemoveBike = (index: number) => {
    if (bikes.length <= 1) {
      toast.warning(
        "Debe asociar al menos una bicicleta a la orden."
      )
      return
    }

    // Liberar URLs de preview de la bicicleta eliminada
    bikes[index].imagePreviews.forEach((preview) => {
      URL.revokeObjectURL(preview)
    })

    setBikes(
      bikes.filter((_, i) => i !== index)
    )
  }

  const handleUpdateBikeField = (
    index: number,
    field: keyof BikeInput,
    value: any
  ) => {
    const updated = [...bikes]

    updated[index] = {
      ...updated[index],
      [field]: value,
    }

    setBikes(updated)
  }

  const toggleCollapse = (index: number) => {
    const updated = [...bikes]

    updated[index].isCollapsed =
      !updated[index].isCollapsed

    setBikes(updated)
  }

  /**
   * Agrega múltiples imágenes a una bicicleta.
   */
  const handleBikeImagesChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]

    const validFiles: File[] = []

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `"${file.name}" no es un formato permitido. Usa JPG, PNG, WEBP o GIF.`
        )
        continue
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          `"${file.name}" supera el tamaño máximo de 5 MB.`
        )
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length === 0) {
      e.target.value = ""
      return
    }

    const previews = validFiles.map((file) =>
      URL.createObjectURL(file)
    )

    const updated = [...bikes]

    updated[index] = {
      ...updated[index],
      imageFiles: [
        ...updated[index].imageFiles,
        ...validFiles,
      ],
      imagePreviews: [
        ...updated[index].imagePreviews,
        ...previews,
      ],
    }

    setBikes(updated)

    // Permite volver a seleccionar los mismos archivos
    e.target.value = ""
  }

  /**
   * Elimina una imagen específica de una bicicleta.
   */
  const handleRemoveBikeImage = (
    bikeIndex: number,
    imageIndex: number
  ) => {
    const updated = [...bikes]

    const bike = updated[bikeIndex]
    const preview = bike.imagePreviews[imageIndex]

    if (preview) {
      URL.revokeObjectURL(preview)
    }

    updated[bikeIndex] = {
      ...bike,
      imageFiles: bike.imageFiles.filter(
        (_, index) => index !== imageIndex
      ),
      imagePreviews: bike.imagePreviews.filter(
        (_, index) => index !== imageIndex
      ),
    }

    setBikes(updated)
  }

  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      {
        idProducto: "",
        cantidad: 1,
        precioUnitario: 0,
      },
    ])
  }

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(
      selectedProducts.filter((_, i) => i !== index)
    )
  }

  const handleProductChange = (
    index: number,
    idProducto: string
  ) => {
    const matched = products.find(
      (p) => p.idProducto.toString() === idProducto
    )

    const price = matched
      ? Number(matched.precioVenta)
      : 0

    const updated = [...selectedProducts]

    updated[index] = {
      ...updated[index],
      idProducto,
      precioUnitario: price,
    }

    setSelectedProducts(updated)
  }

  const handleProductQuantityChange = (
    index: number,
    cantidad: number
  ) => {
    const updated = [...selectedProducts]

    updated[index] = {
      ...updated[index],
      cantidad: Math.max(1, cantidad),
    }

    setSelectedProducts(updated)
  }

  const totalProductsCost =
    selectedProducts.reduce(
      (sum, p) =>
        sum +
        p.cantidad *
          p.precioUnitario,
      0
    )

  const grandTotal =
    totalProductsCost + montoServicio

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!selectedClientId) {
      toast.error(
        "Debe seleccionar un cliente."
      )
      return
    }

    if (!fechaEntrega) {
      toast.error(
        "Debe ingresar una fecha estimada de entrega."
      )
      return
    }

    const incompleteBikeIdx =
      bikes.findIndex(
        (bike) =>
          !bike.marca.trim() ||
          !bike.modelo.trim() ||
          !bike.color.trim()
      )

    if (incompleteBikeIdx !== -1) {
      toast.error(
        `La bicicleta #${
          incompleteBikeIdx + 1
        } está incompleta. Debe indicar Marca, Modelo y Color.`
      )

      const updated = [...bikes]

      updated[incompleteBikeIdx].isCollapsed =
        false

      setBikes(updated)

      return
    }

    const incompleteProductIdx =
      selectedProducts.findIndex(
        (p) => !p.idProducto
      )

    if (incompleteProductIdx !== -1) {
      toast.error(
        `Debe seleccionar un producto en la línea #${
          incompleteProductIdx + 1
        }.`
      )
      return
    }

    if (
      estadoPago === "abono" &&
      (montoAbono <= 0 ||
        montoAbono >= grandTotal)
    ) {
      toast.error(
        `El abono debe ser mayor a 0 y menor al total de la orden ($${grandTotal.toLocaleString(
          "es-CL"
        )}).`
      )
      return
    }

    setIsSubmitting(true)

    try {
      /*
       * ==========================================================
       * SUBIDA DE TODAS LAS IMÁGENES DE LAS BICICLETAS
       * ==========================================================
       */

      const bikesData = await Promise.all(
        bikes.map(async (bike, bikeIndex) => {
          const uploadedUrls: string[] = []

          for (
            let imageIndex = 0;
            imageIndex < bike.imageFiles.length;
            imageIndex++
          ) {
            const imageFile =
              bike.imageFiles[imageIndex]

            const formData = new FormData()

            formData.append(
              "file",
              imageFile
            )

            const res = await fetch(
              "/api/upload",
              {
                method: "POST",
                body: formData,
              }
            )

            if (!res.ok) {
              throw new Error(
                `Error al subir la foto ${
                  imageIndex + 1
                } de la bicicleta #${
                  bikeIndex + 1
                }`
              )
            }

            const data = await res.json()

            if (!data.url) {
              throw new Error(
                `El servidor no devolvió una URL para la foto ${
                  imageIndex + 1
                } de la bicicleta #${
                  bikeIndex + 1
                }`
              )
            }

            uploadedUrls.push(data.url)
          }

          /*
           * Mantener imagenUrl para compatibilidad
           * con el API actual.
           *
           * Si no hay imágenes nuevas pero existía
           * una URL previa, la conservamos.
           */
          const finalImageUrl =
            uploadedUrls[0] ||
            bike.imagenUrl ||
            null

          return {
            marca: bike.marca.trim(),
            modelo: bike.modelo.trim(),
            color: bike.color.trim(),
            descripcion:
              bike.descripcion.trim() ||
              null,

            // API actual
            imagenUrl: finalImageUrl,

            // API nuevo de múltiples imágenes
            imagenes: uploadedUrls,
          }
        })
      )

      /*
       * ==========================================================
       * CREACIÓN DE LA ORDEN
       * ==========================================================
       */

      const response = await fetch(
        "/api/punto-venta",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_cliente:
              Number(selectedClientId),

            estado_pago: estadoPago,

            metodo_pago:
              estadoPago === "pendiente"
                ? null
                : metodoPago,

            monto_pagado:
              estadoPago === "pagada"
                ? grandTotal
                : estadoPago === "abono"
                  ? montoAbono
                  : 0,

            descuento: 0,

            ordenTrabajo: {
              fechaEntregaEstimada:
                new Date(
                  fechaEntrega
                ).toISOString(),

              observacionesIngreso:
                descripcion.trim() ||
                null,

              estadoOrden:
                "Por realizar",

              montoServicio,

              productos:
                selectedProducts.map(
                  (product) => ({
                    idProducto:
                      Number(
                        product.idProducto
                      ),
                    cantidad:
                      product.cantidad,
                    precioUnitario:
                      product.precioUnitario,
                  })
                ),

              bicicletas: bikesData,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorData =
          await response.json()

        throw new Error(
          errorData.message ||
            "Error al crear la orden"
        )
      }

      toast.success(
        "Orden de trabajo creada correctamente"
      )

      window.dispatchEvent(
        new Event("work-orders:refresh")
      )

      router.refresh()

      setOpenModalCreate(false)
    } catch (err: any) {
      console.error(err)

      toast.error(
        err.message ||
          "No se pudo registrar la orden de trabajo"
      )
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
        {/* Información General */}
        <div className="space-y-4 rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
          <h3 className="flex items-center gap-2 border-b border-border pb-2 text-sm font-bold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Información General
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Cliente */}
            <div className="space-y-1.5">
              <Label
                htmlFor="cliente"
                className="text-xs font-semibold text-muted-foreground"
              >
                Cliente{" "}
                <span className="text-destructive">
                  *
                </span>
              </Label>

              {isLoadingClients ? (
                <div className="flex h-10 items-center justify-center rounded-lg border border-input bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                  Cargando clientes...
                </div>
              ) : (
                <>
                  <Select
                    value={
                      selectedClientId ||
                      undefined
                    }
                    onValueChange={
                      setSelectedClientId
                    }
                  >
                    <SelectTrigger className="h-10 w-full border-input bg-background text-sm">
                      <SelectValue placeholder="-- Selecciona un Cliente --" />
                    </SelectTrigger>

                    <SelectContent position="popper">
                      {clients.map((client) => {
                        const label =
                          client.razonSocial
                            ? `${client.razonSocial} (${client.rut})`
                            : `${client.primerNombre} ${
                                client.apellidoPaterno ||
                                ""
                              } (${client.rut})`.trim()

                        return (
                          <SelectItem
                            key={
                              client.idCliente
                            }
                            value={String(
                              client.idCliente
                            )}
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
                        className="font-bold text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Ir a Clientes
                      </a>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Fecha ingreso */}
            <div className="space-y-1.5">
              <Label
                htmlFor="fechaIngreso"
                className="text-xs font-semibold text-muted-foreground"
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
            {/* Fecha entrega */}
            <div className="space-y-1.5">
              <Label
                htmlFor="fechaEntrega"
                className="text-xs font-semibold text-muted-foreground"
              >
                Fecha Estimada de Entrega{" "}
                <span className="text-destructive">
                  *
                </span>
              </Label>

              <Input
                id="fechaEntrega"
                type="date"
                value={fechaEntrega}
                onChange={(e) =>
                  setFechaEntrega(
                    e.target.value
                  )
                }
                min={fechaIngreso}
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1.5 md:col-span-2">
              <Label
                htmlFor="descripcion"
                className="text-xs font-semibold text-muted-foreground"
              >
                Descripción del Trabajo a Realizar
              </Label>

              <Textarea
                id="descripcion"
                placeholder="Ej: Mantención general de transmisión, centrado de llantas..."
                value={descripcion}
                onChange={(e) =>
                  setDescripcion(
                    e.target.value
                  )
                }
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        {/* Bicicletas */}
        <BikesSection
          bikes={bikes}
          isSubmitting={isSubmitting}
          onAddBike={handleAddBike}
          onRemoveBike={handleRemoveBike}
          onUpdateBikeField={
            handleUpdateBikeField
          }
          onToggleCollapse={
            toggleCollapse
          }
          onBikeImagesChange={
            handleBikeImagesChange
          }
          onRemoveBikeImage={
            handleRemoveBikeImage
          }
        />

        {/* Productos */}
        <OrderLinesSection
          products={products}
          selectedProducts={
            selectedProducts
          }
          montoServicio={montoServicio}
          totalProductsCost={
            totalProductsCost
          }
          grandTotal={grandTotal}
          onMontoServicioChange={
            setMontoServicio
          }
          onAddProduct={
            handleAddProduct
          }
          onRemoveProduct={
            handleRemoveProduct
          }
          onProductChange={
            handleProductChange
          }
          onProductQuantityChange={
            handleProductQuantityChange
          }
        />

        {/* Pago */}
        <PaymentInitialSection
          estadoPago={estadoPago}
          metodoPago={metodoPago}
          montoAbono={montoAbono}
          grandTotal={grandTotal}
          onEstadoPagoChange={
            setEstadoPago
          }
          onMetodoPagoChange={
            setMetodoPago
          }
          onMontoAbonoChange={
            setMontoAbono
          }
        />

        {/* Botones */}
        <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setOpenModalCreate(false)
            }
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
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

      {/* Registro rápido de cliente */}
      <Dialog
        open={openQuickCreateClient}
        onOpenChange={
          setOpenQuickCreateClient
        }
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Registrar Cliente Rápido
            </DialogTitle>

            <DialogDescription>
              Ingresa los datos para registrar
              un nuevo cliente en el sistema.
            </DialogDescription>
          </DialogHeader>

          <FormCreateCliente
            onSuccess={
              handleQuickClientSuccess
            }
          />
        </DialogContent>
      </Dialog>
    </>
  )
}