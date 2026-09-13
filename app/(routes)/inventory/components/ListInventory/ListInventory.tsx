"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

import { PERMISSIONS } from "@/lib/permissions"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "./data-table"
import { getColumns, type ProductColumn } from "./columns"
import { ProductDetailSheet } from "./ProductDetailSheet"
import { FormEditInventory } from "../FormEditInventory"
import { InventoryMovementDialog } from "../InventoryMovementDialog"
import { Dialog } from "@/components/ui/dialog"
import { FormDialog } from "@/components/forms/FormDialog"
import type { InventoryCategory } from "../../types"

export function ListInventory() {
  const { data: session } = useSession()
  const canUpdate = Boolean(
    session?.user?.permisos?.includes(PERMISSIONS.INVENTORY_UPDATE),
  )

  const [inventory, setInventory] = useState<ProductColumn[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<ProductColumn | null>(
    null,
  )
  const [openDetail, setOpenDetail] = useState(false)
  const [selectedMovementProduct, setSelectedMovementProduct] =
    useState<ProductColumn | null>(null)
  const [openMovement, setOpenMovement] = useState(false)
  const [productToEdit, setProductToEdit] = useState<ProductColumn | null>(null)
  const [openEdit, setOpenEdit] = useState(false)

  useEffect(() => {
    async function getInventory() {
      try {
        const [response, categoriesResponse] = await Promise.all([
          fetch("/api/inventory", { cache: "no-store" }),
          fetch("/api/inventory/categories", { cache: "no-store" }),
        ])

        const categoriesData = await categoriesResponse.json().catch(() => null)
        setCategories(categoriesResponse.ok ? categoriesData?.categories ?? [] : [])

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

  const handleViewDetail = (product: ProductColumn) => {
    setSelectedProduct(product)
    setOpenDetail(true)
  }

  const handleEditProduct = (product: ProductColumn) => {
    setOpenDetail(false)
    setProductToEdit(product)
    setOpenEdit(true)
  }

  const handleRegisterMovement = (product: ProductColumn) => {
    setSelectedMovementProduct(product)
    setOpenMovement(true)
  }

  const columns = getColumns(
    handleViewDetail,
    handleRegisterMovement,
    canUpdate,
  )

  return (
    <>
      <DataTable columns={columns} data={inventory} categories={categories} />
      <ProductDetailSheet
        product={selectedProduct}
        open={openDetail}
        onOpenChange={setOpenDetail}
        onEdit={handleEditProduct}
      />
      <InventoryMovementDialog
        product={selectedMovementProduct}
        open={openMovement}
        onOpenChange={setOpenMovement}
      />
      <Dialog
        open={openEdit}
        onOpenChange={(open) => {
          setOpenEdit(open)
          if (!open) setProductToEdit(null)
        }}
      >
        {productToEdit ? (
          <FormDialog
            title="Editar ficha de producto"
            description="Actualiza los datos del producto sin modificar su identificador único."
            size="2xl"
          >
            <FormEditInventory
              product={productToEdit}
              onCompleted={() => {
                setOpenEdit(false)
                setProductToEdit(null)
                window.dispatchEvent(new Event("inventory:refresh"))
              }}
              onCancel={() => {
                setOpenEdit(false)
                setProductToEdit(null)
              }}
            />
          </FormDialog>
        ) : null}
      </Dialog>
    </>
  )
}
