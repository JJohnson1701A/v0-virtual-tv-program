"use client"

import { useEffect } from "react"
import { useSettings } from "@/hooks/use-settings"

export function AccentColorProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings()

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", settings.accentColor)
  }, [settings.accentColor])

  return <>{children}</>
}
