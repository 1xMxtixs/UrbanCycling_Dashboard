"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, LoaderCircle, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { PurchaseOrder } from "./OrdenesCompra"

type Provider = { idProveedor: number; razonSocial: string; nombreFantasia?: string | null; rut: string }
type Product = { idProducto: number; nombre: string; tipoProducto: string; costoPromedio: number | string; estado: string }
type Line = { idProducto: number; cantidadOrdenada: number; precioCostoUnitario: number }

const localISODate = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

export function CreatePurchaseOrderForm({ onCreated, onCancel }: { onCreated: (order: PurchaseOrder) => void; onCancel: () => void }) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [providerId, setProviderId] = useState("")
  const [emissionDate, setEmissionDate] = useState(localISODate)
  const [deliveryDate, setDeliveryDate] = useState(localISODate)
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unitCost, setUnitCost] = useState("")
  const [lines, setLines] = useState<Line[]>([])
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setLoadError("")
      try {
        const [providerResponse, productResponse] = await Promise.all([
          fetch("/api/ordenes-compra/proveedores", { cache: "no-store" }),
          fetch("/api/inventory", { cache: "no-store" }),
        ])
        const [providerData, productData] = await Promise.all([
          providerResponse.json().catch(() => null),
          productResponse.json().catch(() => null),
        ])
        if (!providerResponse.ok && providerResponse.status !== 422) throw new Error(providerData?.message || "No fue posible cargar los proveedores.")
        if (!productResponse.ok) throw new Error(productData?.message || "No fue posible cargar los productos.")
        if (!cancelled) {
          setProviders(providerData?.providers ?? [])
          setProducts((Array.isArray(productData) ? productData : []).filter((product: Product) => product.estado === "ACTIVO"))
        }
      } catch (cause) {
        if (!cancelled) setLoadError(cause instanceof Error ? cause.message : "No fue posible cargar los datos de la orden.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    const timer = window.setTimeout(() => void load(), 0)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [])

  const availableProducts = useMemo(() => products.filter((product) => !lines.some((line) => line.idProducto === product.idProducto)), [products, lines])
  const total = lines.reduce((sum, line) => sum + line.cantidadOrdenada * line.precioCostoUnitario, 0)

  const addLine = () => {
    const product = products.find((item) => item.idProducto === Number(productId))
    const parsedQuantity = Number(quantity)
    const parsedCost = Number(unitCost)
    if (!product || !Number.isSafeInteger(parsedQuantity) || parsedQuantity <= 0 || !Number.isFinite(parsedCost) || parsedCost < 0) {
      setError("Selecciona un producto e ingresa una cantidad y costo unitario válidos.")
      return
    }
    setLines((current) => [...current, { idProducto: product.idProducto, cantidadOrdenada: parsedQuantity, precioCostoUnitario: parsedCost }])
    setProductId("")
    setQuantity("1")
    setUnitCost("")
    setError("")
  }

  const handleProductChange = (value: string) => {
    setProductId(value)
    const product = products.find((item) => item.idProducto === Number(value))
    setUnitCost(product ? String(Number(product.costoPromedio)) : "")
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    if (!providerId || lines.length === 0 || !emissionDate || !deliveryDate) {
      setError("Completa el proveedor, agrega al menos un producto e ingresa ambas fechas.")
      return
    }
    if (deliveryDate < emissionDate) {
      setError("La fecha estimada de entrega no puede ser anterior a la fecha de emisión.")
      return
    }
    setIsSaving(true)
    try {
      const response = await fetch("/api/ordenes-compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idProveedor: Number(providerId), fechaEmision: emissionDate, fechaEntregaEstimada: deliveryDate, productos: lines }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || "No fue posible registrar la orden de compra.")
      onCreated({ ...result.purchaseOrder, _count: { lineas: lines.length } })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible registrar la orden de compra.")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <div className="space-y-3 py-2" aria-busy="true"><Skeleton className="h-10" /><Skeleton className="h-24" /><Skeleton className="h-40" /></div>
  if (loadError) return <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{loadError}</div>
  if (providers.length === 0) return <div className="space-y-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-5"><div className="flex gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-semibold">No hay proveedores activos</p><p className="mt-1 text-sm text-muted-foreground">Registra o activa un proveedor antes de crear una orden de compra.</p></div></div><Button asChild><Link href="/proveedores">Ir a Proveedores</Link></Button></div>

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-1"><Label htmlFor="purchase-provider">Proveedor <span className="text-destructive">*</span></Label><Select value={providerId} onValueChange={setProviderId}><SelectTrigger id="purchase-provider"><SelectValue placeholder="Selecciona proveedor" /></SelectTrigger><SelectContent>{providers.map((provider) => <SelectItem key={provider.idProveedor} value={String(provider.idProveedor)}>{provider.razonSocial}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label htmlFor="emission-date">Fecha de emisión <span className="text-destructive">*</span></Label><Input id="emission-date" type="date" required value={emissionDate} onChange={(event) => setEmissionDate(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="delivery-date">Entrega estimada <span className="text-destructive">*</span></Label><Input id="delivery-date" type="date" min={emissionDate} required value={deliveryDate} onChange={(event) => setDeliveryDate(event.target.value)} /></div>
      </div>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <div><h3 className="font-semibold">Productos de la orden</h3><p className="text-sm text-muted-foreground">Solo se muestran productos activos; cada producto se agrega una vez.</p></div>
        {products.length === 0 ? <p className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">No hay productos activos disponibles en el inventario.</p> : (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_150px_auto] sm:items-end">
            <div className="space-y-2"><Label>Producto</Label><Select value={productId} onValueChange={handleProductChange}><SelectTrigger><SelectValue placeholder="Selecciona un producto" /></SelectTrigger><SelectContent>{availableProducts.map((product) => <SelectItem key={product.idProducto} value={String(product.idProducto)}>#{product.idProducto} · {product.nombre}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="purchase-quantity">Cantidad</Label><Input id="purchase-quantity" type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="purchase-unit-cost">Costo unitario (CLP)</Label><Input id="purchase-unit-cost" type="number" min="0" step="1" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} /></div>
            <Button type="button" variant="outline" onClick={addLine} disabled={!productId}><Plus className="mr-1.5 h-4 w-4" />Agregar</Button>
          </div>
        )}
        {lines.length > 0 && <div className="divide-y divide-border/60 rounded-lg border border-border/70">{lines.map((line) => { const product = products.find((item) => item.idProducto === line.idProducto)!; return <div key={line.idProducto} className="flex flex-wrap items-center gap-3 px-3 py-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.nombre}</p><p className="text-xs text-muted-foreground">{line.cantidadOrdenada} × ${line.precioCostoUnitario.toLocaleString("es-CL")}</p></div><span className="text-sm font-semibold">${(line.cantidadOrdenada * line.precioCostoUnitario).toLocaleString("es-CL")}</span><Button type="button" size="icon" variant="ghost" aria-label={`Quitar ${product.nombre}`} onClick={() => setLines((current) => current.filter((item) => item.idProducto !== line.idProducto))}><Trash2 className="h-4 w-4 text-destructive" /></Button></div> })}</div>}
        <div className="flex justify-end border-t border-border/60 pt-3 text-sm">Total estimado: <strong className="ml-2">${total.toLocaleString("es-CL")} CLP</strong></div>
      </section>

      {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
      <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>Cancelar</Button><Button type="submit" disabled={isSaving || !products.length}>{isSaving ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Guardando borrador…</> : "Crear orden en borrador"}</Button></div>
    </form>
  )
}
