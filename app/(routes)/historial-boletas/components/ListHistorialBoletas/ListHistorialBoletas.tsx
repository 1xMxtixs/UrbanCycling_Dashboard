"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  CircleDollarSign,
  Receipt,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Inbox
} from "lucide-react"

interface DocumentoTributario {
  idDocumentoTributario: number
  tipoMovimiento: string
  tipoDte: number
  numeroFolio: number
  rutEmisor: string
  rutReceptor: string
  fechaEmision: string
  montoSubtotal: number | string
  descuentoAcumulado: number | string
  montoTotal: number | string
  montoNeto: number | string
  montoIva: number | string
  estado: string
  urlPdf?: string | null
}

function formatDate(value: string) {
  const [year, month, day] = value.split("T")[0].split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatCurrency(value: number | string) {
  return Number(value || 0).toLocaleString("es-CL", {
    style: "currency",
    currency: "CLP",
  })
}

function getTipoDteLabel(tipo: number) {
  return tipo === 39 ? "Boleta" : tipo === 33 ? "Factura" : `DTE ${tipo}`
}

function getStatusTone(estado: string) {
  switch (estado.toLowerCase()) {
    case "emitido":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
    case "anulado":
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
    default:
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800"
  }
}

function normalizeDocument(raw: Record<string, unknown>): DocumentoTributario {
  return {
    idDocumentoTributario: Number(raw.idDocumentoTributario ?? 0),
    tipoMovimiento: String(raw.tipoMovimiento ?? ""),
    tipoDte: Number(raw.tipoDte ?? 0),
    numeroFolio: Number(raw.numeroFolio ?? 0),
    rutEmisor: String(raw.rutEmisor ?? ""),
    rutReceptor: String(raw.rutReceptor ?? ""),
    fechaEmision: String(raw.fechaEmision ?? raw.fechaRegistro ?? ""),
    montoSubtotal: Number(raw.montoSubtotal ?? 0),
    descuentoAcumulado: Number(raw.descuentoAcumulado ?? 0),
    montoTotal: Number(raw.montoTotal ?? 0),
    montoNeto: Number(raw.montoNeto ?? 0),
    montoIva: Number(raw.montoIva ?? 0),
    estado: String(raw.estado ?? "Emitido"),
    urlPdf: raw.urlPdf ? String(raw.urlPdf) : null,
  }
}

export function ListHistorialBoletas() {
  const [documents, setDocuments] = useState<DocumentoTributario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("todos")

  useEffect(() => {
    let mounted = true

    async function loadDocuments() {
      try {
        setLoading(true)
        setError("")

        const response = await fetch("/api/documentos-tributarios", { cache: "no-store" })

        if (!response.ok) {
          throw new Error("No fue posible cargar el historial")
        }

        const result = await response.json()

        if (mounted) {
          const apiDocuments = Array.isArray(result)
            ? result
            : Array.isArray(result?.documentosTributarios)
              ? result.documentosTributarios
              : []

          setDocuments(
            apiDocuments.map((item: unknown) => normalizeDocument(item as Record<string, unknown>))
          )
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error inesperado")
          setDocuments([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadDocuments()

    return () => {
      mounted = false
    }
  }, [])

  const boletas = useMemo(() => documents.filter((doc) => doc.tipoDte === 39), [documents])

  const summary = useMemo(() => {
    const total = boletas.reduce((acc, item) => acc + Number(item.montoTotal || 0), 0)
    const emitidos = boletas.filter((item) => item.estado.toLowerCase() === "emitido").length

    return { total, emitidos }
  }, [boletas])

  const filteredDocuments = useMemo(() => {
    return boletas.filter((doc) => {
      const matchesSearch = 
        doc.numeroFolio.toString().includes(searchTerm) || 
        doc.rutReceptor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.rutEmisor.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === "todos" || doc.estado.toLowerCase() === filterStatus.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [boletas, searchTerm, filterStatus])

  const handleExportCSV = () => {
    if (filteredDocuments.length === 0) return

    const headers = "Tipo DTE,Folio,RUT Emisor,RUT Receptor,Fecha Emision,Monto Total,Estado\n"
    const rows = filteredDocuments.map(doc => 
      `${getTipoDteLabel(doc.tipoDte)},${doc.numeroFolio},${doc.rutEmisor},${doc.rutReceptor},${doc.fechaEmision},${doc.montoTotal},${doc.estado}`
    ).join("\n")

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "historial_documentos.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="space-y-6 w-full">
        <section className="animate-pulse rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-black">
          <div className="space-y-3">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-900" />
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full">
      <section className="space-y-6">
        
        <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-black">
          <div className="flex flex-row items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Resumen</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Boletas emitidas</h2>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">Monto total</p>
              <p className="mt-2 text-2xl font-black text-emerald-900 dark:text-emerald-100">{formatCurrency(summary.total)}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/80">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Emitidas</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{summary.emitidos}</p>
            </article>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-black">
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Listado</p>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Historial reciente</h2>
            </div>
            
            <button 
              onClick={handleExportCSV}
              disabled={filteredDocuments.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por RUT o Folio..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:focus:border-primary"
              />
            </div>
            <div className="relative w-full sm:w-48 shrink-0">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="emitido">Emitidos</option>
                <option value="anulado">Anulados</option>
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200">{error}</div>
            ) : filteredDocuments.length === 0 ? (
              
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/60">
                <div className="rounded-full bg-slate-200/50 p-4 dark:bg-slate-800/50">
                  <Inbox className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No hay resultados</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {boletas.length === 0 
                    ? "Aún no tienes boletas registradas en el sistema." 
                    : "No se encontraron boletas que coincidan con tu búsqueda."}
                </p>
              </div>

            ) : (
              filteredDocuments.map((doc) => (
                <article
                  key={doc.idDocumentoTributario}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary">{getTipoDteLabel(doc.tipoDte)}</span>
                        <span className={`whitespace-nowrap inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${getStatusTone(doc.estado)}`}>{doc.estado}</span>
                        <span className="whitespace-nowrap text-xs text-slate-500">Folio #{doc.numeroFolio}</span>
                      </div>
                      <h3 className="wrap-break-word text-lg font-black text-slate-900 dark:text-white">{doc.tipoMovimiento}</h3>
                      <p className="wrap-break-word text-sm text-slate-500">Emisor: <span className="font-medium text-slate-700 dark:text-slate-300">{doc.rutEmisor}</span> · Receptor: <span className="font-medium text-slate-700 dark:text-slate-300">{doc.rutReceptor}</span></p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
                      <span className="inline-flex whitespace-nowrap items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300"><CalendarDays className="h-4 w-4 shrink-0" /> {formatDate(doc.fechaEmision)}</span>
                      <span className="inline-flex whitespace-nowrap items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-900 dark:bg-slate-800 dark:text-white"><CircleDollarSign className="h-4 w-4 shrink-0 text-slate-500" /> {formatCurrency(doc.montoTotal)}</span>
                      
                      <div className="hidden h-8 w-px bg-slate-200 lg:block dark:bg-slate-700"></div>

                      <div className="flex items-center gap-1">
                        <button title="Ver detalles" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button title="Enviar por correo" className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800">
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>

                    </div>

                  </div>
                </article>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  )
}