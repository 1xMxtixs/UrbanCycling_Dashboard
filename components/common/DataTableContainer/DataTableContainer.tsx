import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableContainerProps {
  title?: string
  description?: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  toolbar?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function DataTableContainer({
  title,
  description,
  searchPlaceholder = "Buscar en la tabla...",
  searchValue,
  onSearchChange,
  toolbar,
  actions,
  children,
  footer,
  className,
}: DataTableContainerProps) {
  return (
    <Card className={cn("overflow-hidden border border-border/80 bg-card shadow-xs transition-all", className)}>
      {(title || description || onSearchChange || actions || toolbar) && (
        <CardHeader className="space-y-4 p-5 md:p-6 border-b border-border/60 bg-muted/15">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {(title || description) && (
              <div>
                {title && (
                  <CardTitle className="text-lg md:text-xl font-bold tracking-tight text-foreground">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className="mt-1 text-xs md:text-sm text-muted-foreground">
                    {description}
                  </CardDescription>
                )}
              </div>
            )}
            {actions && <div className="flex items-center gap-2.5 flex-wrap sm:shrink-0">{actions}</div>}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            {onSearchChange && (
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue ?? ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-9.5 pl-10 pr-3 rounded-xl bg-background border-border/80 text-xs md:text-sm shadow-2xs focus-visible:ring-primary/30"
                />
              </div>
            )}

            {toolbar && <div className="w-full">{toolbar}</div>}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto selection:bg-primary/15">{children}</div>
      </CardContent>

      {footer && (
        <div className="p-4 md:px-6 border-t border-border/60 bg-muted/10 flex items-center justify-between text-xs md:text-sm text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  )
}
