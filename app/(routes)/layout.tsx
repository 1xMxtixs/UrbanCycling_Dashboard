import { cookies } from "next/headers"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { getValidSession } from "@/lib/get-valid-session"
import { redirect } from "next/navigation"
import React from "react"
import type { PermissionCode } from "@/lib/permissions"

export default async function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const session = await getValidSession()

  if (!session) {
    redirect("/sign-in")
  }

  const cookieStore = await cookies()
  const defaultCollapsed = cookieStore.get("sidebar-collapsed")?.value === "true"

  return (
    <DashboardShell
      defaultCollapsed={defaultCollapsed}
      permissions={(session.user.permisos ?? []) as PermissionCode[]}
      isAdmin={["administrador", "admin"].includes((session.user.rol ?? "").toLowerCase())}
    >
      {children}
    </DashboardShell>
  )
}
