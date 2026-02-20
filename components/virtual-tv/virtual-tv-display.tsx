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

/** Pick a random item from an array */
function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(Math.random() * arr.length)]
}

// ---- types ----

type PlaybackPhase =
  | "idle"            // nothing loaded yet
  | "loading"         // main video loading
  | "pre-filler"      // playing filler BEFORE the main media ("at-beginning")
  | "playing-main"    // main video playing
  | "commercial-break" // paused main, playing filler at a break point
  | "post-filler"     // main ended, padding to half-hour with filler
  | "ended"           // block done
  | "error"           // video error
  | "no-file"         // no file assigned

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

  const [phase, setPhase] = useState<PlaybackPhase>("idle")
  const phaseRef = useRef<PlaybackPhase>("idle")
  const [videoError, setVideoError] = useState<string | null>(null)
  const [currentCommercialTitle, setCurrentCommercialTitle] = useState("")

  // Refs for mutable state the playback loop needs without re-renders
  const breakTimesRef = useRef<number[]>([])
  const nextBreakIndexRef = useRef(0)
  const blockEndRef = useRef(0)       // epoch-seconds when the schedule block ends
  const mediaIdRef = useRef<string | null>(null)
  const abortRef = useRef(false)      // set true when media changes to abort in-flight sequences
  const commercialsRef = useRef<CommercialItem[]>([])

  // Keep commercials ref in sync
  useEffect(() => {
    commercialsRef.current = commercials
  }, [commercials])

  // Hard-stop all video elements (used on unmount and channel change)
  const hardStopAll = useCallback(() => {
    const mv = mainVideoRef.current
    const cv = commercialVideoRef.current
    if (mv) { mv.pause(); mv.muted = true; mv.removeAttribute("src"); mv.load() }
    if (cv) { cv.pause(); cv.muted = true; cv.removeAttribute("src"); cv.load() }
  }, [])

  // Stop all playback when leaving the page / unmounting
  useEffect(() => {
    return () => {
      abortRef.current = true
      hardStopAll()
    }
  }, [hardStopAll])

  const updatePhase = useCallback((p: PlaybackPhase) => {
    phaseRef.current = p
    setPhase(p)
  }, [])

  // Filter commercials by the media's allowed/excluded lists
  const filteredCommercials = useMemo(() => {
    const allowed = media?.allowedCommercials ?? []
    const excluded = media?.excludedCommercials ?? []
    if (allowed.length === 0 && excluded.length === 0) return commercials
    return commercials.filter((c) => {
      const cat = c.commercialCategory || ""
      if (allowed.length > 0) return allowed.includes(cat)
      return !excluded.includes(cat)
    })
  }, [commercials, media?.allowedCommercials, media?.excludedCommercials])

  // Keep a ref for the filtered list too
  const filteredRef = useRef<CommercialItem[]>([])
  useEffect(() => {
    filteredRef.current = filteredCommercials
  }, [filteredCommercials])

  // ---- resolve video src ----
  const getVideoSrc = useCallback((filePath?: string): string | null => {
    if (!filePath) return null
    return filePath
  }, [])

  const videoSrc = media?.filePath ? getVideoSrc(media.filePath) : null

  // =========================================================================
  //  Core helpers: ensure one video plays at a time
  // =========================================================================

  /** Completely stop and hide the main video */
  const stopMain = useCallback(() => {
    const v = mainVideoRef.current
    if (!v) return
    v.pause()
    v.muted = true
  }, [])

  /** Resume main video: unmute, play */
  const startMain = useCallback(() => {
    const v = mainVideoRef.current
    if (!v) return
    v.muted = false
    v.play().catch(() => {})
  }, [])

  /**
   * Play a single commercial clip. Returns a Promise that resolves when the
   * clip ends (or rejects if aborted / errored).
   */
  const playOneCommercial = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (abortRef.current) { reject(new Error("aborted")); return }

      const pool = filteredRef.current.length > 0 ? filteredRef.current : commercialsRef.current
      const pick = pickRandom(pool)
      if (!pick) { resolve(); return }

      const src = getVideoSrc(pick.filePath)
      if (!src) { resolve(); return }

      const cv = commercialVideoRef.current
      if (!cv) { resolve(); return }

      setCurrentCommercialTitle(pick.title)

      // Wire up one-shot listeners
      const cleanup = () => {
        cv.removeEventListener("ended", onEnded)
        cv.removeEventListener("error", onErr)
        cv.pause()
        cv.muted = true
      }
      const onEnded = () => { cleanup(); resolve() }
      const onErr = () => { cleanup(); resolve() } // resolve so the sequence continues

      cv.addEventListener("ended", onEnded, { once: true })
      cv.addEventListener("error", onErr, { once: true })

      cv.src = src
      cv.muted = false
      cv.load()
      cv.play().catch(() => { cleanup(); resolve() })
    })
  }, [getVideoSrc])

  /**
   * Play commercials for roughly `durationSec` seconds (or until aborted).
   * Keeps looping through random clips until enough time has elapsed.
   * Has a safety cap to prevent infinite loops.
   */
  const playFillerForDuration = useCallback(async (durationSec: number) => {
    if (durationSec <= 0) return
    const deadline = Date.now() / 1000 + durationSec
    const maxClips = Math.ceil(durationSec / 5) + 5 // safety: assume min 5s per clip
    let clipCount = 0
    while (!abortRef.current && clipCount < maxClips) {
      const remaining = deadline - Date.now() / 1000
      if (remaining < 3) break // not enough time for another clip
      const before = Date.now()
      await playOneCommercial()
      const elapsed = Date.now() - before
      clipCount++
      // If a clip resolved in under 500ms it likely errored/was empty; break to avoid spin
      if (elapsed < 500) {
        console.log("[v0] Filler clip resolved too fast, breaking to avoid loop")
        break
      }
    }
    // Ensure commercial video is fully stopped
    const cv = commercialVideoRef.current
    if (cv) { cv.pause(); cv.muted = true }
    setCurrentCommercialTitle("")
  }, [playOneCommercial])

  /**
   * Play filler until the block end time (epoch seconds).
   * Used for post-filler padding. Safety-capped to prevent infinite loops.
   */
  const playFillerUntilBlockEnd = useCallback(async () => {
    const maxClips = 100 // hard safety cap
    let clipCount = 0
    while (!abortRef.current && clipCount < maxClips) {
      const remaining = blockEndRef.current - Date.now() / 1000
      if (remaining < 3) break
      const before = Date.now()
      await playOneCommercial()
      const elapsed = Date.now() - before
      clipCount++
      if (elapsed < 500) {
        console.log("[v0] Filler clip resolved too fast, breaking to avoid loop")
        break
      }
    }
    const cv = commercialVideoRef.current
    if (cv) { cv.pause(); cv.muted = true }
    setCurrentCommercialTitle("")
  }, [playOneCommercial])

  // =========================================================================
  //  Compute block end epoch whenever media changes
  // =========================================================================
  useEffect(() => {
    if (!media) return
    const now = new Date()
    const end = parseScheduleTime(media.endTime)
    const blockEnd = new Date(now)
    blockEnd.setHours(end.hours24, end.minutes, 0, 0)
    if (blockEnd.getTime() <= now.getTime()) {
      blockEnd.setDate(blockEnd.getDate() + 1)
    }
    blockEndRef.current = blockEnd.getTime() / 1000
  }, [media])

  // =========================================================================
  //  Main orchestration: runs whenever media changes
  // =========================================================================
  // Use a composite key of channel number + media id so that switching channels
  // always triggers a full teardown/restart even if the media id hasn't changed yet.
  const mediaKey = channel?.number + "|" + (media?.id ?? "none")

  useEffect(() => {
    // Abort any in-flight filler sequence from the previous media
    abortRef.current = true

    // Hard-stop both video elements immediately so no audio leaks
    hardStopAll()

    // Use a micro-delay so any running async loop sees the abort flag
    const runAsync = async () => {
      await new Promise((r) => setTimeout(r, 80))
      abortRef.current = false

      setVideoError(null)
      setCurrentCommercialTitle("")

      const mainVid = mainVideoRef.current
      const comVid = commercialVideoRef.current
      if (!mainVid || !comVid) return

      if (!media || !videoSrc) {
        updatePhase(media ? "no-file" : "idle")
        return
      }

      // Parse break points
      const breaks = parseBreaks(media.breaks)
      breakTimesRef.current = breaks
      const offset = media.startOffset ?? 0
      let startIdx = 0
      while (startIdx < breaks.length && breaks[startIdx] <= offset) startIdx++
      nextBreakIndexRef.current = startIdx

      const fillStyle = media.fillStyle || "intermixed"

      // ---- Compute filler budget ----
      const blockDuration = Math.max(0, blockEndRef.current - Date.now() / 1000)
      // Use the actual loaded video duration if available, otherwise fall back to metadata
      const videoDurationSec = mainVid.duration && isFinite(mainVid.duration)
        ? mainVid.duration - offset
        : (media.runtime ?? 0) * 60 - offset
      const mediaDuration = Math.max(0, videoDurationSec)
      const totalFillerTime = Math.max(0, blockDuration - mediaDuration)
      // Cap filler to a reasonable maximum (the entire block duration)
      const cappedFillerTime = Math.min(totalFillerTime, blockDuration)

      // Number of break slots (in-media breaks + 1 end-of-show slot)
      const remainingBreaks = breaks.length - startIdx
      const breakSlots = remainingBreaks + 1 // breaks + end padding
      const fillerPerSlot = breakSlots > 0 ? cappedFillerTime / breakSlots : cappedFillerTime

      // ---- Phase: "at-beginning" filler ----
      if (fillStyle === "at-beginning" && cappedFillerTime > 5) {
        updatePhase("pre-filler")
        await playFillerForDuration(cappedFillerTime)
        if (abortRef.current) return
      }

      // ---- Phase: load & play main video ----
      updatePhase("loading")

      if (!mainVid) return
      mainVid.src = videoSrc
      mainVid.load()

      // Wait for canplay
      await new Promise<void>((resolve, reject) => {
        const onCanPlay = () => { mainVid.removeEventListener("error", onErr); resolve() }
        const onErr = () => { mainVid.removeEventListener("canplay", onCanPlay); reject(new Error("load-error")) }
        mainVid.addEventListener("canplay", onCanPlay, { once: true })
        mainVid.addEventListener("error", onErr, { once: true })
      }).catch(() => {
        if (videoSrc && !videoSrc.startsWith("http") && !videoSrc.startsWith("blob:") && !videoSrc.startsWith("data:")) {
          setVideoError("Cannot play local file paths directly in the browser. Re-add the file through the file picker so the browser has access, or use an HTTP URL.")
        } else {
          setVideoError("Unable to load video. The file may be missing or in an unsupported format.")
        }
        updatePhase("error")
        return
      })

      if (abortRef.current || phaseRef.current === "error") return

      // Seek if needed
      if (offset > 0 && mainVid.duration && offset < mainVid.duration) {
        mainVid.currentTime = offset
      }

      // Start playback
      mainVid.muted = false
      updatePhase("playing-main")
      try { await mainVid.play() } catch {
        setVideoError("Autoplay blocked -- click the video to play")
      }

      // ==================================================================
      //  Intermixed filler: wait for each break, pause main, play filler
      // ==================================================================
      if (fillStyle === "intermixed" || fillStyle === "none" || fillStyle === "static") {
        // We drive the break loop from here so there is one single owner
        const processBreaks = async () => {
          while (!abortRef.current && !mainVid.ended) {
            const idx = nextBreakIndexRef.current
            if (idx >= breakTimesRef.current.length) break
            const breakTime = breakTimesRef.current[idx]

            // Poll until we reach the break point (or the video ends/aborts)
            await new Promise<void>((resolve) => {
              let rafId: number
              const check = () => {
                if (abortRef.current || mainVid.ended) { resolve(); return }
                if (mainVid.currentTime >= breakTime - 0.25) { resolve(); return }
                rafId = requestAnimationFrame(check)
              }
              check()
              // Also listen for ended/pause in case RAF misses it
              const onEnd = () => { cancelAnimationFrame(rafId); resolve() }
              mainVid.addEventListener("ended", onEnd, { once: true })
            })

            if (abortRef.current || mainVid.ended) break

            // ---- Hit a break: pause main, play filler ----
            nextBreakIndexRef.current = idx + 1
            mainVid.pause()
            mainVid.muted = true
            updatePhase("commercial-break")

            if (fillStyle !== "none" && fillStyle !== "static" && fillerPerSlot > 3) {
              await playFillerForDuration(fillerPerSlot)
            }

            if (abortRef.current) return

            // ---- Resume main ----
            mainVid.muted = false
            updatePhase("playing-main")
            try { await mainVid.play() } catch { /* ok */ }
          }
        }

        await processBreaks()

        // Wait for the main video to actually end (if it hasn't already)
        if (!abortRef.current && !mainVid.ended) {
          await new Promise<void>((resolve) => {
            const onEnded = () => { mainVid.removeEventListener("ended", onEnded); resolve() }
            mainVid.addEventListener("ended", onEnded, { once: true })
          })
        }

        if (abortRef.current) return

        // ---- Post-media padding (intermixed: fill remaining time) ----
        const remaining = blockEndRef.current - Date.now() / 1000
        if (fillStyle === "intermixed" && remaining > 5 && filteredRef.current.length > 0) {
          mainVid.pause()
          mainVid.muted = true
          updatePhase("post-filler")
          await playFillerUntilBlockEnd()
        }
      }

      // ==================================================================
      //  "at-end" filler: let main play uninterrupted, then pad after
      // ==================================================================
      if (fillStyle === "at-end") {
        // Still respect break points (pause without filler, resume immediately)
        // Actually for "at-end" we just let the video play through uninterrupted
        await new Promise<void>((resolve) => {
          const onEnded = () => { mainVid.removeEventListener("ended", onEnded); resolve() }
          mainVid.addEventListener("ended", onEnded, { once: true })
        })

        if (abortRef.current) return

        const remaining = blockEndRef.current - Date.now() / 1000
        if (remaining > 5 && filteredRef.current.length > 0) {
          mainVid.pause()
          mainVid.muted = true
          updatePhase("post-filler")
          await playFillerUntilBlockEnd()
        }
      }

      // ==================================================================
      //  "at-beginning" already played filler above; main plays through
      // ==================================================================
      if (fillStyle === "at-beginning") {
        await new Promise<void>((resolve) => {
          if (mainVid.ended) { resolve(); return }
          const onEnded = () => { mainVid.removeEventListener("ended", onEnded); resolve() }
          mainVid.addEventListener("ended", onEnded, { once: true })
        })
      }

      if (!abortRef.current) {
        updatePhase("ended")
      }
    }

    runAsync()

    return () => {
      abortRef.current = true
      hardStopAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaKey])

  // ---- click to play / pause ----
  const handleVideoClick = () => {
    if (
      phaseRef.current === "commercial-break" ||
      phaseRef.current === "post-filler" ||
      phaseRef.current === "pre-filler"
    ) return
    const video = mainVideoRef.current
    if (!video) return
    if (video.paused) {
      video.muted = false
      video.play().catch(() => {})
      updatePhase("playing-main")
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

  // ---- determine visibility ----
  const showCommercial =
    phase === "commercial-break" || phase === "post-filler" || phase === "pre-filler"
  const showMain = !showCommercial

  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full bg-black flex items-center justify-center">
        {media && videoSrc ? (
          <>
            {/* Main program video */}
            <video
              ref={mainVideoRef}
              className={`w-full h-full object-contain cursor-pointer ${showCommercial ? "hidden" : ""}`}
              onClick={handleVideoClick}
              playsInline
            />

            {/* Commercial / filler video */}
            <video
              ref={commercialVideoRef}
              className={`w-full h-full object-contain ${showCommercial ? "" : "hidden"}`}
              playsInline
            />

            {/* Commercial overlay label */}
            {showCommercial && currentCommercialTitle && (
              <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded z-10">
                {phase === "pre-filler"
                  ? `Starting Soon: ${currentCommercialTitle}`
                  : phase === "post-filler"
                    ? `Up Next: ${currentCommercialTitle}`
                    : `Commercial Break: ${currentCommercialTitle}`}
              </div>
            )}

            {/* Loading indicator */}
            {phase === "loading" && (
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
            {phase === "ended" && (
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

        {/* Channel Overlay */}
        {channel.overlay && (() => {
          const pos = media?.overlayPositionOverride || channel.overlayPosition || "bottom-right"
          const opacity = (channel.overlayOpacity ?? 40) / 100
          const size = channel.overlaySize ?? 150
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
                className="object-contain"
                style={{ opacity, width: `${size}px`, height: `${size}px` }}
              />
            </div>
          )
        })()}
      </div>

      <ChannelNav />
    </div>
  )
}
