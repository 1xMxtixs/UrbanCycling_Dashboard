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
  descuentoUnitario: number
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
        <CheckCircle2 className="h-14 w-14 text-primary animate-bounce motion-reduce:animate-none" />

        <h3 className="text-xl font-bold text-foreground">
          Venta Registrada Exitosamente
        </h3>

        <p className="text-xs text-muted-foreground">
          La operación fue grabada y el inventario actualizado.
        </p>
      </div>

      <div className="border border-dashed border-border bg-muted/30 p-5 rounded-lg font-mono text-xs space-y-4">

        <div className="text-center border-b border-dashed border-border pb-2">
          <h4 className="font-bold text-sm">
            URBAN CYCLING
          </h4>

          <p className="text-[10px] text-muted-foreground">
            Boleta de Venta Directa
          </p>

          <p className="text-[10px] text-muted-foreground mt-1">
            Ref:{" "}
            {saleResult.idPuntoVenta ||
              `venta-${saleData.idVenta}`}
          </p>
        </div>

        <div className="space-y-1">
          <div>
            <span className="text-muted-foreground">
              Fecha:{" "}
            </span>

            <span className="font-semibold">
              {new Date().toLocaleString(
                "es-CL"
              )}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground">
              Cliente:{" "}
            </span>

            <span className="font-semibold">
              {clientLabel}
            </span>
          </div>

          {clientRut && (
            <div>
              <span className="text-muted-foreground">
                RUT:{" "}
              </span>

              <span className="font-semibold">
                {clientRut}
              </span>
            </div>
          )}

          <div>
            <span className="text-muted-foreground">
              Vendedor ID:{" "}
            </span>

            <span className="font-semibold">
              1
            </span>
          </div>
        </div>

        <div className="border-t border-b border-dashed border-border py-2">
          <table className="w-full">
            <thead>
              <tr className="text-left font-bold text-[10px] text-muted-foreground border-b border-border pb-1">
                <th className="w-2/4">
                  PRODUCTO
                </th>

                <th className="w-1/4 text-center">
                  CANT
                </th>

                <th className="w-1/4 text-right">
                  TOTAL
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-dashed divide-border">
              {selectedProducts.map(
                (sp, i) => {
                  const prod =
                    products.find(
                      (p) =>
                        p.idProducto.toString() ===
                        sp.idProducto
                    )

                  const subtotalLinea =
                    sp.cantidad *
                    (
                      sp.precioUnitario -
                      sp.descuentoUnitario
                    )

                  return (
                    <tr
                      key={sp.idProducto ? `receipt-prod-${sp.idProducto}` : `receipt-line-${i}`}
                      className="align-top"
                    >
                      <td className="py-1 max-w-[150px] truncate">
                        {prod?.nombre ||
                          "Producto"}
                      </td>

                      <td className="py-1 text-center font-bold">
                        {sp.cantidad}
                      </td>

                      <td className="py-1 text-right font-bold">
                        $
                        {subtotalLinea.toLocaleString(
                          "es-CL"
                        )}
                      </td>
                    </tr>
                  )
                }
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              SUBTOTAL:
            </span>

            <span>
              $
              {subtotal.toLocaleString(
                "es-CL"
              )}
            </span>
          </div>

          {descuento > 0 && (
            <div className="flex justify-between text-destructive">
              <span className="font-bold">
                DESCUENTO:
              </span>

              <span>
                -$
                {descuento.toLocaleString(
                  "es-CL"
                )}
              </span>
            </div>
          )}

          <div className="flex justify-between text-[10px] text-muted-foreground font-normal">
            <span>NETO:</span>

            <span>
              $
              {neto.toLocaleString(
                "es-CL"
              )}
            </span>
          </div>

          <div className="flex justify-between text-[10px] text-muted-foreground font-normal">
            <span>IVA (19%):</span>

            <span>
              $
              {iva.toLocaleString(
                "es-CL"
              )}
            </span>
          </div>

          <div className="flex justify-between text-sm font-bold border-t border-dashed border-border pt-1.5">
            <span>
              TOTAL PAGADO:
            </span>

            <span>
              $
              {finalTotal.toLocaleString(
                "es-CL"
              )}
            </span>
          </div>
        </div>

        <div className="text-center border-t border-dashed border-border pt-3">
          <p className="text-[10px] font-semibold uppercase">
            Método:{" "}
            <strong className="text-primary">
              {metodoPago}
            </strong>{" "}
            | Estado:{" "}
            <strong className="text-primary">
              {estadoPago}
            </strong>
          </p>

          <p className="text-[9px] text-muted-foreground mt-2">
            ¡Gracias por tu compra en Urban Cycling!
          </p>
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

        <Button onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  )
}
