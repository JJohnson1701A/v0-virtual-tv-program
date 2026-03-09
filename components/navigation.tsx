"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type NavigationTab = "Media Library" | "Channel Creator" | "Scheduler" | "Blocks-Marathons" | "Settings" | "Virtual TV" | "Logs"

interface NavigationProps {
  activeTab: NavigationTab
}

export function Navigation({ activeTab }: NavigationProps) {
  const [loggingEnabled, setLoggingEnabled] = useState(false)

  useEffect(() => {
    // Check if logging is enabled from settings
    try {
      const settings = localStorage.getItem("virtualTvSettings")
      if (settings) {
        const parsed = JSON.parse(settings)
        setLoggingEnabled(parsed.loggingEnabled === true)
      }
    } catch {
      // Ignore errors
    }

    // Listen for storage changes to update the nav when settings change
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "virtualTvSettings" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          setLoggingEnabled(parsed.loggingEnabled === true)
        } catch {
          // Ignore errors
        }
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  const baseTabs: NavigationTab[] = [
    "Media Library",
    "Channel Creator",
    "Scheduler",
    "Blocks-Marathons",
    "Settings",
    "Virtual TV",
  ]

  const tabs: NavigationTab[] = loggingEnabled ? [...baseTabs, "Logs"] : baseTabs

  const getHref = (tab: NavigationTab): string => {
    if (tab === "Settings") {
      return "/settings"
    }
    return `/${tab.toLowerCase().replace(/\s+/g, "-")}`
  }

  return (
    <div className="flex border-b">
      {tabs.map((tab) => {
        const href = getHref(tab)
        const isActive = tab === activeTab

        return (
          <Link
            key={tab}
            href={href}
            className={`px-6 py-3 text-center transition-colors ${isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-primary/10"}`}
          >
            {tab}
          </Link>
        )
      })}
    </div>
  )
}
