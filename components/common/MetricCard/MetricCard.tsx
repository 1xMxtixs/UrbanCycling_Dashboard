import { type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Mapa de colores de acento semánticos para el icono y borde al interactuar.
 */
const accentColorMap: Record<
  string,
  {
    iconBg: string
    iconText: string
    iconHoverBg: string
    iconHoverText: string
    hoverBorder: string
  }
> = {
  primary: {
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    iconHoverBg: "group-hover:bg-primary",
    iconHoverText: "group-hover:text-primary-foreground",
    hoverBorder: "hover:border-primary/40",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-700 dark:text-emerald-300",
    iconHoverBg: "group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500",
    iconHoverText: "group-hover:text-white",
    hoverBorder: "hover:border-emerald-500/40",
  },
  cyan: {
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-700 dark:text-cyan-300",
    iconHoverBg: "group-hover:bg-cyan-600 dark:group-hover:bg-cyan-500",
    iconHoverText: "group-hover:text-white",
    hoverBorder: "hover:border-cyan-500/40",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-700 dark:text-amber-300",
    iconHoverBg: "group-hover:bg-amber-600 dark:group-hover:bg-amber-500",
    iconHoverText: "group-hover:text-white",
    hoverBorder: "hover:border-amber-500/40",
  },
  teal: {
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-700 dark:text-teal-300",
    iconHoverBg: "group-hover:bg-teal-600 dark:group-hover:bg-teal-500",
    iconHoverText: "group-hover:text-white",
    hoverBorder: "hover:border-teal-500/40",
  },
  violet: {
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-700 dark:text-violet-300",
    iconHoverBg: "group-hover:bg-violet-600 dark:group-hover:bg-violet-500",
    iconHoverText: "group-hover:text-white",
    hoverBorder: "hover:border-violet-500/40",
  },
}

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: string
    isPositive?: boolean
  }
  /** Color de acento para ícono y decoración. Default: "primary" */
  accentColor?: keyof typeof accentColorMap
  className?: string
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  accentColor = "primary",
  className,
}: MetricCardProps) {
  const colors = accentColorMap[accentColor] ?? accentColorMap.primary

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-sm bg-card border-border/80",
        colors.hoverBorder,
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-semibold text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 transition-colors duration-200 shadow-2xs",
            colors.iconBg,
            colors.iconText,
            colors.iconHoverBg,
            colors.iconHoverText
          )}
        >
          <Icon className="h-4 w-4 stroke-[2]" />
        </div>
      </CardHeader>

      <CardContent className="space-y-1 pt-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
            {value}
          </p>
          {trend && (
            <span
              className={cn(
                "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border",
                trend.isPositive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
              )}
            >
              {trend.value}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground leading-normal">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
