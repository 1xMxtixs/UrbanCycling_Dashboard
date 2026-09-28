"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter()
  return (
    <div
      className={cn(
        "group min-h-20 h-20 flex items-center border-b border-sidebar-border/80 cursor-pointer transition-[padding,background-color] duration-200 hover:bg-sidebar-accent/50 select-none",
        collapsed ? "justify-center px-0 gap-0" : "px-6 gap-3.5"
      )}
      onClick={() => router.push("/")}
    >
      <div className="flex shrink-0 items-center justify-center p-2 rounded-xl bg-primary/10 border border-primary/20 transition-transform duration-200 group-hover:scale-105 group-hover:bg-primary/15 shadow-xs">
        <Image
          src="/logo.svg"
          alt="Urban Cycling Logo"
          width={28}
          height={28}
          priority
          className="dark:brightness-125 transition-transform"
        />
      </div>
      <div
        className={cn(
          "flex flex-col whitespace-nowrap overflow-hidden transition-[opacity,max-width] duration-150",
          collapsed ? "max-w-0 opacity-0" : "max-w-48 opacity-100"
        )}
      >
        <span className="font-bold text-lg tracking-tight text-sidebar-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
          Urban Cycling
        </span>
        <span className="text-[10.5px] font-medium uppercase tracking-widest text-muted-foreground/80">
          Management Hub
        </span>
      </div>
    </div>
  )
}
