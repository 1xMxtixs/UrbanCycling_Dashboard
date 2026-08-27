import { type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive?: boolean
  }
  className?: string
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/40 bg-card/90 backdrop-blur-xs border-border/80",
        className
      )}
    >
      {/* Decorative subtle ambient gradient in corner */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-40" />

      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground shadow-2xs">
          <Icon className="h-4.5 w-4.5 stroke-[2]" />
        </div>
      </CardHeader>

      <CardContent className="space-y-1 pt-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border",
                trend.isPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs font-medium text-muted-foreground/90 leading-tight">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
