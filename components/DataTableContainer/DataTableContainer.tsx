import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

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
}

export function DataTableContainer({
  title,
  description,
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  toolbar,
  actions,
  children,
  footer,
}: DataTableContainerProps) {
  return (
    <Card className="shadow-sm">
      {(title || description || onSearchChange || actions || toolbar) && (
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {(title || description) && (
              <div>
                {title && <CardTitle className="text-xl">{title}</CardTitle>}
                {description && <CardDescription className="mt-1">{description}</CardDescription>}
              </div>
            )}
            {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
          </div>

          {onSearchChange && (
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue ?? ""}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {toolbar}
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">{children}</div>
      </CardContent>

      {footer && <div className="p-4 border-t flex items-center justify-between">{footer}</div>}
    </Card>
  )
}
