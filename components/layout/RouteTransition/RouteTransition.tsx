"use client"

import React from "react"

interface RouteTransitionProps {
  children: React.ReactNode
}

export function RouteTransition({ children }: RouteTransitionProps) {
  return <div className="route-transition">{children}</div>
}
