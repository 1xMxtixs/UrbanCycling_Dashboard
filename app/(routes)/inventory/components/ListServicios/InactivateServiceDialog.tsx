"use client"

import { Power, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { isRegistroActivo } from "@/lib/registro-status"
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

  const isActivo = isRegistroActivo(service.estado)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          {isActivo ? (
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 />
            </AlertDialogMedia>
          ) : (
            <AlertDialogMedia className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
              <Power />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>
            {isActivo
              ? `¿Inactivar ${service.nombre}?`
              : `¿Reactivar ${service.nombre}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActivo
              ? "El servicio pasará a estado inactivo y no aparecerá en el listado principal. Esta acción se puede revertir más adelante reactivándolo desde el filtro Solo Inactivos."
              : "El servicio volverá a estado activo y aparecerá nuevamente en el listado principal."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={isSubmitting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant={isActivo ? "destructive" : "default"}
            disabled={isSubmitting}
            onClick={(e) => {
              e.preventDefault()
              void onConfirm()
            }}
          >
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                {isActivo ? "Inactivando..." : "Reactivando..."}
              </>
            ) : isActivo ? (
              "Inactivar"
            ) : (
              "Reactivar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
