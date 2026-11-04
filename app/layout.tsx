import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { AppProviders } from "@/components/providers"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Urban Cycling - Dashboard",
  description: "Sistema de gestión y punto de venta para Urban Cycling",
}

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
