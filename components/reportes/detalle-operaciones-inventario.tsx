"use client"

import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

import { DataTable } from "./data-table"
import { productosDestacadosColumns, type ProductoDestacado } from "./productos-destacados-columns"
import { consumoInsumosColumns, type ConsumoInsumo } from "./consumo-insumos-columns"

interface DetalleOperacionesInventarioProps {
  productosDestacados: ProductoDestacado[]
  consumoInsumos: ConsumoInsumo[]
  onExportCSV: () => void
}

export function DetalleOperacionesInventario({
  productosDestacados,
  consumoInsumos,
  onExportCSV,
}: DetalleOperacionesInventarioProps) {
  const [activeTab, setActiveTab] = React.useState("destacados")

  return (
    <Card>
      <CardHeader className="border-b py-5">
        <CardTitle className="text-base">
          Productos y Repuestos Destacados
        </CardTitle>
        <CardDescription>
          Artículos con mayor demanda y consumo en el período seleccionado
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 sm:pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList variant="line">
              <TabsTrigger value="destacados">
                Productos Destacados
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({productosDestacados.length})
                </span>
              </TabsTrigger>
              <TabsTrigger value="insumos">
                Consumo de Insumos
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({consumoInsumos.length})
                </span>
              </TabsTrigger>
            </TabsList>

            {activeTab === "insumos" && (
              <Button variant="outline" size="sm" onClick={onExportCSV}>
                <Download className="h-3.5 w-3.5" />
                Exportar CSV
              </Button>
            )}
          </div>

          <TabsContent
            value="destacados"
            className="mt-4 animate-in fade-in-0 duration-200"
          >
            <DataTable
              columns={productosDestacadosColumns}
              data={productosDestacados}
              emptyMessage="No hay productos destacados en este período."
            />
          </TabsContent>

          <TabsContent
            value="insumos"
            className="mt-4 animate-in fade-in-0 duration-200"
          >
            <DataTable
              columns={consumoInsumosColumns}
              data={consumoInsumos}
              emptyMessage="No hay consumo de insumos en este período."
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
