"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Wrench, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { WorkOrder, WorkOrderServiceLine } from "../../types"

interface CatalogService {
  idServicio: number
  codigo: string
  nombre: string
  descripcion: string | null
  precioVenta: number
  estado: string
}

interface ModifyServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: WorkOrder | null
  onSuccess?: () => void
}

const modifyServiceSchema = z.object({
  idLineaDeOrdenDeTrabajo: z
    .number()
    .min(1, "Debes seleccionar una línea de servicio"),
  idServicio: z
    .number()
    .min(1, "Debes seleccionar un nuevo servicio"),
  diagnostico: z
    .string()
    .trim()
    .min(1, "Debe agregar una descripción para el cambio"),
})

type FormValues = z.infer<typeof modifyServiceSchema>

export function ModifyServiceDialog({
  open,
  onOpenChange,
  order,
  onSuccess,
}: ModifyServiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [serviceLines, setServiceLines] = useState<WorkOrderServiceLine[]>([])
  const [catalog, setCatalog] = useState<CatalogService[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(modifyServiceSchema),
    mode: "onChange",
    defaultValues: {
      idLineaDeOrdenDeTrabajo: 0,
      idServicio: 0,
      diagnostico: "",
    },
  })

  useEffect(() => {
    if (!open || !order?.idOrdenDeTrabajo) {
      setServiceLines([])
      setCatalog([])
      setLoadError(null)
      setIsLoading(false)
      form.reset({
        idLineaDeOrdenDeTrabajo: 0,
        idServicio: 0,
        diagnostico: "",
      })
      return
    }

    let isMounted = true

    const fetchData = async () => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const [linesRes, catalogRes] = await Promise.all([
          fetch(`/api/ordenes-trabajo/${order.idOrdenDeTrabajo}/servicios`),
          fetch("/api/servicios?estado=activo"),
        ])

        if (!linesRes.ok) {
          const errData = await linesRes.json().catch(() => null)
          throw new Error(
            errData?.message || "No se pudieron cargar los servicios de la orden"
          )
        }

        if (!catalogRes.ok) {
          throw new Error("No se pudo cargar el catálogo de servicios")
        }

        const linesData = await linesRes.json()
        const catalogData = (await catalogRes.json()) as CatalogService[]

        if (!isMounted) return

        const filteredLines: WorkOrderServiceLine[] = (
          linesData.lineas || []
        ).filter(
          (l: WorkOrderServiceLine) =>
            l.idServicio !== null && l.idServicio !== undefined
        )

        setServiceLines(filteredLines)
        setCatalog(catalogData)

        const defaultLineId =
          filteredLines.length === 1
            ? filteredLines[0].idLineaDeOrdenDeTrabajo
            : 0

        form.reset({
          idLineaDeOrdenDeTrabajo: defaultLineId,
          idServicio: 0,
          diagnostico: order.observacionesIngreso || "",
        })
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error ? err.message : "Error al cargar servicios"
          setLoadError(msg)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [open, order?.idOrdenDeTrabajo, order?.observacionesIngreso, form])

  if (!order) return null

  const watchLineaId = form.watch("idLineaDeOrdenDeTrabajo")
  const watchServicioId = form.watch("idServicio")

  const selectedLine = serviceLines.find(
    (l) => l.idLineaDeOrdenDeTrabajo === Number(watchLineaId)
  )

  const selectedCatalogService = catalog.find(
    (s) => s.idServicio === Number(watchServicioId)
  )

  const isSameService =
    selectedLine &&
    selectedCatalogService &&
    selectedLine.idServicio === selectedCatalogService.idServicio

  const { isSubmitting, isValid } = form.formState

  const onSubmit = async (values: FormValues) => {
    if (isSameService) {
      toast.error("El nuevo servicio debe ser distinto al servicio actual")
      return
    }

    try {
      const res = await fetch(
        `/api/ordenes-trabajo/${order.idOrdenDeTrabajo}/servicios`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            idLineaDeOrdenDeTrabajo: Number(values.idLineaDeOrdenDeTrabajo),
            idServicio: Number(values.idServicio),
            diagnostico: values.diagnostico.trim(),
          }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || "Error al modificar el servicio")
        return
      }

      toast.success(
        data.message || "Modificación de servicio registrada correctamente"
      )
      onOpenChange(false)
      onSuccess?.()
    } catch {
      toast.error("Error inesperado al modificar el servicio")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-blue-600 dark:text-blue-400">
            <Wrench className="h-5 w-5" />
            Modificar Servicio Técnico
          </DialogTitle>
          <DialogDescription>
            Modifica el servicio de la Orden #{order.idOrdenDeTrabajo} y registra el diagnóstico correspondiente.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Cargando servicios de la orden...</span>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {!isLoading && !loadError && serviceLines.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border/80 rounded-xl bg-muted/20">
            <Wrench className="h-8 w-8 text-muted-foreground mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-foreground">
              Sin servicios técnicos
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Esta orden no tiene líneas de servicio técnico disponibles para modificar.
            </p>
          </div>
        )}

        {!isLoading && !loadError && serviceLines.length > 0 && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
              <FormField
                control={form.control}
                name="idLineaDeOrdenDeTrabajo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Línea de servicio a modificar</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona la línea de servicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        {serviceLines.map((line) => (
                          <SelectItem
                            key={line.idLineaDeOrdenDeTrabajo}
                            value={String(line.idLineaDeOrdenDeTrabajo)}
                          >
                            {line.servicio?.nombre || `Línea #${line.idLineaDeOrdenDeTrabajo}`}{" "}
                            (${Number(line.precioUnitario).toLocaleString("es-CL")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idServicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nuevo servicio del catálogo</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(val) => field.onChange(Number(val))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona el nuevo servicio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        {catalog.map((serv) => {
                          const isCurrent =
                            selectedLine && serv.idServicio === selectedLine.idServicio
                          return (
                            <SelectItem
                              key={serv.idServicio}
                              value={String(serv.idServicio)}
                              disabled={Boolean(isCurrent)}
                            >
                              {serv.nombre} (${Number(serv.precioVenta).toLocaleString("es-CL")})
                              {isCurrent ? " (Actual)" : ""}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {isSameService && (
                      <p className="text-xs font-medium text-destructive mt-1">
                        El nuevo servicio debe ser distinto al servicio actual
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price comparison */}
              {(selectedLine || selectedCatalogService) && (
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                      Precio actual
                    </span>
                    <span className="text-base font-black text-foreground">
                      {selectedLine
                        ? `$${Number(selectedLine.precioUnitario).toLocaleString("es-CL")}`
                        : "—"}
                    </span>
                    {selectedLine?.servicio?.nombre && (
                      <span className="text-[11px] text-muted-foreground block truncate">
                        {selectedLine.servicio.nombre}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                      Nuevo precio
                    </span>
                    <span className="text-base font-black text-blue-600 dark:text-blue-400">
                      {selectedCatalogService
                        ? `$${Number(selectedCatalogService.precioVenta).toLocaleString("es-CL")}`
                        : "—"}
                    </span>
                    {selectedCatalogService && (
                      <span className="text-[11px] text-muted-foreground block truncate">
                        {selectedCatalogService.nombre}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <FormField
                control={form.control}
                name="diagnostico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnóstico / Motivo del cambio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el motivo del cambio de servicio o diagnóstico técnico..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!isValid || isSubmitting || Boolean(isSameService)}
                  className="font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambio"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
