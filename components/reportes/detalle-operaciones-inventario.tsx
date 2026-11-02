"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

import { DataTable } from "./data-table"
import { productosDestacadosColumns, type ProductoDestacado } from "./productos-destacados-columns"
import { consumoInsumosColumns, type ConsumoInsumo } from "./consumo-insumos-columns"

export interface DetalleOperacionesInventarioProps {
  productosDestacados: ProductoDestacado[]
  consumoInsumos: ConsumoInsumo[]
  onExportProductsCSV: () => void
  onExportCSV: () => void
}

export function DetalleOperacionesInventario({
  productosDestacados,
  consumoInsumos,
  onExportProductsCSV,
  onExportCSV,
}: DetalleOperacionesInventarioProps) {
  const [activeTab, setActiveTab] = React.useState("destacados")
  const [showAll, setShowAll] = React.useState(false)
  const isProductsTab = activeTab === "destacados"

  return (
    <Card>
      <CardHeader className="border-b py-5">
        <CardTitle className="text-base">{isProductsTab ? "Productos más despachados" : "Consumo de insumos"}</CardTitle>
        <CardDescription>
          {isProductsTab
            ? "Top 10 por unidades despachadas en el período."
            : "Insumos utilizados en órdenes de trabajo durante el período."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 sm:pt-6">
        <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setShowAll(false) }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TabsList variant="line" className="w-full sm:w-auto">
              <TabsTrigger value="destacados">
                Productos Destacados
                <span className="ml-1.5 text-xs text-muted-foreground">({productosDestacados.length})</span>
              </TabsTrigger>
              <TabsTrigger value="insumos">
                Consumo de Insumos
                <span className="ml-1.5 text-xs text-muted-foreground">({consumoInsumos.length})</span>
              </TabsTrigger>
            </TabsList>

            <Button
              variant="outline"
              size="sm"
              onClick={isProductsTab ? onExportProductsCSV : onExportCSV}
              className="self-start sm:self-auto"
              aria-label={isProductsTab ? "Exportar productos destacados a CSV" : "Exportar consumo de insumos a CSV"}
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
          </div>

          <TabsContent value="destacados" className="mt-4 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
            <DataTable
              columns={productosDestacadosColumns}
              data={showAll ? productosDestacados : productosDestacados.slice(0, 10)}
              emptyMessage="No hay productos destacados en este período."
              bordered={false}
            />
            {productosDestacados.length > 10 && (
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Mostrando {showAll ? productosDestacados.length : Math.min(10, productosDestacados.length)} de {productosDestacados.length}</span>
                <Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>
                  {showAll ? "Ver solo el top 10" : "Ver todos"}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insumos" className="mt-4 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
            <DataTable
              columns={consumoInsumosColumns}
              data={consumoInsumos}
              emptyMessage="No hay consumo de insumos en este período."
              bordered={false}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
