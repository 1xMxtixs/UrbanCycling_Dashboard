"use client"

import { useCallback, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PERMISSIONS } from "@/lib/permissions"

export type AssociationTarget = {
  kind: "supplier" | "product"
  id: number
  nombre: string
  estado: string
  productIds?: number[]
}

type Option = { id: number; nombre: string; estado: string }
type Product = { idProducto: number; nombre: string; estado: string }
type Supplier = { idProveedor: number; razonSocial: string; estado: string }

async function readResponse(response: Response) {
  const data = await response.json().catch(() => null)
  if (!response.ok)
    throw new Error(
      data?.message || "No fue posible consultar las asociaciones."
    )
  return data
}

export function SupplierProductsDialog({
  target,
  onClose,
}: {
  target: AssociationTarget | null
  onClose: () => void
}) {
  const { data: session } = useSession()
  const permissions = session?.user?.permisos ?? []
  const canManage = [
    PERMISSIONS.SUPPLIERS_UPDATE,
    PERMISSIONS.INVENTORY_UPDATE,
  ].every((p) => permissions.includes(p))
  const [linked, setLinked] = useState<Option[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)

  const loadLinked = useCallback(
    async (signal?: AbortSignal) => {
      if (!target) return
      if (target.productIds) {
        setLinked([])
        return
      }
      const data = await fetch(
        target.kind === "supplier"
          ? `/api/proveedores/${target.id}/productos`
          : `/api/inventory/${target.id}`,
        { cache: "no-store", signal }
      ).then(readResponse)
      const items: Option[] =
        target.kind === "supplier"
          ? data.products.map((p: Product) => ({
              id: p.idProducto,
              nombre: p.nombre,
              estado: p.estado,
            }))
          : data.proveedores.map((s: Supplier) => ({
              id: s.idProveedor,
              nombre: s.razonSocial,
              estado: s.estado,
            }))
      if (!signal?.aborted) setLinked(items)
    },
    [target]
  )

  useEffect(() => {
    if (!target) return
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError("")
      setSelected([])
      setSearch("")
      try {
        const [, data] = await Promise.all([
          loadLinked(controller.signal),
          fetch(
            target!.kind === "supplier" ? "/api/inventory" : "/api/proveedores",
            {
              cache: "no-store",
              signal: controller.signal,
            }
          ).then(readResponse),
        ])
        if (controller.signal.aborted) return
        setOptions(
          target!.kind === "supplier"
            ? data.map((p: Product) => ({
                id: p.idProducto,
                nombre: p.nombre,
                estado: p.estado,
              }))
            : data.providers.map((s: Supplier) => ({
                id: s.idProveedor,
                nombre: s.razonSocial,
                estado: s.estado,
              }))
        )
      } catch (err) {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible cargar los datos."
          )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [target, loadLinked, retry])

  if (!target) return null
  const label = target.kind === "supplier" ? "productos" : "proveedores"
  const available = options.filter(
    (item) =>
      item.estado === "ACTIVO" &&
      !linked.some((association) => association.id === item.id) &&
      item.nombre
        .toLocaleLowerCase("es")
        .includes(search.toLocaleLowerCase("es"))
  )

  async function mutate(optionId?: number) {
    if (!target || saving) return
    setSaving(true)
    setError("")
    try {
      if (optionId !== undefined) {
        const supplier = target.kind === "supplier" ? target.id : optionId
        const product = target.kind === "supplier" ? optionId : target.id
        await fetch(`/api/proveedores/${supplier}/productos/${product}`, {
          method: "DELETE",
        }).then(readResponse)
      } else {
        // Desde un producto se agrega un proveedor por operación; desde un proveedor, varios productos.
        const supplier = target.kind === "supplier" ? target.id : selected[0]
        await fetch(`/api/proveedores/${supplier}/productos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idProductos:
              target.kind === "supplier"
                ? selected
                : (target.productIds ?? [target.id]),
          }),
        }).then(readResponse)
      }
      setSelected([])
      window.dispatchEvent(new Event("inventory:refresh"))
      window.dispatchEvent(new Event("product-suppliers:refresh"))
      await loadLinked()
      toast.success(
        optionId !== undefined
          ? "Asociación retirada."
          : "Asociaciones guardadas."
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible guardar la asociación."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose()
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
        aria-busy={saving}
      >
        <DialogHeader>
          <DialogTitle>
            {target.kind === "supplier" ? "Productos" : "Proveedores"} de{" "}
            {target.nombre}
          </DialogTitle>
          <DialogDescription>
            Un producto puede estar asociado a varios proveedores.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {loading ? (
          <p role="status">Cargando asociaciones...</p>
        ) : (
          <>
            {!target.productIds && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  Asociados ({linked.length})
                </h3>
                {linked.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Sin {label} asociados.
                  </p>
                )}
                {linked.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <span className="text-sm">
                      {item.nombre}
                      {item.estado !== "ACTIVO" && " (inactivo)"}
                    </span>
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() => void mutate(item.id)}
                        aria-label={`Desvincular ${item.nombre}`}
                      >
                        Desvincular
                      </Button>
                    )}
                  </div>
                ))}
              </section>
            )}
            {canManage && target.estado === "ACTIVO" && (
              <section className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold">Asociar {label}</h3>
                <Input
                  aria-label={`Buscar ${label}`}
                  placeholder={`Buscar ${label}...`}
                  value={search}
                  disabled={saving}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {available.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No hay {label} disponibles para esta búsqueda.
                    </p>
                  )}
                  {available.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm"
                    >
                      <input
                        type={target.kind === "supplier" ? "checkbox" : "radio"}
                        name="asociacion"
                        checked={selected.includes(item.id)}
                        disabled={saving}
                        onChange={(e) =>
                          setSelected((current) =>
                            target.kind === "product"
                              ? [item.id]
                              : e.target.checked
                                ? [...current, item.id]
                                : current.filter((id) => id !== item.id)
                          )
                        }
                      />
                      {item.nombre}
                    </label>
                  ))}
                </div>
                <Button
                  disabled={
                    saving || selected.length === 0 || selected.length > 500
                  }
                  onClick={() => void mutate()}
                >
                  {saving ? "Guardando..." : "Asociar selección"}
                </Button>
              </section>
            )}
            {!canManage && (
              <p className="text-sm text-muted-foreground">
                Necesitas permisos de edición de inventario y proveedores para
                modificar las asociaciones.
              </p>
            )}
          </>
        )}
        {error && (
          <Button
            variant="outline"
            disabled={saving || loading}
            onClick={() => setRetry((value) => value + 1)}
          >
            Volver a cargar
          </Button>
        )}
        <Button variant="outline" disabled={saving} onClick={onClose}>
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  )
}
