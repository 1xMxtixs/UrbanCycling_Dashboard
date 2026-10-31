"use client"

import React from "react"
import { AuthProvider } from "./AuthProvider"
import { ThemeProvider } from "./theme-provider"
import { Toaster } from "@/components/ui/sonner"

export interface AppProvidersProps {
  children: React.ReactNode
}

/**
 * Proveedor raíz unificado para la aplicación Urban Cycling.
 * Consolida la autenticación, control de inactividad, permisos de usuario,
 * soporte de temas claro/oscuro y notificaciones tipo toast.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  )
}

