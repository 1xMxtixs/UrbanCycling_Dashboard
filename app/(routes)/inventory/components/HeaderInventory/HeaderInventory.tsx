"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { FormCreateInventory } from "../FormCreateInventory"

export function HeaderInventory() {
  const [openModalCreate, setOpenModalCreate] = useState(false)

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Inventario Urban Cycling</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestion de productos registrados en inventario
        </p>
      </div>

      <Dialog open={openModalCreate} onOpenChange={setOpenModalCreate}>
        <DialogTrigger asChild>
          <Button>+ Agregar producto</Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar producto</DialogTitle>
            <DialogDescription>
              Ingresa los datos del producto para registrarlo en inventario
            </DialogDescription>
          </DialogHeader>

          <FormCreateInventory setOpenModalCreate={setOpenModalCreate} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
