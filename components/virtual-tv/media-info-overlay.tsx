"use client"

import { useEffect, useState } from "react"
import type { Channel } from "@/types/channel"
import type { CurrentMedia } from "@/hooks/use-virtual-tv"

interface MediaInfoOverlayProps {
  media: CurrentMedia
  channel: Channel
  duration: number // seconds before fade starts
  onFadeComplete: () => void
}

export function MediaInfoOverlay({ media, channel, duration, onFadeComplete }: MediaInfoOverlayProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onFadeComplete, 1500) // Wait for 1.5s fade animation
    }, duration * 1000)

    return () => clearTimeout(timer)
  }, [duration, onFadeComplete])

  const isMusicVideo = media.type === "filler" && media.category === "music video"

  return (
    <div
      className={`absolute bottom-6 left-6 text-white bg-black bg-opacity-50 p-4 rounded ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ bottom: "25px", left: "25px", transition: "opacity 1.5s ease-out" }}
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
