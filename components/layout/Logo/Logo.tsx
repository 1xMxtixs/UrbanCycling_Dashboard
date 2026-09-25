"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function Logo() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          tooltip="Urban Cycling"
          className="group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent/50 transition-colors"
        >
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-sidebar-primary-foreground transition-transform duration-200 group-hover/menu-button:scale-105 shadow-2xs">
              <Image
                src="/logo.svg"
                alt="Urban Cycling Logo"
                width={22}
                height={22}
                priority
                className="dark:brightness-125 transition-transform"
              />
            </div>
            <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden min-w-0">
              <span className="font-bold text-sm tracking-tight text-sidebar-foreground truncate">
                Urban Cycling
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/80 truncate">
                Management Hub
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
