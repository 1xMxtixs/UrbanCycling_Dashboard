"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { StatusBadge } from "@/components/common/StatusBadge"
import { Wrench, Tag, DollarSign, Calendar, FileText } from "lucide-react"
import { type ServiceColumn } from "../../types"

interface ServiceDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: ServiceColumn | null
}

export function ServiceDetailSheet({
  open,
  onOpenChange,
  service,
}: ServiceDetailSheetProps) {
  if (!service) return null

  const isActivo = service.estado.toLowerCase() === "activo"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold tracking-tight">
                {service.nombre}
              </SheetTitle>
              <SheetDescription className="text-xs font-mono">
                Código: {service.codigo}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Estado y Precio Destacado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border bg-muted/20 p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <Tag className="h-3.5 w-3.5" /> Estado
              </span>
              <div className="pt-1">
                <StatusBadge
                  status={isActivo ? "success" : "neutral"}
                  label={isActivo ? "Activo" : "Inactivo"}
                />
              </div>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4 space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <DollarSign className="h-3.5 w-3.5" /> Precio Mano de Obra
              </span>
              <p className="text-lg font-bold text-foreground">
                ${Number(service.precioVenta).toLocaleString("es-CL")}
              </p>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Descripción del Servicio
            </h4>
            <div className="rounded-xl border p-4 bg-background text-sm text-foreground leading-relaxed">
              {service.descripcion ? (
                <p>{service.descripcion}</p>
              ) : (
                <p className="text-muted-foreground italic">
                  Sin descripción detallada registrada para este servicio.
                </p>
              )}
            </div>
          </div>

          {/* Información Adicional */}
          <div className="space-y-3 rounded-xl border p-4 bg-muted/10 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>ID Interno de Sistema:</span>
              <span className="font-mono text-foreground font-medium">
                #{service.idServicio}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Tipo de Ítem:</span>
              <span className="text-foreground font-medium">
                Servicio / Mano de Obra de Taller
              </span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
