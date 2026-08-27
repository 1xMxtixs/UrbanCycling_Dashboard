import {Navbar} from "@/components/layout/Navbar"
import {Sidebar} from "@/components/layout/Sidebar"
import {RouteTransition} from "@/components/layout/RouteTransition"
import React from "react"

export default function LayoutDashboard({ children }: { children: React.ReactNode }) {
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