"use client"

import * as React from "react"
import { ChevronDown, Receipt } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { DataTable } from "@/components/reportes/data-table"
import { todaySalesColumns, type TodaySale } from "@/components/reportes/today-sales-columns"

interface TodaySalesDetailProps {
  sales: TodaySale[]
}

export function TodaySalesDetail({ sales }: TodaySalesDetailProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/80 bg-card shadow-xs">
        <CollapsibleTrigger asChild>
          <CardHeader className="flex cursor-pointer flex-row items-center justify-between py-3 select-none">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Detalle de ventas de hoy</span>
              <span className="text-xs text-muted-foreground">({sales.length})</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <CardContent className="pt-0 pb-4">
            {sales.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hubo ventas registradas en la jornada de hoy.
              </p>
            ) : (
              <DataTable
                columns={todaySalesColumns}
                data={sales}
                emptyMessage="No hubo ventas registradas en la jornada de hoy."
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
