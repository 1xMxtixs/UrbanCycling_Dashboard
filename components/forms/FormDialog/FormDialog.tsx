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
  footer?: React.ReactNode
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
  scrollableContentClassName,
  open,
  onOpenChange,
  footer,
  children,
}: FormDialogProps) {
  const content = (
    <DialogContent
      className={cn("flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0", sizeClasses[size], className)}
    >
      <DialogHeader className="shrink-0 border-b border-border/60 px-6 py-4 pr-12">
        <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
        {description && (
          <DialogDescription className="text-xs text-muted-foreground">{description}</DialogDescription>
        )}
      </DialogHeader>
      <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5", scrollableContentClassName)}>
        {children}
      </div>
      {footer && (
        <div className="shrink-0 border-t border-border bg-popover px-6 py-4">
          {footer}
        </div>
      )}
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
