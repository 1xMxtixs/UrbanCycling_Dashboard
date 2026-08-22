"use client"

import React from "react"
import { usePathname } from "next/navigation"

interface RouteTransitionProps {
  children: React.ReactNode
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="route-transition">
      {children}
    </div>
  )
}
