"use client"

import type { MediaType } from "@/types/media"
import { PlusIcon } from "lucide-react"

interface MediaSidebarProps {
  activeType: MediaType
  onTypeChange: (type: MediaType) => void
  onAddMedia: (type: MediaType) => void
}

export function MediaSidebar({ activeType, onTypeChange, onAddMedia }: MediaSidebarProps) {
  const mediaTypes: { type: MediaType; label: string }[] = [
    { type: "movies", label: "Movies" },
    { type: "tvshows", label: "TV Shows" },
    { type: "musicvideos", label: "Music Videos" },
    { type: "filler", label: "Filler" },
    { type: "podcasts", label: "Podcasts" },
    { type: "livestreams", label: "Livestreams" },
  ]

  return (
    <div className="w-48 border-r bg-muted/50">
      {mediaTypes.map(({ type, label }) => (
        <div
          key={type}
          className={`flex justify-between items-center px-4 py-3 border-b transition-colors ${activeType === type ? "bg-primary/15 text-primary font-medium" : "hover:bg-primary/10"}`}
        >
          <button onClick={() => onTypeChange(type)} className="text-left flex-1">
            {label}
          </button>
          <button
            onClick={() => onAddMedia(type)}
            className="p-1 hover:bg-muted rounded"
            aria-label={`Add ${label}`}
          >
            <PlusIcon size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
