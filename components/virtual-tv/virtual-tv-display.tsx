"use client"

import { Button } from "@/components/ui/button"
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react"
import type { Channel } from "@/types/channel"
import type { CurrentMedia } from "@/hooks/use-virtual-tv"

interface VirtualTVDisplayProps {
  channel?: Channel
  media?: CurrentMedia
  isStatic: boolean
  onChannelUp: () => void
  onChannelDown: () => void
}

export function VirtualTVDisplay({ channel, media, isStatic, onChannelUp, onChannelDown }: VirtualTVDisplayProps) {
  if (isStatic || !channel) {
    return (
      <div className="w-full h-full relative">
        {/* Static/No Signal Display */}
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl font-bold mb-4">No Signal</div>
            {channel && (
              <div className="text-xl">
                Channel {channel.number} - {channel.name}
              </div>
            )}
            <div className="text-lg mt-2 text-gray-400">Nothing scheduled at this time</div>
          </div>
        </div>

        {/* Channel Navigation Controls */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onChannelUp}
            className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white border-white"
          >
            <ChevronUpIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onChannelDown}
            className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white border-white"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {/* Media Content Display */}
      <div className="w-full h-full bg-black flex items-center justify-center">
        {media ? (
          <div className="text-center text-white">
            <div className="text-6xl font-bold mb-4">📺</div>
            <div className="text-2xl font-bold mb-2">{media.title}</div>
            {media.episodeTitle && <div className="text-lg mb-2">{media.episodeTitle}</div>}
            <div className="text-lg text-gray-300">
              {media.startTime} - {media.endTime}
            </div>
            <div className="text-sm text-gray-400 mt-4">
              Channel {channel.number} - {channel.name}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {media.type === "movies" && "Movie"}
              {media.type === "tvshows" && "TV Show"}
              {media.type === "filler" && "Filler"}
              {media.type === "podcasts" && "Podcast"}
              {media.type === "livestreams" && "Livestream"}
              {media.type === "block" && "Block"}
              {media.type === "marathon" && "Marathon"}
            </div>
          </div>
        ) : (
          <div className="text-center text-white">
            <div className="text-4xl font-bold mb-4">📺</div>
            <div className="text-xl">
              Channel {channel.number} - {channel.name}
            </div>
            <div className="text-lg mt-2 text-gray-400">Ready to play</div>
          </div>
        )}

        {/* Channel Overlay (if enabled) */}
        {channel.overlay && (
          <div
            className={`absolute ${
              channel.overlayPosition === "top-left"
                ? "top-4 left-4"
                : channel.overlayPosition === "top-right"
                  ? "top-4 right-4"
                  : channel.overlayPosition === "bottom-left"
                    ? "bottom-4 left-4"
                    : "bottom-4 right-4"
            }`}
          >
            <img
              src={channel.overlay || "/placeholder.svg"}
              alt="Channel overlay"
              className="max-w-32 max-h-32 opacity-75"
            />
          </div>
        )}
      </div>

      {/* Channel Navigation Controls */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onChannelUp}
          className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white border-white"
        >
          <ChevronUpIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onChannelDown}
          className="bg-black bg-opacity-50 hover:bg-opacity-75 text-white border-white"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
