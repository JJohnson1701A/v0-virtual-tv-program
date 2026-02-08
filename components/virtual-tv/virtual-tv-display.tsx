"use client"

import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUpIcon, ChevronDownIcon } from "lucide-react"
import type { Channel } from "@/types/channel"
import type { CurrentMedia, CommercialItem } from "@/hooks/use-virtual-tv"

// ---- helpers ----

/** Parse "00:02:28.00" into seconds */
function parseTimecode(tc: string): number {
  const cleaned = tc.trim()
  const parts = cleaned.split(":")
  if (parts.length === 3) {
    const h = parseFloat(parts[0])
    const m = parseFloat(parts[1])
    const s = parseFloat(parts[2])
    return h * 3600 + m * 60 + s
  }
  if (parts.length === 2) {
    const m = parseFloat(parts[0])
    const s = parseFloat(parts[1])
    return m * 60 + s
  }
  return parseFloat(cleaned) || 0
}

/** Parse a comma-separated breaks string into sorted seconds array */
function parseBreaks(breaks?: string): number[] {
  if (!breaks || !breaks.trim()) return []
  return breaks
    .split(",")
    .map(parseTimecode)
    .filter((t) => t > 0)
    .sort((a, b) => a - b)
}

/** Parse "8:00 PM" style time into { hours24, minutes } */
function parseScheduleTime(timeStr: string): { hours24: number; minutes: number } {
  const [time, period] = timeStr.split(" ")
  const [h, m] = time.split(":").map(Number)
  const hours24 = (h % 12) + (period === "PM" ? 12 : 0)
  return { hours24, minutes: m }
}

/** Get total seconds in a schedule block */
function getBlockDurationSeconds(startTime: string, endTime: string): number {
  const start = parseScheduleTime(startTime)
  const end = parseScheduleTime(endTime)
  let startSec = start.hours24 * 3600 + start.minutes * 60
  let endSec = end.hours24 * 3600 + end.minutes * 60
  // handle overnight
  if (endSec <= startSec) endSec += 24 * 3600
  return endSec - startSec
}

/** Pick a random item from an array */
function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

// ---- types ----

type PlaybackState =
  | "loading"
  | "playing-main"
  | "commercial-break"
  | "padding-commercials"
  | "ended"
  | "error"
  | "no-file"

// ---- component ----

interface VirtualTVDisplayProps {
  channel?: Channel
  media?: CurrentMedia | null
  isStatic: boolean
  commercials: CommercialItem[]
  onChannelUp: () => void
  onChannelDown: () => void
}

