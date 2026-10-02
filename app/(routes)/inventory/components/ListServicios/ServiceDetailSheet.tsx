// Panel lateral para visualizar el detalle informativo de un servicio.
"use client"

import { Pencil, Wrench } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatCurrency } from "@/lib/formatters"
import { getNombreEstadoRegistro, isRegistroActivo } from "@/lib/registro-status"
import { type ServiceColumn } from "../../types"

type ServiceDetailSheetProps = {
  service: ServiceColumn | null
  open: boolean
  onOpenChange: (open: boolean) => void
  canUpdate: boolean
  onEdit: (service: ServiceColumn) => void
}

export function ServiceDetailSheet({
  service,
  open,
  onOpenChange,
  canUpdate,
  onEdit,
}: ServiceDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md p-6 bg-card border-l border-border/80">
        {service ? (
          <>
            <SheetHeader className="pb-4 border-b border-border/60">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Ficha de Servicio #{service.idServicio}
                </span>
                <StatusBadge
                  status={isRegistroActivo(service.estado) ? "success" : "danger"}
                  label={getNombreEstadoRegistro(service.estado)}
                  showDot={false}
                />
              </div>
              <SheetTitle className="text-xl font-bold text-foreground">{service.nombre}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Detalle de la labor y la tarifa de mano de obra del taller.
              </SheetDescription>
              {canUpdate && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 w-full gap-2 rounded-xl sm:w-auto"
                  onClick={() => onEdit(service)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar servicio
                </Button>
              )}
            </SheetHeader>

            <div className="space-y-6 pt-4">
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/40 shadow-xs">
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Wrench className="size-10 stroke-[1.5]" />
                  <span className="text-xs font-medium">Servicio de taller</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Código
                  </span>
                  <p className="font-mono text-sm font-bold text-foreground">{service.codigo}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Precio Mano de Obra
                  </span>
                  <p className="text-base font-extrabold text-foreground">{formatCurrency(service.precioVenta)}</p>
                </div>

                <div className="col-span-2 p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                    Tipo de ítem
                  </span>
                  <p className="text-sm font-bold text-foreground">Servicio / Mano de obra de taller</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción del Servicio</p>
                <p className="text-xs sm:text-sm leading-relaxed text-foreground/90">
                  {service.descripcion || "Sin descripción adicional registrada para este servicio."}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
