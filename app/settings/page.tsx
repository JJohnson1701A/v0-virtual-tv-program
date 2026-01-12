"use client"

import { Navigation } from "@/components/navigation"
import { SettingsPanel } from "@/components/settings-panel"

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen">
      <Navigation activeTab="Settings" />

      <div className="flex-1 overflow-y-auto">
        <SettingsPanel />
      </div>
    </div>
  )
}
