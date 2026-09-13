"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

import { PERMISSIONS } from "@/lib/permissions"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "./data-table"
import { getColumns, type ProductColumn } from "./columns"
import { ProductDetailSheet } from "./ProductDetailSheet"
import { InventoryMovementDialog } from "../InventoryMovementDialog"

export function ListInventory() {
  const { data: session } = useSession()
  const canUpdate = Boolean(
    session?.user?.permisos?.includes(PERMISSIONS.INVENTORY_UPDATE),
  )

  const [inventory, setInventory] = useState<ProductColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<ProductColumn | null>(
    null,
  )
  const [openDetail, setOpenDetail] = useState(false)
  const [selectedMovementProduct, setSelectedMovementProduct] =
    useState<ProductColumn | null>(null)
  const [openMovement, setOpenMovement] = useState(false)

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
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const columns = getColumns(
    (product) => {
      setSelectedProduct(product)
      setOpenDetail(true)
    },
    (product) => {
      setSelectedMovementProduct(product)
      setOpenMovement(true)
    },
    canUpdate,
  )

  return (
    <>
      <DataTable columns={columns} data={inventory} />
      <ProductDetailSheet
        product={selectedProduct}
        open={openDetail}
        onOpenChange={setOpenDetail}
      />
      <InventoryMovementDialog
        product={selectedMovementProduct}
        open={openMovement}
        onOpenChange={setOpenMovement}
      />
    </>
  )
}
