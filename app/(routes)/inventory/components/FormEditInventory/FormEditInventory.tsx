"use client"

import type { ProductColumn } from "../ListInventory/columns"
import { FormCreateInventory } from "../FormCreateInventory/FormCreateInventory"

type FormEditInventoryProps = {
  product: ProductColumn
  onCompleted: () => void
  onCancel: () => void
}

export function FormEditInventory(props: FormEditInventoryProps) {
  return (
    <FormCreateInventory
      key={props.product.idProducto}
      setOpenModalCreate={() => undefined}
      product={props.product}
      onCompleted={props.onCompleted}
      onCancel={props.onCancel}
    />
  )
}
