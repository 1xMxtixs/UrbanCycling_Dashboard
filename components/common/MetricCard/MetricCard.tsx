import { type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Mapa de colores de acento soportados.
 * Cada clave define las clases para: ícono bg/text, hover, gradiente decorativo, hover border.
 */
const accentColorMap: Record<
  string,
  {
    iconBg: string
    iconText: string
    iconHoverBg: string
    iconHoverText: string
    glow: string
    hoverBorder: string
  }
> = {
  primary: {
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    iconHoverBg: "group-hover:bg-primary",
    iconHoverText: "group-hover:text-primary-foreground",
    glow: "bg-primary/10",
    hoverBorder: "hover:border-primary/40",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-400",
    iconHoverBg: "group-hover:bg-emerald-500",
    iconHoverText: "group-hover:text-white",
    glow: "bg-emerald-500/10",
    hoverBorder: "hover:border-emerald-500/40",
  },
  cyan: {
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-600 dark:text-cyan-400",
    iconHoverBg: "group-hover:bg-cyan-500",
    iconHoverText: "group-hover:text-white",
    glow: "bg-cyan-500/10",
    hoverBorder: "hover:border-cyan-500/40",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
    iconHoverBg: "group-hover:bg-amber-500",
    iconHoverText: "group-hover:text-white",
    glow: "bg-amber-500/10",
    hoverBorder: "hover:border-amber-500/40",
  },
  teal: {
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-600 dark:text-teal-400",
    iconHoverBg: "group-hover:bg-teal-500",
    iconHoverText: "group-hover:text-white",
    glow: "bg-teal-500/10",
    hoverBorder: "hover:border-teal-500/40",
  },
  violet: {
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-600 dark:text-violet-400",
    iconHoverBg: "group-hover:bg-violet-500",
    iconHoverText: "group-hover:text-white",
    glow: "bg-violet-500/10",
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
        "group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 bg-card/90 backdrop-blur-xs border-border/80",
        colors.hoverBorder,
        className
      )}
    >
      {/* Decorative subtle ambient gradient in corner */}
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-40",
          colors.glow
        )}
      />

      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </CardTitle>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 transition-all duration-300 group-hover:scale-110 shadow-2xs",
            colors.iconBg,
            colors.iconText,
            colors.iconHoverBg,
            colors.iconHoverText
          )}
        >
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
