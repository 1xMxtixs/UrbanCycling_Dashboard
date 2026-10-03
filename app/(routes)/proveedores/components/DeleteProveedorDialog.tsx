"use client"

import { useState } from "react"
import { Loader2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

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
          data?.message ||
            "No fue posible eliminar el proveedor.",
        )
      }

      toast.success("Proveedor eliminado correctamente.")

      onDeleted(proveedor.idProveedor)
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el proveedor."

      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <TriangleAlert className="h-5 w-5 text-destructive" />
          </div>

          <AlertDialogTitle>
            ¿Eliminar proveedor?
          </AlertDialogTitle>

          <AlertDialogDescription>
            Estás a punto de eliminar a{" "}
            <span className="font-semibold text-foreground">
              {proveedor?.razonSocial}
            </span>
            .

            <br />
            <br />

            El proveedor será marcado como{" "}
            <span className="font-semibold">
              inactivo
            </span>{" "}
            y dejará de aparecer en el listado. Sus datos
            no serán eliminados permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault()
              void handleDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {isDeleting ? "Eliminando..." : "Eliminar proveedor"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}