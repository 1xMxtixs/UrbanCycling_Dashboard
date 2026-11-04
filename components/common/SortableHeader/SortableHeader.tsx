"use client"

import type { ReactNode } from "react"
import type { Column } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SortableHeader<TData, TValue>({
  column,
  children,
}: {
  column: Column<TData, TValue>
  children: ReactNode
}) {
  return (
    <Button
      variant="ghost"
      className="h-auto cursor-pointer p-0 text-xs font-bold uppercase tracking-wider text-muted-foreground/80 hover:bg-transparent hover:text-foreground"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDown aria-hidden="true" className="ml-1.5 h-3.5 w-3.5 opacity-60" />
    </Button>
  )
}
