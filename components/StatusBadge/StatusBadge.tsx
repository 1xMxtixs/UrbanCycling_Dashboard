import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"

interface StatusBadgeProps {
  status: StatusType | string
  label?: string
  className?: string
}

const statusStyles: Record<StatusType, string> = {
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  info: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200 dark:border-sky-800",
  neutral: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const normalizedStatus = (statusStyles[status as StatusType] ? status : "neutral") as StatusType
  const displayLabel = label || status

  return (
    <Badge
      variant="outline"
      className={cn("font-medium transition-colors", statusStyles[normalizedStatus], className)}
    >
      {displayLabel}
    </Badge>
  )
}
