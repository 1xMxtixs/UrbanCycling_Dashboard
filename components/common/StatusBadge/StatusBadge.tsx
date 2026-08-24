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
  showDot?: boolean
}

const statusConfig: Record<StatusType, { badge: string; dot: string }> = {
  success: {
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/15",
    dot: "bg-emerald-500",
  },
  warning: {
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/15",
    dot: "bg-amber-500",
  },
  danger: {
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25 hover:bg-rose-500/15",
    dot: "bg-rose-500",
  },
  info: {
    badge: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25 hover:bg-cyan-500/15",
    dot: "bg-cyan-500",
  },
  neutral: {
    badge: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20 hover:bg-slate-500/15",
    dot: "bg-slate-400",
  },
}

export function StatusBadge({ status, label, className, showDot = true }: StatusBadgeProps) {
  const normalizedStatus = (statusConfig[status as StatusType] ? status : "neutral") as StatusType
  const config = statusConfig[normalizedStatus]
  const displayLabel = label || status

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full border transition-all duration-200 shadow-2xs select-none",
        config.badge,
        className
      )}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0 animate-pulse", config.dot)} />
      )}
      <span>{displayLabel}</span>
    </Badge>
  )
}
