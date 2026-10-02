"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Building2, ClipboardList, Package, Search, ShoppingBag, User, Wrench } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { SearchCliente, SearchProduct, SearchResults, SearchSale, SearchService, SearchStatus, SearchWorkOrder } from "@/types/search"

type Props = { query: string; results: SearchResults; status: SearchStatus; hasResults: boolean; onClose: () => void }
type Result = SearchProduct | SearchService | SearchCliente | SearchWorkOrder | SearchSale

const formatCLP = (value: number | string) => `$${Number(value || 0).toLocaleString("es-CL")}`

function Highlight({ value, query }: { value: string; query: string }) {
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  if (!escaped) return value
  const parts = value.split(new RegExp(`(${escaped})`, "ig"))
  return <>{parts.map((part, index) => part.toLocaleLowerCase("es-CL") === query.trim().toLocaleLowerCase("es-CL") ? <mark key={index} className="bg-primary/15 text-inherit">{part}</mark> : part)}</>
}

function ResultItem({ icon: Icon, tone, title, subtitle, query, onClick }: { icon: typeof Package; tone: string; title: string; subtitle: string; query: string; onClick: () => void }) {
  return <button type="button" data-search-result onClick={onClick} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", tone)}><Icon className="h-4 w-4" /></span>
    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-foreground"><Highlight value={title} query={query} /></span><span className="block truncate text-xs text-muted-foreground"><Highlight value={subtitle} query={query} /></span></span>
  </button>
}

function Section({ title, items, children, onViewAll }: { title: string; items: Result[]; children: React.ReactNode; onViewAll: () => void }) {
  if (!items.length) return null
  return <section className="pb-1 pt-1"><p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{title} <span className="normal-case tracking-normal">({items.length})</span></p><div className="space-y-0.5 px-1">{children}</div><button type="button" onClick={onViewAll} className="mx-2 mt-1 flex w-[calc(100%-1rem)] rounded-lg px-2 py-2 text-left text-xs font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Ver todos los resultados en {title}</button></section>
}

function Loading() { return <div className="space-y-1 p-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="flex gap-3 px-3 py-2.5"><Skeleton className="h-9 w-9 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-2.5 w-1/2" /></div></div>)}</div> }

export function TransversalSearchDropdown({ query, results, status, hasResults, onClose }: Props) {
  const router = useRouter()
  const go = useCallback((href: string) => { onClose(); router.push(href) }, [onClose, router])

  return <div id="navbar-search-results" role="listbox" aria-label="Resultados de búsqueda" className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[480px] overflow-y-auto rounded-xl border border-border/80 bg-card shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none">
    {status === "idle" && <div className="px-4 py-4 text-xs text-muted-foreground">Sigue escribiendo: usa al menos 2 caracteres para buscar.</div>}
    {status === "loading" && <Loading />}
    {status === "error" && <div className="px-4 py-5 text-xs text-destructive">No fue posible cargar los resultados. Inténtalo nuevamente.</div>}
    {status === "success" && !hasResults && <div className="flex flex-col items-center gap-2 px-4 py-6 text-center"><Search className="h-5 w-5 text-muted-foreground" /><p className="text-sm font-medium">Sin resultados para “{query}”</p><p className="text-xs text-muted-foreground">Prueba con un nombre, RUT, código o número de operación.</p></div>}
    {status === "success" && hasResults && <div className="divide-y divide-border/40 py-1.5">
      <Section title="Clientes" items={results.clientes} onViewAll={() => go(`/clientes/directorio?search=${encodeURIComponent(query)}`)}>{results.clientes.map((c) => <ResultItem key={c.idCliente} icon={["juridica", "juridico"].includes(c.tipoCliente.toLowerCase()) ? Building2 : User} tone="border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400" title={c.nombreCompleto} subtitle={`${c.rut}${c.telefono ? ` · ${c.telefono}` : ""}`} query={query} onClick={() => go(`/clientes/directorio?clienteId=${c.idCliente}`)} />)}</Section>
      <Section title="Órdenes de trabajo" items={results.ordenes} onViewAll={() => go(`/punto-ventas/ordenes-trabajo?search=${encodeURIComponent(query)}`)}>{results.ordenes.map((o) => <ResultItem key={o.idOrdenDeTrabajo} icon={ClipboardList} tone="border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400" title={`OT #${o.idOrdenDeTrabajo} · ${o.clienteNombre}`} subtitle={`${o.bicicletaResumen ? `${o.bicicletaResumen} · ` : ""}${formatCLP(o.total)}`} query={query} onClick={() => go(`/punto-ventas/ordenes-trabajo?ordenId=${o.idOrdenDeTrabajo}`)} />)}</Section>
      <Section title="Ventas" items={results.ventas} onViewAll={() => go(`/punto-ventas/ventas?search=${encodeURIComponent(query)}`)}>{results.ventas.map((s) => <ResultItem key={s.idVenta} icon={ShoppingBag} tone="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" title={`Venta #${s.idVenta} · ${s.clienteNombre}`} subtitle={`${formatCLP(s.total)} · ${s.estadoPago.replace(/_/g, " ")}`} query={query} onClick={() => go(`/punto-ventas/ventas?ventaId=${s.idVenta}`)} />)}</Section>
      <Section title="Productos" items={results.productos} onViewAll={() => go(`/inventory/productos?search=${encodeURIComponent(query)}`)}>{results.productos.map((p) => <ResultItem key={p.idProducto} icon={Package} tone="border-border/60 bg-muted/40 text-muted-foreground" title={p.nombre} subtitle={`${p.tipoProducto} · ${formatCLP(p.precioVenta)} · Stock: ${p.stockActual}`} query={query} onClick={() => go(`/inventory/productos?productId=${p.idProducto}`)} />)}</Section>
      <Section title="Servicios" items={results.servicios} onViewAll={() => go(`/inventory/servicios?search=${encodeURIComponent(query)}`)}>{results.servicios.map((s) => <ResultItem key={s.idServicio} icon={Wrench} tone="border-primary/20 bg-primary/10 text-primary" title={s.nombre} subtitle={`${s.codigo} · ${formatCLP(s.precioVenta)}`} query={query} onClick={() => go(`/inventory/servicios?serviceId=${s.idServicio}`)} />)}</Section>
    </div>}
  </div>
}
