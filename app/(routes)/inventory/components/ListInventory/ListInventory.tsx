"use client"

import { useEffect, useState } from "react"

import { DataTable } from "./data-table"
import { columns, type ProductColumn } from "./columns"

export function ListInventory() {
  const [inventory, setInventory] = useState<ProductColumn[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

    getInventory()
    window.addEventListener("inventory:refresh", getInventory)

    return () => {
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

  return <DataTable columns={columns} data={inventory} />
}
