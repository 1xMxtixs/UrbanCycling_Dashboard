"use client"

import { useEffect, useState } from "react"

import { DataTable } from "./data-table"
import { getColumns, type ProductColumn } from "./columns"
import { ProductDetailSheet } from "./ProductDetailSheet"

export function ListInventory() {
  const [inventory, setInventory] = useState<ProductColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<ProductColumn | null>(
    null,
  )
  const [openDetail, setOpenDetail] = useState(false)

  useEffect(() => {
    async function getInventory() {
      try {
        const response = await fetch("/api/inventory", {
          cache: "no-store",
        })

        if (!response.ok) {
          setInventory([])
          return
        }

        const data = (await response.json()) as ProductColumn[]
        setInventory(data)
      } finally {
        setIsLoading(false)
      }
    }

    const timerId = window.setTimeout(() => {
      getInventory()
    }, 0)

    window.addEventListener("inventory:refresh", getInventory)

    return () => {
      window.clearTimeout(timerId)
      window.removeEventListener("inventory:refresh", getInventory)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="rounded-lg bg-background p-6 text-sm text-muted-foreground shadow-md">
        Cargando productos...
      </div>
    )
  }

  const columns = getColumns((product) => {
    setSelectedProduct(product)
    setOpenDetail(true)
  })

  return (
    <>
      <DataTable columns={columns} data={inventory} />
      <ProductDetailSheet
        product={selectedProduct}
        open={openDetail}
        onOpenChange={setOpenDetail}
      />
    </>
  )
}
