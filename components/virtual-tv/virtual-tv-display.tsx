"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react"
import type { Channel } from "@/types/channel"
import type { CurrentMedia } from "@/hooks/use-virtual-tv"

interface VirtualTVDisplayProps {
  channel?: Channel
  media?: CurrentMedia | null
  isStatic: boolean
  onChannelUp: () => void
  onChannelDown: () => void
}

export function VirtualTVDisplay({ channel, media, isStatic, onChannelUp, onChannelDown }: VirtualTVDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(false)

  // Resolve the file path into a playable source URL.
  // Local file paths stored in the media library look like:
  //   "C:\Videos\movie.mp4" or "/home/user/movie.mp4"
  // Blob URLs from the File API look like: "blob:http://..."
  // Object URLs from file-upload look like: "blob:..."
  // HTTP(S) URLs are used as-is.
  const getVideoSrc = useCallback((filePath?: string): string | null => {
    if (!filePath) return null

    // Already a usable URL (http, https, blob, data)
    if (
      filePath.startsWith("http://") ||
      filePath.startsWith("https://") ||
      filePath.startsWith("blob:") ||
      filePath.startsWith("data:")
    ) {
      return filePath
    }

    // Local file path -- browsers can't load arbitrary local paths directly.
    // We'll attempt to use the File System Access API via an object URL that
    // was previously stored, or fall back to showing an informational message.
    return filePath
  }, [])

  const videoSrc = media?.filePath ? getVideoSrc(media.filePath) : null

  // Play/load the video whenever the source changes
  useEffect(() => {
    setVideoError(null)
    const video = videoRef.current
    if (!video || !videoSrc) return

    setIsVideoLoading(true)
    video.src = videoSrc
    video.load()

    const onCanPlay = () => {
      setIsVideoLoading(false)
      video.play().catch(() => {
        // Autoplay may be blocked; user interaction will be needed
        setVideoError("Autoplay blocked -- click the video to play")
      })
    }

    const onError = () => {
      setIsVideoLoading(false)
      // Check what kind of path this is to give a helpful message
      if (
        videoSrc &&
        !videoSrc.startsWith("http") &&
        !videoSrc.startsWith("blob:") &&
        !videoSrc.startsWith("data:")
      ) {
        setVideoError(
          "Cannot play local file paths directly in the browser. Re-add the file through the file picker so the browser has access, or use an HTTP URL.",
        )
      } else {
        setVideoError("Unable to load video. The file may be missing or in an unsupported format.")
      }
    }

    video.addEventListener("canplay", onCanPlay)
    video.addEventListener("error", onError)

    return () => {
      video.removeEventListener("canplay", onCanPlay)
      video.removeEventListener("error", onError)
    }
  }, [videoSrc])

  // Handle click-to-play for autoplay-blocked scenarios
  const handleVideoClick = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
    setVideoError(null)
  }

  // Channel navigation buttons shared between states
  const ChannelNav = () => (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
      <Button
        variant="secondary"
        size="sm"
        onClick={onChannelUp}
        className="bg-black/50 hover:bg-black/75 text-white border-white/20"
      >
        <ChevronUpIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={onChannelDown}
        className="bg-black/50 hover:bg-black/75 text-white border-white/20"
      >
        <ChevronDownIcon className="h-4 w-4" />
      </Button>
    </div>
  )

  // ---- Static / No Signal ----
  if (isStatic || !channel) {
    return (
      <div className="w-full h-full relative">
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
        <ChannelNav />
      </div>
    )
  }

  // ---- Media playing ----
  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full bg-black flex items-center justify-center">
        {media && videoSrc ? (
          <>
            {/* Actual video player */}
            <video
              ref={videoRef}
              className="w-full h-full object-contain cursor-pointer"
              onClick={handleVideoClick}
              autoPlay
              playsInline
            />

            {/* Loading indicator */}
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                  <div className="text-lg">Loading {media.title}...</div>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white max-w-md px-6">
                  <div className="text-2xl font-bold mb-2">{media.title}</div>
                  {media.episodeTitle && <div className="text-lg mb-2 text-gray-300">{media.episodeTitle}</div>}
                  <div className="text-sm text-yellow-400 mt-4 leading-relaxed">{videoError}</div>
                  <div className="text-xs text-gray-500 mt-3">
                    File: {media.filePath}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : media ? (
          // Media is scheduled but has no file path
          <div className="text-center text-white">
            <div className="text-2xl font-bold mb-2">{media.title}</div>
            {media.episodeTitle && <div className="text-lg mb-2 text-gray-300">{media.episodeTitle}</div>}
            <div className="text-lg text-gray-300">
              {media.startTime} - {media.endTime}
            </div>
            <div className="text-sm text-yellow-400 mt-4">
              No file path assigned to this media item.
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Channel {channel.number} - {channel.name}
            </div>
          </div>
        ) : (
          // Channel exists but nothing currently scheduled
          <div className="text-center text-white">
            <div className="text-xl">
              Channel {channel.number} - {channel.name}
            </div>
            <div className="text-lg mt-2 text-gray-400">Ready to play</div>
          </div>
        )}

        {/* Channel Overlay (if enabled) */}
        {channel.overlay && (
          <div
            className={`absolute z-10 ${
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

      <ChannelNav />
    </div>
  )
}
