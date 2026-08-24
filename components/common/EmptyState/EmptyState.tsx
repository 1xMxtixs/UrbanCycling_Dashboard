import React from "react"
import { LucideIcon, FolderSearch } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center min-h-[280px] border border-dashed border-border/80 rounded-2xl bg-muted/20 backdrop-blur-2xs transition-all",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-xs">
        <Icon className="h-7 w-7 stroke-[1.8]" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1.5 mb-5 font-normal leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
