"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, LoaderCircle, Package, Search, Truck } from "lucide-react"

import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

type Product = {
  idProducto: number
  nombre: string
  tipoProducto: string
  stockActual: number
  codigoProveedor?: string | null
}

export function AsociarProveedor() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [supplierCode, setSupplierCode] = useState("")
  const [validationError, setValidationError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [success, setSuccess] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setLoadError("")
    try {
      const response = await fetch("/api/inventory", { cache: "no-store" })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.message || "No fue posible cargar los productos.")
      }
      setProducts(Array.isArray(result) ? result : result?.products ?? [])
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No fue posible cargar los productos.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadProducts()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [loadProducts])

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    if (!normalized) return products
    return products.filter((product) =>
      `${product.idProducto} ${product.nombre} ${product.tipoProducto}`.toLocaleLowerCase().includes(normalized),
    )
  }, [products, query])

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidationError("")
    setSubmitError("")
    setSuccess("")

    const code = supplierCode.trim()
    if (selectedId === null) {
      setValidationError("Selecciona un producto para continuar.")
      return
    }
    if (!code) {
      setValidationError("El código de proveedor es obligatorio.")
      return
    }
    if (code.length > 50) {
      setValidationError("El código no puede superar los 50 caracteres.")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/inventory/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigoProveedor: code }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(result?.message || "No se pudo asociar el código al producto.")
      }

      setProducts((current) => current.map((product) =>
        product.idProducto === selectedId ? { ...product, codigoProveedor: code } : product,
      ))
      setSuccess(`Código asociado correctamente a ${products.find((product) => product.idProducto === selectedId)?.nombre ?? "el producto"}.`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo asociar el código al producto.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Asociar proveedor"
        description="Consulta el inventario y registra el código de proveedor correspondiente a un producto."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Productos del inventario</h2>
              <p className="mt-1 text-sm text-muted-foreground">Selecciona el producto al que asignarás un código.</p>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar producto o ID" className="pl-9" aria-label="Buscar productos" />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3 p-5" aria-label="Cargando productos" aria-busy="true">
              {[...Array(4)].map((_, index) => <Skeleton key={index} className="h-16 rounded-lg" />)}
            </div>
          ) : loadError ? (
            <div role="alert" className="m-5 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">{loadError}<Button variant="outline" size="sm" className="mt-3 block" onClick={() => void loadProducts()}>Reintentar</Button></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <Package className="mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="font-medium">No se encontraron productos</p>
              <p className="mt-1 text-sm text-muted-foreground">Prueba con otro nombre o identificador.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {filteredProducts.map((product) => {
                const selected = selectedId === product.idProducto
                return (
                  <li key={product.idProducto}>
                    <button type="button" onClick={() => { setSelectedId(product.idProducto); setSuccess(""); setSubmitError("") }} aria-pressed={selected} className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50 ${selected ? "bg-primary/5" : ""}`}>
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><Package className="h-5 w-5" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{product.nombre}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">#{product.idProducto} · {product.tipoProducto} · Stock: {product.stockActual}</span>
                      </span>
                      {product.codigoProveedor && <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground sm:inline">Código: {product.codigoProveedor}</span>}
                      {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="h-fit rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Truck className="h-5 w-5" /></span>
            <div><h2 className="font-semibold">Código de proveedor</h2><p className="text-sm text-muted-foreground">Campo obligatorio</p></div>
          </div>
          <form onSubmit={handleSave} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-code">Código <span className="text-destructive">*</span></Label>
              <Input id="supplier-code" value={supplierCode} onChange={(event) => { setSupplierCode(event.target.value.slice(0, 50)); setValidationError(""); setSuccess(""); setSubmitError("") }} maxLength={50} required aria-invalid={Boolean(validationError)} aria-describedby="supplier-code-help supplier-code-count" placeholder="Ingresa el código del proveedor" disabled={isSaving} />
              <div className="flex justify-between gap-3 text-xs text-muted-foreground"><span id="supplier-code-help">Máximo 50 caracteres.</span><span id="supplier-code-count">{supplierCode.length}/50</span></div>
            </div>

            {validationError && <p role="alert" className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="h-4 w-4 shrink-0" />{validationError}</p>}
            {submitError && <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{submitError}</div>}
            {success && <div role="status" className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</div>}

            <Button type="submit" className="w-full" disabled={isSaving || isLoading || Boolean(loadError)}>
              {isSaving ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Asociando código…</> : "Asociar código"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Selecciona un producto y escribe el código entregado por el proveedor.</p>
          </form>
        </section>
      </div>
    </div>
  )
}
