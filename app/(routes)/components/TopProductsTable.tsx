"use client"

import React from "react"
import { Package } from "lucide-react"
import { EmptyState } from "@/components/common/EmptyState"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCLP } from "@/lib/formatters"
import type { TopProductItem } from "../types"

interface TopProductsTableProps {
  products: TopProductItem[]
}

export function TopProductsTable({ products }: TopProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Package}
          title="Sin productos destacados"
          description="No se registraron ventas ni salidas de productos en el inventario durante el período seleccionado."
          className="min-h-[260px]"
        />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto selection:bg-primary/15">
      <Table>
        <TableHeader className="bg-muted/40 border-b border-border/70">
          <TableRow>
            <TableHead className="w-16 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              #
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Producto / Repuesto
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Categoría
            </TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Unidades Vendidas/Usadas
            </TableHead>
            <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Recaudado
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((item) => (
            <TableRow
              key={item.id}
              className="relative hover:bg-muted/40 transition-colors border-b border-border/50 text-xs group"
            >
              {/* Badge circular numerado consistente (1-5) */}
              <TableCell className="text-center font-bold relative">
                {/* Indicador de acento lateral en hover */}
                <div className="absolute left-0 top-1 bottom-1 w-1 bg-primary rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted/80 text-foreground font-bold text-xs border border-border/80 group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                  {item.ranking}
                </span>
              </TableCell>

              <TableCell className="font-semibold text-foreground">
                <div className="flex flex-col">
                  <span className="group-hover:text-primary transition-colors">{item.name}</span>
                  {item.sku && (
                    <span className="text-[11px] font-normal text-muted-foreground/80 font-mono mt-0.5">
                      SKU: {item.sku}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="text-muted-foreground">
                <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium border border-border/60">
                  {item.category ?? "General"}
                </span>
              </TableCell>

              <TableCell className="text-right font-bold text-foreground">
                {item.quantitySold} unidades
              </TableCell>

              <TableCell className="text-right font-black text-foreground">
                {formatCLP(item.totalRevenue)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
