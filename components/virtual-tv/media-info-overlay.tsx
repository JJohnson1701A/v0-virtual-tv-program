"use client"

import { useEffect, useState } from "react"
import type { Channel } from "@/types/channel"
import type { CurrentMedia } from "@/hooks/use-virtual-tv"

interface MediaInfoOverlayProps {
  media: CurrentMedia
  channel: Channel
  onFadeComplete: () => void
}

export function MediaInfoOverlay({ media, channel, onFadeComplete }: MediaInfoOverlayProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onFadeComplete, 300) // Wait for fade animation
    }, 4700) // Start fading at 4.7s to complete at 5s

    return () => clearTimeout(timer)
  }, [onFadeComplete])

  const isMusicVideo = media.type === "filler" && media.category === "music video"

  return (
    <div
      className={`absolute bottom-6 left-6 text-white transition-opacity duration-300 bg-black bg-opacity-50 p-4 rounded ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ bottom: "25px", left: "25px" }}
    >
      {/* Block/Marathon name if applicable */}
      {(media.blockName || media.marathonName) && (
        <div className="text-lg font-bold mb-1">
          {media.blockName && `Block: ${media.blockName}`}
          {media.marathonName && `Marathon: ${media.marathonName}`}
        </div>
      )}

      {/* Media title */}
      <div className={`${isMusicVideo ? "font-['Kabel']" : ""} text-xl font-bold`}>{media.title}</div>

      {/* Episode title or music info */}
      {isMusicVideo ? (
        <div className="font-['Kabel'] text-sm text-gray-300">
          <div>{media.artist || "Unknown Artist"}</div>
          <div>{media.album || "Unknown Album"}</div>
        </div>
      ) : (
        media.episodeTitle && <div className="text-sm text-gray-300">{media.episodeTitle}</div>
      )}

      {/* Timeslot */}
      <div className="text-sm text-gray-400 mt-2">
        {media.startTime} - {media.endTime}
      </div>
    </div>
  )
}
