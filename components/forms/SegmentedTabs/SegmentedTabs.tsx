import { type LucideIcon } from "lucide-react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export interface SegmentedTabItem {
  value: string
  label: string
  icon?: LucideIcon
  count?: number
}

interface SegmentedTabsProps {
  items: SegmentedTabItem[]
  className?: string
}

export function SegmentedTabs({ items, className }: SegmentedTabsProps) {
  return (
    <TabsList
      className={cn(
        "inline-flex h-11 w-full sm:w-auto p-1 rounded-xl bg-muted/70 border border-border/80 shadow-2xs",
        className
      )}
    >
      {items.map(({ value, label, icon: Icon, count }) => (
        <TabsTrigger
          key={value}
          value={value}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 data-active:bg-background data-active:text-foreground data-active:shadow-xs data-active:border-border/60 text-muted-foreground hover:text-foreground cursor-pointer select-none"
        >
          {Icon && <Icon className="h-4 w-4 stroke-[2] shrink-0" />}
          <span>{label}</span>
          {count !== undefined && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10.5px] font-bold bg-primary/10 text-primary">
              {count}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
