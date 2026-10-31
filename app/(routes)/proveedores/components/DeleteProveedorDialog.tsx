"use client"

import { useState } from "react"
import { toast } from "sonner"
import { StatusToggleDialog } from "@/components/common/StatusToggleDialog"
import type { ProveedorListado } from "./types"

interface DeleteProveedorDialogProps {
  open: boolean
  proveedor: ProveedorListado | null
  onOpenChange: (open: boolean) => void
  onDeleted: (idProveedor: number) => void
}

export function DeleteProveedorDialog({
  open,
  proveedor,
  onOpenChange,
  onDeleted,
}: DeleteProveedorDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!proveedor) return

    try {
      setIsDeleting(true)

      const response = await fetch(
        `/api/proveedores/${proveedor.idProveedor}`,
        {
          method: "DELETE",
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.message || "No fue posible inactivar el proveedor.",
        )
      }

      // PR-13: Texto claro y consistente con la acción de inactivación lógica
      toast.success("Proveedor inactivado correctamente.")

      onDeleted(proveedor.idProveedor)
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible inactivar el proveedor."

      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (!proveedor) return null

  return (
    <StatusToggleDialog
      open={open}
      onOpenChange={onOpenChange}
      entityLabel="proveedor"
      entityName={proveedor.razonSocial}
      isActive={true}
      onConfirm={handleDelete}
      isSubmitting={isDeleting}
    />
  )
}
