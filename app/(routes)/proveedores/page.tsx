"use client"

import { useCallback, useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import {
  CreateProveedorDialog,
  DeleteProveedorDialog,
  EditProveedorDialog,
  HeaderProveedores,
  ListProveedores,
  ProveedorDetailSheet,
  type ProveedorListado,
} from "./components"

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<
    ProveedorListado[]
  >([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [createOpen, setCreateOpen] = useState(false)

  const [selectedProveedor, setSelectedProveedor] =
    useState<ProveedorListado | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const cargarProveedores = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/proveedores", {
        method: "GET",
        cache: "no-store",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "No fue posible cargar los proveedores.",
        )
      }

      setProveedores(data.providers ?? [])
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "No fue posible cargar los proveedores."

      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargarProveedores()
  }, [cargarProveedores])

  const handleCreated = (
    proveedor: ProveedorListado,
  ) => {
    setProveedores((current) => [
      ...current,
      proveedor,
    ])
  }

  const handleUpdated = (
    proveedor: ProveedorListado,
  ) => {
    setProveedores((current) =>
      current.map((item) =>
        item.idProveedor === proveedor.idProveedor
          ? proveedor
          : item,
      ),
    )

    setSelectedProveedor(proveedor)
  }

  const handleDeleted = (idProveedor: number) => {
    setProveedores((current) =>
      current.filter(
        (item) => item.idProveedor !== idProveedor,
      ),
    )

    setSelectedProveedor(null)
    setDetailOpen(false)
  }

  const handleView = (
    proveedor: ProveedorListado,
  ) => {
    setSelectedProveedor(proveedor)
    setDetailOpen(true)
  }

  const handleEdit = (
    proveedor: ProveedorListado,
  ) => {
    setSelectedProveedor(proveedor)
    setDetailOpen(false)
    setEditOpen(true)
  }

  const handleDelete = (
    proveedor: ProveedorListado,
  ) => {
    setSelectedProveedor(proveedor)
    setDetailOpen(false)
    setDeleteOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <HeaderProveedores
        onCreate={() => setCreateOpen(true)}
      />

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-destructive">
              No fue posible cargar los proveedores.
            </p>

            <p className="text-sm text-destructive/80">
              {error}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => void cargarProveedores()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        </div>
      )}

      <ListProveedores
        proveedores={proveedores}
        isLoading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateProveedorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <EditProveedorDialog
        open={editOpen}
        proveedor={selectedProveedor}
        onOpenChange={setEditOpen}
        onUpdated={handleUpdated}
      />

      <ProveedorDetailSheet
        open={detailOpen}
        proveedor={selectedProveedor}
        onOpenChange={setDetailOpen}
        onEdit={() => {
          setDetailOpen(false)
          setEditOpen(true)
        }}
        onDelete={() => {
          setDetailOpen(false)
          setDeleteOpen(true)
        }}
      />

      <DeleteProveedorDialog
        open={deleteOpen}
        proveedor={selectedProveedor}
        onOpenChange={setDeleteOpen}
        onDeleted={handleDeleted}
      />
    </div>
  )
}