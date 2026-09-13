"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Dialog } from "@/components/ui/dialog"
import { FormDialog } from "@/components/forms/FormDialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProductColumn } from "../ListInventory/columns"

export interface InventoryMovementDialogProps {
  product: ProductColumn | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getNowLocalString() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

const movementSchema = (stockActual: number) =>
  z.object({
    tipoMovimiento: z.enum(["ENTRADA", "SALIDA"], { error: "Obligatorio" }),
    cantidad: z.string().min(1, "Obligatorio")
      .refine((v) => !Number.isNaN(Number(v)) && Number.isInteger(Number(v)) && Number(v) > 0, "Entero > 0"),
    fechaOperacion: z.string().min(1, "Obligatorio"),
    motivo: z.string().max(50, "Máximo 50 caracteres").optional(),
    observacion: z.string().max(500, "Máximo 500 caracteres").optional(),
  }).superRefine((data, ctx) => {
    if (data.tipoMovimiento === "SALIDA" && Number(data.cantidad) > stockActual) {
      ctx.addIssue({ code: "custom", message: `Supera el stock actual disponible (${stockActual} u)`, path: ["cantidad"] })
    }
  })

type FormValues = z.infer<ReturnType<typeof movementSchema>>

export function InventoryMovementDialog({ product, open, onOpenChange }: InventoryMovementDialogProps) {
  const stockActual = product?.stockActual ?? 0
  const schema = useMemo(() => movementSchema(stockActual), [stockActual])
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { tipoMovimiento: "ENTRADA", cantidad: "", fechaOperacion: getNowLocalString(), motivo: "", observacion: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset({ tipoMovimiento: "ENTRADA", cantidad: "", fechaOperacion: getNowLocalString(), motivo: "", observacion: "" })
    }
  }, [open, product, form])

  const onSubmit = async (values: FormValues) => {
    if (!product) return
    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idProducto: product.idProducto,
          tipoMovimiento: values.tipoMovimiento,
          cantidad: Number(values.cantidad),
          fechaOperacion: new Date(values.fechaOperacion).toISOString(),
          motivo: values.motivo?.trim() || undefined,
          observacion: values.observacion?.trim() || undefined,
        }),
      })

      const body = await res.json().catch(() => null)

      if (res.status === 201) {
        toast.success(body?.message || "Movimiento registrado")
        if (body?.alert?.code === "STOCK_BAJO_DETECTADO") toast.warning(body.alert.message)
        if (body?.alert?.code === "STOCK_NORMALIZADO") toast.info(body.alert.message)
        window.dispatchEvent(new Event("inventory:refresh"))
        window.dispatchEvent(new Event("inventory-movements:refresh"))
        form.reset()
        onOpenChange(false)
        return
      }

      if (res.status === 400 || res.status === 404 || res.status === 409) {
        toast.error(body?.message || "Error al procesar movimiento")
        if (res.status === 409) {
          form.setError("cantidad", {
            type: "server",
            message: body?.stockActual !== undefined ? `Stock insuficiente (actual: ${body.stockActual})` : (body?.message || "Stock insuficiente"),
          })
        }
        return
      }

      toast.error("Ocurrió un error al registrar el movimiento")
    } catch {
      toast.error("Ocurrió un error inesperado al registrar el movimiento")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <FormDialog title="Registrar Movimiento de Bodega" description="Registra una entrada o salida manual de existencias." size="lg">
        {product && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/40 p-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Producto</p>
                <p className="font-semibold text-sm text-foreground">{product.nombre}</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                Stock actual: {product.stockActual} u
              </span>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="tipoMovimiento" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de movimiento</FormLabel>
                      <Select onValueChange={(v) => { field.onChange(v); form.trigger("cantidad") }} value={field.value}>
                        <FormControl><SelectTrigger className="w-full"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger></FormControl>
                        <SelectContent position="popper">
                          <SelectItem value="ENTRADA">Entrada</SelectItem>
                          <SelectItem value="SALIDA">Salida</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="cantidad" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl><Input type="number" min={1} placeholder="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="fechaOperacion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de operación</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="motivo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo (opcional)</FormLabel>
                    <FormControl><Input maxLength={50} placeholder="Ej: Reposición, merma..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="observacion" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observación (opcional)</FormLabel>
                    <FormControl><Textarea maxLength={500} placeholder="Detalles adicionales..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>Cancelar</Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Registrando..." : "Registrar movimiento"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </FormDialog>
    </Dialog>
  )
}
