// Panel lateral para visualizar el detalle informativo de un servicio.
"use client"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { StatusBadge } from "@/components/common/StatusBadge"
import { DataField } from "@/components/common/DataField"
import { formatCurrency } from "@/lib/formatters"
import { getNombreEstadoRegistro, isRegistroActivo } from "@/lib/registro-status"
import { type ServiceColumn } from "../../types"

type ServiceDetailSheetProps = {
  service: ServiceColumn | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ServiceDetailSheet({
  service,
  open,
  onOpenChange,
}: ServiceDetailSheetProps) {
  const isActivo = service ? isRegistroActivo(service.estado) : false

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
                  status={isActivo ? "success" : "danger"}
                  label={getNombreEstadoRegistro(service.estado)}
                  showDot={false}
                />
              </div>
              <SheetTitle className="text-xl font-bold text-foreground">{service.nombre}</SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Código, tarifa de mano de obra y descripción de la labor del taller.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 pt-4">
              {/* Badge informativo de tipo */}
              <div className="flex items-center gap-2">
                <StatusBadge
                  status="info"
                  label="Servicio de taller"
                  showDot={false}
                />
              </div>

              {/* Grid de tarjetas de datos usando DataField */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <DataField
                    label="Código"
                    value={<span className="font-mono break-all">{service.codigo}</span>}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <DataField
                    label="Precio Mano de Obra"
                    value={
                      <span className="text-base font-extrabold text-foreground">
                        {formatCurrency(service.precioVenta)}
                      </span>
                    }
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <DataField
                    label="ID Servicio"
                    value={<span className="font-mono">#{service.idServicio}</span>}
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60">
                  <DataField
                    label="Estado"
                    value={getNombreEstadoRegistro(service.estado)}
                  />
                </div>
              </div>

              {/* Sección descripción */}
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
