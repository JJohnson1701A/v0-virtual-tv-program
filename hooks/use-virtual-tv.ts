"use client"

import { useState, useEffect } from "react"
import { useMediaLibrary } from "./use-media-library"
import { useBlocksMarathons } from "./use-blocks-marathons"
import { logInfo, logDebug, logWarn, logError } from "@/hooks/use-app-logger"

export interface CommercialItem {
  id: string
  title: string
  filePath: string
  runtime?: number
  commercialCategory?: string
}

export interface CurrentMedia {
  id: string
  title: string
  episodeTitle?: string
  type: string
  startTime: string
  endTime: string
  blockName?: string
  marathonName?: string
  category?: string
  artist?: string
  album?: string
  filePath?: string
  breaks?: string
  runtime?: number
  allowedCommercials?: string[]
  excludedCommercials?: string[]
  overlayPositionOverride?: string
  fillStyle?: "intermixed" | "at-end" | "at-beginning" | "none" | "static"
  /** Seconds of filler remaining if the user tuned in during a commercial break */
  fillerRemainingSec?: number
  /** Epoch seconds when this schedule block ends */
  blockEndEpoch?: number
  /** Seconds elapsed since the schedule block started — used to seek into the media */
  startOffset: number
}

export function useVirtualTV(channelNumber: number) {
  const [currentMedia, setCurrentMedia] = useState<CurrentMedia | null>(null)
  const [isStatic, setIsStatic] = useState(true)
  const [tick, setTick] = useState(0)
  const [commercials, setCommercials] = useState<CommercialItem[]>([])

  // Get all media libraries
  const { mediaItems: movies } = useMediaLibrary("movies", "a-z")
  const { mediaItems: tvshows } = useMediaLibrary("tvshows", "a-z")
  const { mediaItems: musicvideos } = useMediaLibrary("musicvideos", "a-z")
  const { mediaItems: filler } = useMediaLibrary("filler", "a-z")
  const { mediaItems: podcasts } = useMediaLibrary("podcasts", "a-z")
  const { mediaItems: livestreams } = useMediaLibrary("livestreams", "a-z")
  const { blocks, marathons } = useBlocksMarathons()

  // Poll every 30 seconds so we pick up time-slot transitions
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(interval)
  }, [])

  // Find channel by number
  const findChannelByNumber = (number: number) => {
    // This would normally come from useChannels, but we'll simulate it
    const storedChannels = localStorage.getItem("virtualTvChannels")
    const channels = storedChannels ? JSON.parse(storedChannels) : []
    return channels.find((c: any) => c.number === number)
  }

  // Get current time info
  const getCurrentTimeInfo = () => {
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const currentTime = `${hours === 0 ? 12 : hours > 12 ? hours - 12 : hours}:${minutes
      .toString()
      .padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`

    return { dayOfWeek, currentTime, hours, minutes }
  }

  // Check if current time falls within a schedule item
  const isTimeInSchedule = (startTime: string, endTime: string, currentHours: number, currentMinutes: number) => {
    const parseTime = (timeStr: string) => {
      const [time, period] = timeStr.split(" ")
      const [hours, minutes] = time.split(":").map(Number)
      const totalMinutes = ((hours % 12) + (period === "PM" ? 12 : 0)) * 60 + minutes
      return totalMinutes
    }

    const currentTotalMinutes = currentHours * 60 + currentMinutes
    const startMinutes = parseTime(startTime)
    const endMinutes = parseTime(endTime)

    // Handle overnight schedules
    if (endMinutes < startMinutes) {
      return currentTotalMinutes >= startMinutes || currentTotalMinutes < endMinutes
    }

    return currentTotalMinutes >= startMinutes && currentTotalMinutes < endMinutes
  }

  // Find current media for the channel
  useEffect(() => {
  const channel = findChannelByNumber(channelNumber)
  if (!channel) {
    logWarn("VirtualTV", `Channel ${channelNumber} not found`)
    setCurrentMedia(null)
  setIsStatic(true)
  return
    }

    const { dayOfWeek, currentTime, hours, minutes } = getCurrentTimeInfo()

    // Get schedule for this channel
    const storedSchedules = localStorage.getItem("virtualTvSchedules")
    const allSchedules = storedSchedules ? JSON.parse(storedSchedules) : []
    const channelSchedules = allSchedules.filter((item: any) => item.channelId === channel.id)

    // Find current schedule item
    const currentScheduleItem = channelSchedules.find((item: any) => {
      const matchesDay =
        item.occurrence === "weekdays"
          ? dayOfWeek >= 1 && dayOfWeek <= 5 // Monday to Friday
          : item.dayOfWeek === dayOfWeek

      return matchesDay && isTimeInSchedule(item.startTime, item.endTime, hours, minutes)
    })

  if (!currentScheduleItem) {
    logDebug("VirtualTV", `No schedule item found for channel ${channelNumber} at current time`)
    setCurrentMedia(null)
  setIsStatic(true)
  return
    }

    // Find the actual media item
    const allMedia = [...movies, ...tvshows, ...musicvideos, ...filler, ...podcasts, ...livestreams]
    const mediaItem = allMedia.find((m) => m.id === currentScheduleItem.mediaId)

    if (mediaItem) {
      // Compute how many seconds have elapsed since the block started
      const parseTime12 = (t: string) => {
        const [time, period] = t.split(" ")
        const [h, m] = time.split(":").map(Number)
        return ((h % 12) + (period === "PM" ? 12 : 0)) * 3600 + m * 60
      }
      const now = new Date()
      const nowSec = hours * 3600 + minutes * 60 + now.getSeconds()
      let blockStartSec = parseTime12(currentScheduleItem.startTime)
      let blockEndSec = parseTime12(currentScheduleItem.endTime)
      // Handle overnight wraparound (e.g., 11:00 PM to 1:00 AM)
      if (blockEndSec <= blockStartSec) blockEndSec += 24 * 3600
      const blockDuration = blockEndSec - blockStartSec

      let wallElapsed = nowSec - blockStartSec
      if (wallElapsed < 0) wallElapsed += 24 * 3600
      wallElapsed = Math.max(0, wallElapsed)

      // Compute the actual epoch timestamp for block end
      const blockEndEpoch = now.getTime() / 1000 + (blockDuration - wallElapsed)

      // Determine the file path to play
      let filePath: string | undefined
      let breaksStr: string | undefined
      let mediaRuntime: number | undefined = mediaItem.runtime

      if (mediaItem.type === "tvshows" && mediaItem.episodes && mediaItem.episodes.length > 0) {
        // For TV shows, pick the first episode's file
        const episode = mediaItem.episodes[0]
        filePath = episode?.file
        breaksStr = episode?.breaks
      } else if (mediaItem.files && mediaItem.files.length > 0) {
        filePath = mediaItem.files[0]
        breaksStr = mediaItem.breaks
      }

      // ---- Compute filler-aware startOffset ----
      // For "intermixed" filler, the wall-clock timeline is:
      //   [optional pre-filler] [media segment 1] [filler break 1] [media segment 2] [filler break 2] ... [media end] [end padding filler]
      // We need to figure out where in the *media* we are given the wall-clock elapsed time.
      const fillStyle = currentScheduleItem.fillStyle || "intermixed"
      const mediaDurationSec = (mediaRuntime ?? 0) * 60
      const totalFillerTime = Math.max(0, blockDuration - mediaDurationSec)

      // Parse break times from the breaks string (e.g. "15:30,45:00,1:10:30")
      const parseBreaksStr = (str?: string): number[] => {
        if (!str) return []
        return str.split(",").map((s) => {
          const parts = s.trim().split(":").map(Number)
          if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
          if (parts.length === 2) return parts[0] * 60 + parts[1]
          return parts[0]
        }).filter((n) => !isNaN(n) && n > 0).sort((a, b) => a - b)
      }

      const breakTimes = parseBreaksStr(breaksStr)

      let startOffset: number = wallElapsed // default: raw elapsed
      let fillerRemainingSec = 0

      if (fillStyle === "intermixed" && totalFillerTime > 0 && breakTimes.length > 0) {
        // Distribute filler evenly across break slots (breaks + 1 end-padding slot)
        const breakSlots = breakTimes.length + 1
        const fillerPerSlot = totalFillerTime / breakSlots

        // Walk through the timeline: alternate media segments and filler breaks
        // to convert wallElapsed -> mediaOffset
        let wallCursor = 0
        let mediaCursor = 0
        let prevBreak = 0
        let resolved = false

        for (let i = 0; i < breakTimes.length; i++) {
          const segmentDuration = breakTimes[i] - prevBreak
          const wallSegEnd = wallCursor + segmentDuration
          const wallBreakEnd = wallSegEnd + fillerPerSlot

          if (wallElapsed <= wallSegEnd) {
            // Within this media segment (before its filler break)
            mediaCursor += (wallElapsed - wallCursor)
            startOffset = mediaCursor
            resolved = true
            break
          } else if (wallElapsed <= wallBreakEnd) {
            // Within the filler break after this segment -- media is paused
            mediaCursor += segmentDuration
            startOffset = mediaCursor
            fillerRemainingSec = wallBreakEnd - wallElapsed
            resolved = true
            break
          } else {
            wallCursor = wallBreakEnd
            mediaCursor += segmentDuration
            prevBreak = breakTimes[i]
          }
        }

        // Handle time after the last break (final media segment + end padding)
        if (!resolved) {
          const lastSegment = mediaDurationSec - prevBreak
          if (wallElapsed <= wallCursor + lastSegment) {
            mediaCursor += (wallElapsed - wallCursor)
            startOffset = mediaCursor
          } else {
            // Past the media; in end-padding filler or done
            startOffset = mediaDurationSec
          }
        }

        startOffset = Math.min(startOffset, mediaDurationSec)
      } else if (fillStyle === "at-beginning" && totalFillerTime > 0) {
        if (wallElapsed <= totalFillerTime) {
          // Still in the pre-show filler
          startOffset = 0
          fillerRemainingSec = totalFillerTime - wallElapsed
        } else {
          startOffset = wallElapsed - totalFillerTime
        }
      } else {
        // "at-end", "none", "static" — media starts immediately
        startOffset = wallElapsed
      }

      startOffset = Math.max(0, Math.min(startOffset, mediaDurationSec > 0 ? mediaDurationSec : wallElapsed))

      const media: CurrentMedia = {
        id: mediaItem.id,
        title: mediaItem.title,
        type: mediaItem.type,
        startTime: currentScheduleItem.startTime,
        endTime: currentScheduleItem.endTime,
        category: typeof mediaItem.category === "string" ? mediaItem.category : undefined,
        filePath,
        breaks: breaksStr,
        runtime: mediaRuntime,
        allowedCommercials: mediaItem.allowedCommercials || [],
        excludedCommercials: mediaItem.excludedCommercials || [],
        overlayPositionOverride: mediaItem.overlayPositionOverride,
        fillStyle: currentScheduleItem.fillStyle || "intermixed",
        fillerRemainingSec: fillerRemainingSec > 0 ? fillerRemainingSec : undefined,
        blockEndEpoch,
        startOffset,
      }

      // Add episode info for TV shows
      if (mediaItem.type === "tvshows" && mediaItem.episodes) {
        const episode = mediaItem.episodes[0]
        if (episode) {
          media.episodeTitle = `S${episode.seasonNumber}E${episode.episodeNumber}: ${episode.title}`
          if (episode.file) {
            media.filePath = episode.file
          }
          if (episode.breaks) {
            media.breaks = episode.breaks
          }
        }
      }

      // Add music video info
      if (mediaItem.type === "musicvideos") {
        media.artist = mediaItem.bandName || "Unknown Artist"
        media.album = mediaItem.albumName || "Unknown Album"
        media.title = mediaItem.songTitle || mediaItem.title
      }

      // Add music video info for filler
      if (mediaItem.type === "filler" && mediaItem.category === "music video") {
        media.artist = mediaItem.bandName || "Unknown Artist"
        media.album = mediaItem.albumName || "Unknown Album"
      }

      // Build commercials list from all filler items with fillerType === "commercial"
      const availableCommercials: CommercialItem[] = filler
        .filter((f) => f.fillerType === "commercial" && f.files && f.files.length > 0)
        .map((f) => ({
          id: f.id,
          title: f.title,
          filePath: f.files[0],
          runtime: f.runtime,
          commercialCategory: f.commercialCategory,
        }))
  setCommercials(availableCommercials)
      logInfo("VirtualTV", `Playing media: "${media.title}" on channel ${channelNumber}`, {
        startTime: media.startTime,
        endTime: media.endTime,
        startOffset: media.startOffset,
        fillStyle: media.fillStyle,
        fillerRemaining: media.fillerRemainingSec,
        commercialsAvailable: availableCommercials.length,
      })
  
      setCurrentMedia(media)
  setIsStatic(false)
    } else {
      // Check for blocks/marathons
      const block = blocks.find((b) => b.id === currentScheduleItem.mediaId)
      const marathon = marathons.find((m) => m.id === currentScheduleItem.mediaId)

      if (block || marathon) {
        const item = block || marathon
        const parseTime12 = (t: string) => {
          const [time, period] = t.split(" ")
          const [h, m] = time.split(":").map(Number)
          return ((h % 12) + (period === "PM" ? 12 : 0)) * 3600 + m * 60
        }
        const nowSec2 = hours * 3600 + minutes * 60 + new Date().getSeconds()
        let elapsed2 = nowSec2 - parseTime12(currentScheduleItem.startTime)
        if (elapsed2 < 0) elapsed2 += 24 * 3600
        const media: CurrentMedia = {
          id: item!.id,
          title: item!.name,
          type: block ? "block" : "marathon",
          startTime: currentScheduleItem.startTime,
          endTime: currentScheduleItem.endTime,
          startOffset: Math.max(0, elapsed2),
        }

        if (block) {
          media.blockName = block.name
          // Get first media item from block
          if (block.mediaItems.length > 0) {
            const firstMediaItem = allMedia.find((m) => m.id === block.mediaItems[0].mediaId)
            if (firstMediaItem) {
              media.title = firstMediaItem.title
            }
          }
        } else if (marathon) {
          media.marathonName = marathon.name
          // Get first episode from marathon
          if (marathon.episodes.length > 0) {
            const firstEpisode = marathon.episodes[0]
            media.title = firstEpisode.title
          }
        }

        setCurrentMedia(media)
        setIsStatic(false)
      } else {
        setCurrentMedia(null)
        setIsStatic(true)
      }
    }
  }, [channelNumber, movies, tvshows, musicvideos, filler, podcasts, livestreams, blocks, marathons, tick])

  return {
    currentMedia,
    isStatic,
    commercials,
  }
}
