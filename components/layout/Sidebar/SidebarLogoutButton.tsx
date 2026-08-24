"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

import { Button } from "@/components/ui/button"

export function SidebarLogoutButton() {
  return (
    <Button
      type="button"
      className="mx-3 mb-3 h-10 justify-start gap-2 bg-red-600 text-white hover:bg-red-700"
      onClick={() => signOut({ callbackUrl: "/sign-in" })}
    >
      <LogOut className="h-5 w-5" strokeWidth={1.5} />
      Cerrar sesion
    </Button>
  )
}
