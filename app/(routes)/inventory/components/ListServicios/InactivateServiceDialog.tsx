"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type ServiceColumn } from "../../types"

interface InactivateServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: ServiceColumn | null
  onConfirm: () => Promise<void>
  isSubmitting?: boolean
}

export function InactivateServiceDialog({
  open,
  onOpenChange,
  service,
  onConfirm,
  isSubmitting = false,
}: InactivateServiceDialogProps) {
  if (!service) return null

  const isActivo = service.estado.toLowerCase() === "activo"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold tracking-tight">
            {isActivo ? "¿Inactivar servicio?" : "¿Reactivar servicio?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
            {isActivo ? (
              <>
                ¿Estás seguro de que deseas desactivar el servicio{" "}
                <span className="font-semibold text-foreground">
                  {service.nombre}
                </span>{" "}
                (<span className="font-mono">{service.codigo}</span>)? Ya no estará disponible para nuevas órdenes de trabajo o ventas.
              </>
            ) : (
              <>
                ¿Deseas reactivar el servicio{" "}
                <span className="font-semibold text-foreground">
                  {service.nombre}
                </span>
                ? Volverá a estar visible y operativo en el catálogo del taller.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel disabled={isSubmitting} className="rounded-lg">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isSubmitting}
            className={`rounded-lg font-medium transition-colors ${
              isActivo
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isSubmitting
              ? "Procesando..."
              : isActivo
              ? "Inactivar servicio"
              : "Reactivar servicio"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
