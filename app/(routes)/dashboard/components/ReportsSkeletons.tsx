import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function FinancialSummarySkeleton() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      aria-busy="true"
      aria-label="Cargando resumen financiero"
    >
      {[...Array(3)].map((_, i) => (
        <Card key={`skeleton-summary-${i}`} className="border-border/80 bg-card p-5 space-y-3 shadow-xs">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28 rounded-md motion-reduce:animate-none" />
            <Skeleton className="h-9 w-9 rounded-xl motion-reduce:animate-none" />
          </div>
          <Skeleton className="h-8 w-36 rounded-md motion-reduce:animate-none" />
          <Skeleton className="h-3.5 w-48 rounded-md motion-reduce:animate-none" />
        </Card>
      ))}
    </div>
  )
}

export function ChartsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      aria-busy="true"
      aria-label="Cargando gráficos comparativos"
    >
      {/* Skeleton de Barras Agrupadas */}
      <Card className="border-border/80 bg-card p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48 rounded-md motion-reduce:animate-none" />
            <Skeleton className="h-3.5 w-64 rounded-md motion-reduce:animate-none" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-4 w-20 rounded-md motion-reduce:animate-none" />
            <Skeleton className="h-4 w-20 rounded-md motion-reduce:animate-none" />
          </div>
        </div>

        {/* Barras verticales simuladas */}
        <div className="h-56 pt-6 flex items-end justify-between gap-3 border-b border-border/40 pb-2 px-2">
          {[40, 75, 55, 90, 60, 80].map((h, idx) => (
            <div key={`skeleton-bar-${idx}`} className="flex-1 flex items-end justify-center gap-1.5 h-full">
              <Skeleton
                className="w-1/2 rounded-t-sm motion-reduce:animate-none"
                style={{ height: `${h}%` }}
              />
              <Skeleton
                className="w-1/2 rounded-t-sm opacity-60 motion-reduce:animate-none"
                style={{ height: `${Math.max(20, h - 25)}%` }}
              />
            </div>
          ))}
        </div>

        {/* Mini cards de resumen inferiores */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-border/50 space-y-2">
            <Skeleton className="h-3.5 w-24 rounded-md motion-reduce:animate-none" />
            <Skeleton className="h-5 w-28 rounded-md motion-reduce:animate-none" />
          </div>
          <div className="p-3 rounded-xl border border-border/50 space-y-2">
            <Skeleton className="h-3.5 w-24 rounded-md motion-reduce:animate-none" />
            <Skeleton className="h-5 w-28 rounded-md motion-reduce:animate-none" />
          </div>
        </div>
      </Card>

      {/* Skeleton de Donut Chart */}
      <Card className="border-border/80 bg-card p-6 space-y-5 shadow-xs">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-48 rounded-md motion-reduce:animate-none" />
          <Skeleton className="h-3.5 w-60 rounded-md motion-reduce:animate-none" />
        </div>

        {/* Círculo central tipo Donut con hueco */}
        <div className="h-56 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <Skeleton className="h-44 w-44 rounded-full motion-reduce:animate-none" />
            <div className="absolute h-24 w-24 rounded-full bg-card flex flex-col items-center justify-center space-y-1">
              <Skeleton className="h-3 w-10 rounded-sm motion-reduce:animate-none" />
              <Skeleton className="h-4 w-16 rounded-sm motion-reduce:animate-none" />
            </div>
          </div>
        </div>

        {/* Leyenda inferior */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {[...Array(4)].map((_, i) => (
            <div key={`skeleton-legend-${i}`} className="flex items-center justify-between p-2 rounded-lg border border-border/40">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full motion-reduce:animate-none" />
                <Skeleton className="h-3.5 w-20 rounded-md motion-reduce:animate-none" />
              </div>
              <Skeleton className="h-3.5 w-10 rounded-md motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <Card
      className="border-border/80 bg-card p-6 space-y-4 shadow-xs"
      aria-busy="true"
      aria-label="Cargando operaciones e inventario"
    >
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-44 rounded-md motion-reduce:animate-none" />
        <Skeleton className="h-8 w-28 rounded-xl motion-reduce:animate-none" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-8 w-full rounded-md bg-muted/60 motion-reduce:animate-none" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={`skeleton-table-row-${i}`} className="h-11 w-full rounded-lg motion-reduce:animate-none" />
        ))}
      </div>
    </Card>
  )
}
