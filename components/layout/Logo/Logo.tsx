"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

export function Logo() {
  const router = useRouter()
  return (
    <div
      className="group min-h-20 h-20 flex items-center px-6 border-b border-sidebar-border/80 cursor-pointer gap-3.5 transition-colors hover:bg-sidebar-accent/50 select-none"
      onClick={() => router.push("/")}
    >
      <div className="flex items-center justify-center p-2 rounded-xl bg-primary/10 border border-primary/20 transition-transform duration-200 group-hover:scale-105 group-hover:bg-primary/15 shadow-xs">
        <Image
          src="/logo.svg"
          alt="Urban Cycling Logo"
          width={28}
          height={28}
          priority
          className="dark:brightness-125 transition-transform"
        />
      </div>
      <div className="flex flex-col">
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
