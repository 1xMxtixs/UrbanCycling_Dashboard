import { type LucideIcon } from "lucide-react"

import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

interface SegmentedTabItem {
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
    <TabsList className={cn("grid h-10 w-full max-w-md grid-cols-2", className)}>
      {items.map(({ value, label, icon: Icon, count }) => (
        <TabsTrigger key={value} value={value} className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          <span>{label}</span>
          {count !== undefined && <span>({count})</span>}
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
