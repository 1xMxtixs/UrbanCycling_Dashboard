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

interface StatusToggleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityLabel: string
  entityName: string
  isActive: boolean
  onConfirm: () => Promise<void>
  isSubmitting?: boolean
}

export function StatusToggleDialog({
  open,
  onOpenChange,
  entityLabel,
  entityName,
  isActive,
  onConfirm,
  isSubmitting = false,
}: StatusToggleDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          {isActive ? (
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2 />
            </AlertDialogMedia>
          ) : (
            <AlertDialogMedia className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
              <Power />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>
            {isActive ? `¿Inactivar ${entityName}?` : `¿Reactivar ${entityName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isActive
              ? `El ${entityLabel} pasará a estado inactivo. Esta acción se puede revertir más adelante reactivándolo desde el menú de acciones.`
              : `El ${entityLabel} volverá a estado activo.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={isSubmitting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant={isActive ? "destructive" : "default"}
            disabled={isSubmitting}
            onClick={(e) => {
              e.preventDefault()
              void onConfirm()
            }}
          >
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                {isActive ? "Inactivando..." : "Reactivando..."}
              </>
            ) : isActive ? (
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
