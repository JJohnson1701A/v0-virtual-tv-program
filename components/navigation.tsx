import Link from "next/link"

type NavigationTab = "Media Library" | "Channel Creator" | "Scheduler" | "Blocks-Marathons" | "Settings" | "Virtual TV"

interface NavigationProps {
  activeTab: NavigationTab
}

export function Navigation({ activeTab }: NavigationProps) {
  const tabs: NavigationTab[] = [
    "Media Library",
    "Channel Creator",
    "Scheduler",
    "Blocks-Marathons",
    "Settings",
    "Virtual TV",
  ]

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
            className={`px-6 py-3 text-center ${isActive ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted"}`}
          >
            {tab}
          </Link>
        )
      })}
    </div>
  )
}
