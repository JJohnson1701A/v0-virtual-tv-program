import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AccentColorProvider } from "@/components/accent-color-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Virtual TV 3",
  description: "Schedule media to replicate the feel of 80s-90s television",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AccentColorProvider>
            {children}
          </AccentColorProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
