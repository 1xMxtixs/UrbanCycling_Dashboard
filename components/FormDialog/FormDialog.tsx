import React from "react"

import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type FormDialogSize = "lg" | "2xl" | "3xl" | "4xl"

interface FormDialogProps {
  title: string
  description: string
  size?: FormDialogSize
  children: React.ReactNode
}

const sizeClasses: Record<FormDialogSize, string> = {
  lg: "sm:max-w-lg",
  "2xl": "sm:max-w-2xl",
  "3xl": "sm:max-w-3xl",
  "4xl": "sm:max-w-4xl",
}

export function FormDialog({
  title,
  description,
  size = "lg",
  children,
}: FormDialogProps) {
  return (
    <DialogContent className={cn("max-h-[90vh] overflow-y-auto", sizeClasses[size])}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {children}
    </DialogContent>
  )
}
