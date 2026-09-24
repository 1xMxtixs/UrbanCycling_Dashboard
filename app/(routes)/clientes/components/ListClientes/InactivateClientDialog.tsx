"use client"

import * as React from "react"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

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

interface InactivateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  clientId: number
  onConfirm: (clientId: number) => Promise<void>
}

export function InactivateClientDialog({
  open,
  onOpenChange,
  clientName,
  clientId,
  onConfirm,
}: InactivateClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleConfirm() {
    setIsSubmitting(true)
    try {
      await onConfirm(clientId)
      toast.success("Cliente inactivado correctamente")
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo inactivar el cliente. Intenta nuevamente."
      toast.error(message)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>¿Inactivar a {clientName}?</AlertDialogTitle>
          <AlertDialogDescription>
            El cliente pasará a estado inactivo y no aparecerá en el listado
            principal. Esta acción se puede revertir más adelante desde su
            ficha.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={isSubmitting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isSubmitting}
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
          >
            {isSubmitting ? (
              <>
                <Spinner data-icon="inline-start" />
                Inactivando...
              </>
            ) : (
              "Inactivar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
