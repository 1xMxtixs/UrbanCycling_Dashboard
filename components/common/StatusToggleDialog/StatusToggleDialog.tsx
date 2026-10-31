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
import { cn } from "@/lib/utils"

export interface StatusToggleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityLabel?: string
  entityName?: string
  isActive?: boolean
  onConfirm: () => Promise<void>
  isSubmitting?: boolean
  title?: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  actionVariant?: "default" | "destructive"
}

export function StatusToggleDialog({
  open,
  onOpenChange,
  entityLabel = "elemento",
  entityName = "",
  isActive = false,
  onConfirm,
  isSubmitting = false,
  title,
  description,
  confirmLabel,
  actionVariant,
}: StatusToggleDialogProps) {
  const isDestructive = actionVariant ? actionVariant === "destructive" : isActive
  const finalTitle =
    title ?? (isActive ? `¿Inactivar ${entityName}?` : `¿Reactivar ${entityName}?`)
  const finalDescription =
    description ??
    (isActive
      ? `El ${entityLabel} pasará a estado inactivo. Esta acción se puede revertir más adelante reactivándolo desde el menú de acciones.`
      : `El ${entityLabel} volverá a estado activo.`)
  const finalConfirmLabel =
    confirmLabel ?? (isActive ? "Inactivar" : "Reactivar")

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia
            className={cn(
              isDestructive
                ? "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive"
                : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
            )}
          >
            {isDestructive ? <Trash2 /> : <Power />}
          </AlertDialogMedia>
          <AlertDialogTitle>{finalTitle}</AlertDialogTitle>
          <AlertDialogDescription>{finalDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={isSubmitting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant={isDestructive ? "destructive" : "default"}
            disabled={isSubmitting}
            onClick={(e) => {
              e.preventDefault()
              void onConfirm()
            }}
          >
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                {isActive ? "Inactivando..." : "Actualizando..."}
              </>
            ) : (
              finalConfirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
