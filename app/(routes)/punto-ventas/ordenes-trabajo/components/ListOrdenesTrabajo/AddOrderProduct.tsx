"use client"

import { useEffect, useState } from "react"
import { Loader2, PlusCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCLP } from "@/lib/formatters"
import { isRegistroActivo } from "@/lib/registro-status"
import { validarCantidadProducto } from "@/lib/work-order-products"
import type { WorkOrderServiceLine } from "../../types"

type Product = { idProducto: number; nombre: string; stockActual: number; precioVenta: number; estado: string }

export function AddOrderProduct({ orderId, lines, disabledReason, onAdded }: {
  orderId: number
  lines: WorkOrderServiceLine[]
  disabledReason?: string
  onAdded: () => void
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (disabledReason) return
    const controller = new AbortController()
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/inventory", { signal: controller.signal })
        if (!res.ok) throw new Error("No se pudo cargar el inventario. Revisa tus permisos o vuelve a intentar.")
        const data: Product[] = await res.json()
        if (!Array.isArray(data)) throw new Error("La respuesta del inventario no es válida")
        setProducts(data.filter((product) => isRegistroActivo(product.estado)))
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "No se pudo cargar el inventario")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [disabledReason, revision])

  const selected = products.find((product) => String(product.idProducto) === productId)
  const existing = lines.find((line) => String(line.idProducto) === productId)
  const filtered = products.filter((product) =>
    `${product.nombre} ${product.idProducto}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  )

  async function add() {
    if (saving || disabledReason || !selected) return
    const cantidad = Number(quantity)
    try {
      validarCantidadProducto(cantidad)
      if (cantidad > selected.stockActual) throw new Error("No hay stock suficiente para la cantidad solicitada")
      setSaving(true)
      const res = await fetch(`/api/ordenes-trabajo/${orderId}/productos`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idProducto: selected.idProducto, cantidad }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "No se pudo agregar el producto")
      toast.success(data.acumulado ? `Cantidad actualizada a ${data.linea.cantidad} unidades.` : "Producto agregado a la orden.")
      setProductId("")
      setQuantity("1")
      setSearch("")
      setRevision((value) => value + 1)
      onAdded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo agregar el producto")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-primary/20 bg-popover p-3">
      <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
        <PlusCircle className="h-4 w-4" /> Agregar producto/repuesto
      </span>
      {disabledReason ? <p className="text-xs text-muted-foreground">{disabledReason}</p> : (
        <>
          {error ? (
            <div role="alert" className="text-xs text-destructive">
              {error} <Button variant="link" size="sm" onClick={() => setRevision((value) => value + 1)}>Reintentar</Button>
            </div>
          ) : (
            <>
              <Label htmlFor="order-product-search">Buscar producto por nombre o ID</Label>
              <Input id="order-product-search" value={search} onChange={(event) => { setSearch(event.target.value); setProductId("") }} disabled={loading || saving} placeholder="Buscar producto…" aria-controls="order-product-results" />
              <div id="order-product-results" className="max-h-52 space-y-1 overflow-y-auto overscroll-contain rounded-md border border-border bg-popover p-1" aria-label="Resultados de productos" aria-busy={loading}>
                {loading ? <p className="p-2 text-xs text-muted-foreground">Cargando inventario…</p> : filtered.map((product) => (
                  <Button
                    key={product.idProducto} type="button" variant={String(product.idProducto) === productId ? "secondary" : "ghost"}
                    className="h-auto w-full justify-between gap-3 whitespace-normal text-left text-xs"
                    disabled={saving || product.stockActual <= 0} aria-pressed={String(product.idProducto) === productId}
                    onClick={() => setProductId(String(product.idProducto))}
                  >
                    <span>{product.nombre} <span className="text-muted-foreground">#{product.idProducto}</span></span>
                    <span className="shrink-0 text-right">Stock: {product.stockActual}<br />{formatCLP(Number(product.precioVenta))}</span>
                  </Button>
                ))}
                {!loading && filtered.length === 0 && <p role="status" className="p-2 text-xs text-muted-foreground">No se encontraron productos.</p>}
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_90px_auto] sm:items-end">
                <div className="space-y-1">
                  <p className="text-xs font-medium">{selected ? selected.nombre : "Selecciona un producto de los resultados"}</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="order-product-quantity">Cantidad</Label>
                  <Input id="order-product-quantity" type="number" min={1} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} disabled={saving} />
                </div>
                <Button type="button" onClick={add} disabled={loading || saving || !selected}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />} Agregar
                </Button>
              </div>
              {existing && <p className="text-xs text-muted-foreground">
                Ya contiene {existing.cantidad} unidades. Al agregar {Number(quantity) || 0}, quedará con {existing.cantidad + (Number(quantity) || 0)}. Se conservan su precio y descuento unitarios.
              </p>}
              <p className="text-xs text-muted-foreground">Al agregar se guarda el cambio y se descuentan del stock solo las unidades adicionales.</p>
            </>
          )}
        </>
      )}
    </div>
  )
}
