import {Navbar} from "@/components/layout/Navbar"
import {Sidebar} from "@/components/layout/Sidebar"
import {RouteTransition} from "@/components/layout/RouteTransition"
import { getValidSession } from "@/lib/get-valid-session"
import { redirect } from "next/navigation"
import React from "react"

export default async function LayoutDashboard({ children }: { children: React.ReactNode }) {
  const session = await getValidSession()

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <div className="flex w-full min-h-screen">
      <div className="hidden xl:block w-80 h-full xl:fixed">
        <Sidebar />
      </div>
      <div className="w-full xl:ml-80 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-6">
            <RouteTransition>{children}</RouteTransition>
          </div>
        </main>
      </div>
    </div>
  )
}
