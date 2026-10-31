"use client"

import React, { createContext, useContext, useMemo } from "react"
import { useSession } from "next-auth/react"
import type { PermissionCode } from "@/lib/permissions"

export interface UserPermissionsContextValue {
  session: ReturnType<typeof useSession>["data"]
  status: ReturnType<typeof useSession>["status"]
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  role: string | null
  permissions: PermissionCode[]
  hasPermission: (permission: PermissionCode | string) => boolean
  hasAnyPermission: (permissions: (PermissionCode | string)[]) => boolean
}

const UserPermissionsContext = createContext<UserPermissionsContextValue | null>(null)

export function UserPermissionsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  const value = useMemo<UserPermissionsContextValue>(() => {
    const isLoading = status === "loading"
    const isAuthenticated = status === "authenticated"
    const role = session?.user?.rol ?? null
    const isAdmin = ["administrador", "admin"].includes((role ?? "").toLowerCase())
    const permissions = (session?.user?.permisos ?? []) as PermissionCode[]

    const hasPermission = (permission: PermissionCode | string): boolean => {
      if (isAdmin) return true
      return permissions.includes(permission as PermissionCode)
    }

    const hasAnyPermission = (targetPermissions: (PermissionCode | string)[]): boolean => {
      if (isAdmin) return true
      return targetPermissions.some((perm) => permissions.includes(perm as PermissionCode))
    }

    return {
      session,
      status,
      isLoading,
      isAuthenticated,
      isAdmin,
      role,
      permissions,
      hasPermission,
      hasAnyPermission,
    }
  }, [session, status])

  return (
    <UserPermissionsContext.Provider value={value}>
      {children}
    </UserPermissionsContext.Provider>
  )
}

export function useUserPermissions(): UserPermissionsContextValue {
  const context = useContext(UserPermissionsContext)
  if (!context) {
    throw new Error("useUserPermissions must be used within a UserPermissionsProvider")
  }
  return context
}

