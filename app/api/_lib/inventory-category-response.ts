import { NextResponse } from "next/server"
import { InventoryCategoryError } from "@/lib/inventory-categories"

export function inventoryCategoryErrorResponse(
  error: InventoryCategoryError
): NextResponse
export function inventoryCategoryErrorResponse(
  error: unknown
): NextResponse | null
export function inventoryCategoryErrorResponse(
  error: unknown
): NextResponse | null {
  if (error instanceof InventoryCategoryError) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.status }
    )
  }
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "P2002")
      return NextResponse.json(
        {
          code: "CATEGORIA_DUPLICADA",
          message: "Ya existe una categoría con ese nombre.",
        },
        { status: 409 }
      )
    if (error.code === "P2003")
      return NextResponse.json(
        {
          code: "CATEGORIA_CON_PRODUCTOS",
          message:
            "La categoría tiene productos asociados. Puedes desactivarla.",
        },
        { status: 409 }
      )
  }
  return null
}
