import React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type FormDialogSize = "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl"

export interface FormDialogProps {
  title: React.ReactNode
  description?: React.ReactNode
  size?: FormDialogSize
  className?: string
  scrollable?: boolean
  scrollableContentClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const sizeClasses: Record<FormDialogSize, string> = {
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
}

export function FormDialog({
  title,
  description,
  size = "lg",
  className,
  scrollable = false,
  scrollableContentClassName,
  open,
  onOpenChange,
  children,
}: FormDialogProps) {
  const content = (
    <DialogContent
      className={cn(
        scrollable && "flex max-h-[min(90dvh,48rem)] flex-col gap-0 overflow-hidden p-0",
        sizeClasses[size],
        className
      )}
    >
      <DialogHeader className={scrollable ? "shrink-0 px-6 pt-6 pr-12" : undefined}>
        <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
        {description && <DialogDescription className="text-xs text-muted-foreground">{description}</DialogDescription>}
      </DialogHeader>
      {scrollable ? (
        <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6 pt-4", scrollableContentClassName)}>
          {children}
        </div>
      ) : children}
    </DialogContent>
  )

  if (open !== undefined || onOpenChange !== undefined) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {content}
      </Dialog>
    )
  }

  return content
}
