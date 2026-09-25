import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { RouteTransition } from "@/components/layout/RouteTransition"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { getValidSession } from "@/lib/get-valid-session"
import { redirect } from "next/navigation"
import React from "react"

export default async function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const session = await getValidSession()

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-6">
            <RouteTransition>{children}</RouteTransition>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
