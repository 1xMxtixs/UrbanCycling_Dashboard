"use client"

import React from "react"
import { Download, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import type { SupplyConsumptionItem } from "../types"

interface SupplyConsumptionTableProps {
  supplies: SupplyConsumptionItem[]
  dateRange: { from: string; to: string }
}

export function SupplyConsumptionTable({
  supplies,
  dateRange,
}: SupplyConsumptionTableProps) {
  const handleExportCSV = () => {
    if (supplies.length === 0) return

    const headers = "Codigo,Insumo,Categoria,Cantidad Utilizada,Unidad,Ordenes Asociadas,Costo Estimado CLP\n"
    const rows = supplies
      .map(
        (item) =>
          `"${item.code}","${item.name}","${item.category}",${item.quantityUsed},"${item.unit}",${item.associatedOrdersCount},${item.estimatedCost}`
      )
      .join("\n")

    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `consumo_insumos_${dateRange.from}_a_${dateRange.to}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (supplies.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Wrench}
          title="Sin consumo de insumos"
          description="No se han registrado consumos de insumos ni repuestos en órdenes de trabajo para este rango de fecha."
          className="min-h-[260px]"
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Botón de Exportar en barra de utilidades */}
      <div className="px-6 pt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Mostrando <strong className="font-semibold text-foreground">{supplies.length}</strong> insumos utilizados en reparaciones
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="rounded-xl font-semibold gap-1.5 h-8.5 text-xs border-border/80 hover:bg-muted cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar CSV</span>
        </Button>
      </div>

      <div className="overflow-x-auto selection:bg-amber-500/15">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border/70">
            <TableRow>
              <TableHead className="w-24 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Código
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Insumo / Repuesto
              </TableHead>
              <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Categoría
              </TableHead>
              <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Cantidad Usada
              </TableHead>
              <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Órdenes Asociadas
              </TableHead>
              <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Costo Total Est.
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplies.map((item) => (
              <TableRow
                key={item.id}
                className="relative hover:bg-muted/40 transition-colors border-b border-border/50 text-xs group"
              >
                <TableCell className="font-mono font-semibold text-muted-foreground relative">
                  {/* Línea lateral de acento ámbar en hover */}
                  <div className="absolute left-0 top-1 bottom-1 w-1 bg-amber-500 rounded-r opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <span className="group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {item.code}
                  </span>
                </TableCell>

                <TableCell className="font-semibold text-foreground">
                  <span className="group-hover:text-foreground transition-colors">{item.name}</span>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  <span className="px-2 py-0.5 rounded-md bg-muted/60 text-[11px] font-medium border border-border/60">
                    {item.category}
                  </span>
                </TableCell>

                <TableCell className="text-right font-bold text-foreground">
                  {item.quantityUsed} {item.unit}
                </TableCell>

                <TableCell className="text-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                    {item.associatedOrdersCount} ODT
                  </span>
                </TableCell>

                <TableCell className="text-right font-black text-foreground">
                  {formatCLP(item.estimatedCost)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
