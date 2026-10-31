"use client"

import * as React from "react"
import { toast } from "sonner"
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog"

interface InactivateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  clientId: number
  onConfirm: (clientId: number) => Promise<string>
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
      const message = await onConfirm(clientId)
      toast.success(message)
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
    <StatusToggleDialog
      open={open}
      onOpenChange={onOpenChange}
      entityLabel="cliente"
      entityName={clientName}
      isActive={true}
      onConfirm={handleConfirm}
      isSubmitting={isSubmitting}
    />
  )
}
