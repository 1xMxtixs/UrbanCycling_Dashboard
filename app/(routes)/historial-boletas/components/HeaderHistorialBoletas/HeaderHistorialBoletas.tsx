"use client"

export function HeaderHistorialBoletas() {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary/80">
          Historial
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Historial de Boletas
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Consulta el historial de documentos tributarios generados desde ventas y órdenes de trabajo.
        </p>
      </div>

    </div>
  )
}
