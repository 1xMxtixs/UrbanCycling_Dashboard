"use client"

import { SessionProvider } from "next-auth/react"

import { SessionGuard } from "@/components/providers/SessionGuard"
import { UserPermissionsProvider } from "@/components/providers/UserPermissionsProvider"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserPermissionsProvider>
        <SessionGuard>{children}</SessionGuard>
      </UserPermissionsProvider>
    </SessionProvider>
  )
}
