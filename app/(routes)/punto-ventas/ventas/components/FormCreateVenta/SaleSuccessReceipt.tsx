"use client"

import React from "react"
import { CheckCircle2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Product {
  idProducto: number
  nombre: string
  precioVenta: number
  stockActual: number
  estado: string
}

interface SelectedProduct {
  idProducto: string
  cantidad: number
  precioUnitario: number
}

interface SaleSuccessReceiptProps {
  saleResult: any
  clientLabel: string
  clientRut?: string
  selectedProducts: SelectedProduct[]
  products: Product[]
  subtotal: number
  descuento: number
  neto: number
  iva: number
  finalTotal: number
  metodoPago: string
  estadoPago: string
  onClose: () => void
}

export function SaleSuccessReceipt({
  saleResult,
  clientLabel,
  clientRut,
  selectedProducts,
  products,
  subtotal,
  descuento,
  neto,
  iva,
  finalTotal,
  metodoPago,
  estadoPago,
  onClose,
}: SaleSuccessReceiptProps) {
  const saleData = saleResult?.venta || {}

  return (
    <div className="space-y-6 py-4 animate-in fade-in duration-300">
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <CheckCircle2 className="h-14 w-14 text-green-500 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Venta Registrada Exitosamente
        </h3>
        <p className="text-xs text-muted-foreground">
          La operación fue grabada y el inventario actualizado.
        </p>
      </div>

      {/* Formato Recibo / Boleta */}
      <div className="border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-lg font-mono text-xs space-y-4">
        <div className="text-center border-b border-dashed border-slate-300 dark:border-slate-700 pb-2">
          <h4 className="font-bold text-sm">URBAN CYCLING</h4>
          <p className="text-[10px] text-muted-foreground">Boleta de Venta Directa</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Ref: {saleResult.idPuntoVenta || `venta-${saleData.idVenta}`}
          </p>
        </div>

        <div className="space-y-1">
          <div>
            <span className="text-muted-foreground">Fecha: </span>
            <span className="font-semibold">{new Date().toLocaleString("es-CL")}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cliente: </span>
            <span className="font-semibold">{clientLabel}</span>
          </div>
          {clientRut && (
            <div>
              <span className="text-muted-foreground">RUT: </span>
              <span className="font-semibold">{clientRut}</span>
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Vendedor ID: </span>
            <span className="font-semibold">1</span>
          </div>
        </div>

        <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-2">
          <table className="w-full">
            <thead>
              <tr className="text-left font-bold text-[10px] text-muted-foreground border-b border-slate-200 dark:border-slate-800 pb-1">
                <th className="w-2/4">PRODUCTO</th>
                <th className="w-1/4 text-center">CANT</th>
                <th className="w-1/4 text-right">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((sp, i) => {
                const prod = products.find((p) => p.idProducto.toString() === sp.idProducto)
                return (
                  <tr key={i} className="align-top">
                    <td className="py-1 max-w-[150px] truncate">{prod?.nombre || "Producto"}</td>
                    <td className="py-1 text-center font-bold">{sp.cantidad}</td>
                    <td className="py-1 text-right font-bold">
                      ${(sp.cantidad * sp.precioUnitario).toLocaleString("es-CL")}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-1.5 text-right font-semibold">
          <div className="flex justify-between">
            <span className="text-muted-foreground">SUBTOTAL:</span>
            <span>${subtotal.toLocaleString("es-CL")}</span>
          </div>
          {descuento > 0 && (
            <div className="flex justify-between text-red-500">
              <span className="font-bold">DESCUENTO:</span>
              <span>-${descuento.toLocaleString("es-CL")}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px] text-muted-foreground font-normal">
            <span>NETO:</span>
            <span>${neto.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-normal">
            <span>IVA (19%):</span>
            <span>${iva.toLocaleString("es-CL")}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-dashed border-slate-300 dark:border-slate-700 pt-1.5">
            <span>TOTAL PAGADO:</span>
            <span>${finalTotal.toLocaleString("es-CL")}</span>
          </div>
        </div>

        <div className="text-center border-t border-dashed border-slate-300 dark:border-slate-700 pt-3">
          <p className="text-[10px] font-semibold uppercase">
            Método: <strong className="text-primary">{metodoPago}</strong> | Estado: <strong className="text-green-600">{estadoPago}</strong>
          </p>
          <p className="text-[9px] text-muted-foreground mt-2">¡Gracias por tu compra en Urban Cycling!</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="flex items-center gap-1.5"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
        <Button onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  )
}