export function VirtualTVDisplay({
  channel,
  media,
  isStatic,
  commercials,
  onChannelUp,
  onChannelDown,
}: VirtualTVDisplayProps) {
  const mainVideoRef = useRef<HTMLVideoElement>(null)
  const commercialVideoRef = useRef<HTMLVideoElement>(null)

  const [playbackState, setPlaybackState] = useState<PlaybackState>("loading")
  const playbackStateRef = useRef<PlaybackState>("loading")
  const [videoError, setVideoError] = useState<string | null>(null)

  // Break tracking
  const breakTimesRef = useRef<number[]>([])
  const nextBreakIndexRef = useRef(0)
  const pausedForBreakRef = useRef(false)

  // Padding tracking
  const blockEndRef = useRef(0) // epoch seconds when schedule block ends

  // Sync setter that updates both state and ref
  const updatePlaybackState = useCallback((newState: PlaybackState | ((prev: PlaybackState) => PlaybackState)) => {
    setPlaybackState((prev) => {
      const resolved = typeof newState === "function" ? newState(prev) : newState
      playbackStateRef.current = resolved
      return resolved
    })
  }, [])

  // Current commercial info for display
  const [currentCommercialTitle, setCurrentCommercialTitle] = useState<string>("")

  // Filter commercials based on the current media's allowed/excluded lists
  const filteredCommercials = useMemo(() => {
    const allowed = media?.allowedCommercials ?? []
    const excluded = media?.excludedCommercials ?? []
    const hasAllowed = allowed.length > 0
    const hasExcluded = excluded.length > 0

    if (!hasAllowed && !hasExcluded) {
      // All blank = all allowed
      return commercials
    }

    return commercials.filter((c) => {
      const cat = c.commercialCategory || ""
      if (hasAllowed) {
        // Only allow checked categories
        return allowed.includes(cat)
      }
      // Exclude X'd categories
      return !excluded.includes(cat)
    })
  }, [commercials, media?.allowedCommercials, media?.excludedCommercials])

  // Track media id so we reset state when media changes
  const mediaIdRef = useRef<string | null>(null)

  // ---- resolve video src ----
  const getVideoSrc = useCallback((filePath?: string): string | null => {
    if (!filePath) return null
    if (
      filePath.startsWith("http://") ||
      filePath.startsWith("https://") ||
      filePath.startsWith("blob:") ||
      filePath.startsWith("data:")
    ) {
      return filePath
    }
    return filePath
  }, [])

  const videoSrc = media?.filePath ? getVideoSrc(media.filePath) : null

  // ---- compute block end epoch ----
  useEffect(() => {
    if (!media) return
    const now = new Date()
    const end = parseScheduleTime(media.endTime)
    const blockEnd = new Date(now)
    blockEnd.setHours(end.hours24, end.minutes, 0, 0)
    // if block end is before now, it's tomorrow (overnight)
    if (blockEnd.getTime() <= now.getTime()) {
      blockEnd.setDate(blockEnd.getDate() + 1)
    }
    blockEndRef.current = blockEnd.getTime() / 1000
  }, [media])

  // ---- reset when media changes ----
  useEffect(() => {
    const newId = media?.id ?? null
    if (newId === mediaIdRef.current) return
    mediaIdRef.current = newId

    setVideoError(null)
    updatePlaybackState("loading")
    setCurrentCommercialTitle("")
    pausedForBreakRef.current = false

    // Parse break timecodes
    const breaks = parseBreaks(media?.breaks)
    breakTimesRef.current = breaks

    // Skip any break points that have already passed given startOffset
    const offset = media?.startOffset ?? 0
    let startIdx = 0
    if (offset > 0) {
      while (startIdx < breaks.length && breaks[startIdx] <= offset) {
        startIdx++
      }
    }
    nextBreakIndexRef.current = startIdx
  }, [media?.id, media?.breaks, media?.startOffset])

  // ---- load & play main video ----
  useEffect(() => {
    const video = mainVideoRef.current
    if (!video || !videoSrc) return

    video.src = videoSrc
    video.load()

    const onCanPlay = () => {
      // Seek to the correct position based on how far into the schedule block we are
      const offset = media?.startOffset ?? 0
      if (offset > 0 && video.duration && offset < video.duration) {
        video.currentTime = offset
      }
      updatePlaybackState("playing-main")
      video.play().catch(() => {
        setVideoError("Autoplay blocked -- click the video to play")
      })
    }

    const onError = () => {
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
      updatePlaybackState("error")
    }

    video.addEventListener("canplay", onCanPlay, { once: true })
    video.addEventListener("error", onError, { once: true })

    return () => {
      video.removeEventListener("canplay", onCanPlay)
      video.removeEventListener("error", onError)
    }
  }, [videoSrc, media?.startOffset])

  // ---- monitor timeupdate for break points ----
  useEffect(() => {
    const video = mainVideoRef.current
    if (!video) return

    const onTimeUpdate = () => {
      if (pausedForBreakRef.current) return
      const breaks = breakTimesRef.current
      const idx = nextBreakIndexRef.current
      if (idx >= breaks.length) return

      const currentTime = video.currentTime
      const breakTime = breaks[idx]

      // Trigger within 0.5s tolerance
      if (currentTime >= breakTime - 0.25) {
        pausedForBreakRef.current = true
        video.pause()
        nextBreakIndexRef.current = idx + 1
        playCommercial()
      }
    }

    video.addEventListener("timeupdate", onTimeUpdate)
    return () => video.removeEventListener("timeupdate", onTimeUpdate)
  }, [commercials]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- handle main video ending -> pad with commercials ----
  useEffect(() => {
    const video = mainVideoRef.current
    if (!video) return

    const onEnded = () => {
      const nowSec = Date.now() / 1000
      const remaining = blockEndRef.current - nowSec
      if (remaining > 5 && commercials.length > 0) {
        // Pad remaining time with commercials
        updatePlaybackState("padding-commercials")
        playCommercial()
      } else {
        updatePlaybackState("ended")
      }
    }

    video.addEventListener("ended", onEnded)
    return () => video.removeEventListener("ended", onEnded)
  }, [commercials]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- play a random commercial ----
  const playCommercial = useCallback(() => {
    const commercial = pickRandom(commercials)
    if (!commercial) {
      // No commercials available, resume main
      resumeMain()
      return
    }

    const src = getVideoSrc(commercial.filePath)
    if (!src) {
      resumeMain()
      return
    }

    setCurrentCommercialTitle(commercial.title)
    updatePlaybackState((prev) =>
      prev === "padding-commercials" ? "padding-commercials" : "commercial-break",
    )

    const comVid = commercialVideoRef.current
    if (!comVid) {
      resumeMain()
      return
    }

    comVid.src = src
    comVid.load()

    const onCanPlay = () => {
      comVid.play().catch(() => {})
    }

    const onEnded = () => {
      comVid.removeEventListener("canplay", onCanPlay)
      comVid.removeEventListener("ended", onEnded)
      comVid.removeEventListener("error", onErr)

      // Check if the main video has ended and we need to keep padding
      const mainVideo = mainVideoRef.current
      const mainEnded = mainVideo ? mainVideo.ended : false
      const nowSec = Date.now() / 1000
      const remaining = blockEndRef.current - nowSec

      if (mainEnded && remaining > 5 && commercials.length > 0) {
        // Keep padding with more commercials
        playCommercial()
        return
      }

      // Resume main video (or end if main is done and block time is up)
      resumeMain()
    }

    const onErr = () => {
      comVid.removeEventListener("canplay", onCanPlay)
      comVid.removeEventListener("ended", onEnded)
      comVid.removeEventListener("error", onErr)
      resumeMain()
    }

    comVid.addEventListener("canplay", onCanPlay, { once: true })
    comVid.addEventListener("ended", onEnded, { once: true })
    comVid.addEventListener("error", onErr, { once: true })
  }, [commercials, getVideoSrc]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- resume main video after commercial ----
  const resumeMain = useCallback(() => {
    const video = mainVideoRef.current
    if (!video) return

    // If the main video already ended, check if we should keep padding
    if (video.ended) {
      const nowSec = Date.now() / 1000
      const remaining = blockEndRef.current - nowSec
      if (remaining > 5 && commercials.length > 0) {
        updatePlaybackState("padding-commercials")
        pausedForBreakRef.current = false
        playCommercial()
        return
      }
      updatePlaybackState("ended")
      return
    }

    pausedForBreakRef.current = false
    updatePlaybackState("playing-main")
    setCurrentCommercialTitle("")
    video.play().catch(() => {})
  }, [commercials]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- click to play / resume ----
  const handleVideoClick = () => {
    if (playbackState === "commercial-break" || playbackState === "padding-commercials") {
      return // Don't interrupt commercials
    }
    const video = mainVideoRef.current
    if (!video) return
    if (video.paused) {
      video.play().catch(() => {})
      updatePlaybackState("playing-main")
    } else {
      video.pause()
    }
    setVideoError(null)
  }

  // ---- channel nav ----
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

  // ---- static / no signal ----
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

  // ---- determine what to show ----
  const showMainVideo =
    playbackState === "playing-main" || playbackState === "loading"
  const showCommercialVideo =
    playbackState === "commercial-break" || playbackState === "padding-commercials"

  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full bg-black flex items-center justify-center">
        {media && videoSrc ? (
          <>
            {/* Main program video -- hidden during commercials */}
            <video
              ref={mainVideoRef}
              className={`w-full h-full object-contain cursor-pointer ${showCommercialVideo ? "hidden" : ""}`}
              onClick={handleVideoClick}
              autoPlay
              playsInline
            />

            {/* Commercial video -- hidden when main is playing */}
            <video
              ref={commercialVideoRef}
              className={`w-full h-full object-contain ${showCommercialVideo ? "" : "hidden"}`}
              playsInline
            />

            {/* Commercial overlay label */}
            {showCommercialVideo && currentCommercialTitle && (
              <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded z-10">
                {playbackState === "padding-commercials"
                  ? `Commercial: ${currentCommercialTitle}`
                  : `Commercial Break: ${currentCommercialTitle}`}
              </div>
            )}

            {/* Loading indicator */}
            {playbackState === "loading" && (
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
                  {media.episodeTitle && (
                    <div className="text-lg mb-2 text-gray-300">{media.episodeTitle}</div>
                  )}
                  <div className="text-sm text-yellow-400 mt-4 leading-relaxed">{videoError}</div>
                  <div className="text-xs text-gray-500 mt-3">File: {media.filePath}</div>
                </div>
              </div>
            )}

            {/* Ended state */}
            {playbackState === "ended" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-center text-white">
                  <div className="text-xl font-bold mb-2">{media.title}</div>
                  <div className="text-sm text-gray-400">Program has ended</div>
                </div>
              </div>
            )}
          </>
        ) : media ? (
          <div className="text-center text-white">
            <div className="text-2xl font-bold mb-2">{media.title}</div>
            {media.episodeTitle && (
              <div className="text-lg mb-2 text-gray-300">{media.episodeTitle}</div>
            )}
            <div className="text-lg text-gray-300">
              {media.startTime} - {media.endTime}
            </div>
            <div className="text-sm text-yellow-400 mt-4">No file path assigned to this media item.</div>
            <div className="text-sm text-gray-400 mt-2">
              Channel {channel.number} - {channel.name}
            </div>
          </div>
        ) : (
          <div className="text-center text-white">
            <div className="text-xl">
              Channel {channel.number} - {channel.name}
            </div>
            <div className="text-lg mt-2 text-gray-400">Ready to play</div>
          </div>
        )}

        {/* Channel Overlay (if enabled) — use TV show override if set */}
        {channel.overlay && (() => {
          const pos = media?.overlayPositionOverride || channel.overlayPosition || "bottom-right"
          const opacity = (channel.overlayOpacity ?? 75) / 100
          return (
            <div
              className={`absolute z-10 ${
                pos === "top-left"
                  ? "top-4 left-4"
                  : pos === "top-right"
                    ? "top-4 right-4"
                    : pos === "bottom-left"
                      ? "bottom-4 left-4"
                      : "bottom-4 right-4"
              }`}
            >
              <img
                src={channel.overlay || "/placeholder.svg"}
                alt="Channel overlay"
                className="max-w-32 max-h-32"
                style={{ opacity }}
              />
            </div>
          )
        })()}
      </div>

      <ChannelNav />
    </div>
  )
}
