import { Skeleton } from "@/components/ui/skeleton"

export default function ClientesLoading() {
  return (
    <div className="min-h-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  )
}

