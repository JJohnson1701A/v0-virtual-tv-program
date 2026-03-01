"use client"

import { useCallback } from "react"
import type { Channel } from "@/types/channel"
import type { MediaItem } from "@/types/media"
import type { ScheduleItem } from "@/types/schedule"
import type { Settings, DaypartSettings } from "@/hooks/use-settings"

// Safe harbor ratings that are allowed outside safe harbor times
const SAFE_HARBOR_TV_RATINGS = ["TV-Y", "TV-Y7", "TV-G", "TV-PG"]
const SAFE_HARBOR_MOVIE_RATINGS = ["G", "PG"]

// All TV and movie ratings for reference
const ALL_TV_RATINGS = ["TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA"]
const ALL_MOVIE_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "X"]

// Helper to parse time string to minutes since midnight
function parseTimeToMinutes(timeStr: string): number {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return 0
  let hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const period = match[3].toUpperCase()
  if (period === "PM" && hours !== 12) hours += 12
  if (period === "AM" && hours === 12) hours = 0
  return hours * 60 + minutes
}

// Helper to format minutes to time string
function formatMinutesToTime(minutes: number): string {
  const hours24 = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  const period = hours24 >= 12 ? "PM" : "AM"
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24
  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`
}

// Helper to check if a time is within safe harbor
function isInSafeHarbor(timeMinutes: number, safeHarborStart: number, safeHarborEnd: number): boolean {
  if (safeHarborStart <= safeHarborEnd) {
    return timeMinutes >= safeHarborStart && timeMinutes < safeHarborEnd
  } else {
    // Overnight safe harbor (e.g., 10 PM to 6 AM)
    return timeMinutes >= safeHarborStart || timeMinutes < safeHarborEnd
  }
}

// Helper to check if media rating is safe-harbor compliant
function isSafeHarborCompliant(media: MediaItem): boolean {
  if (media.type === "tvshows") {
    return SAFE_HARBOR_TV_RATINGS.includes(media.tvRating || "")
  }
  if (media.type === "movies") {
    return SAFE_HARBOR_MOVIE_RATINGS.includes(media.rating || "")
  }
  // Filler, music videos, etc. - check both ratings
  if (media.tvRating && !SAFE_HARBOR_TV_RATINGS.includes(media.tvRating)) return false
  if (media.rating && !SAFE_HARBOR_MOVIE_RATINGS.includes(media.rating)) return false
  return true
}

// Helper to get daypart for a given time
function getDaypartForTime(
  timeMinutes: number,
  dayparts: Record<string, DaypartSettings>,
): { name: string; settings: DaypartSettings } | null {
  for (const [name, settings] of Object.entries(dayparts)) {
    const start = parseTimeToMinutes(settings.startTime)
    const end = parseTimeToMinutes(settings.endTime)
    
    if (start <= end) {
      if (timeMinutes >= start && timeMinutes < end) {
        return { name, settings }
      }
    } else {
      // Overnight daypart
      if (timeMinutes >= start || timeMinutes < end) {
        return { name, settings }
      }
    }
  }
  return null
}

// Helper to check if arrays have any overlap (or if filter is empty = all allowed)
function matchesFilter(mediaValues: string[], filterInclude: string[], filterExclude?: string[]): boolean {
  // If exclude list has values that match, reject
  if (filterExclude && filterExclude.length > 0) {
    if (mediaValues.some((v) => filterExclude.includes(v))) {
      return false
    }
  }
  
  // If include filter is empty, all values are allowed
  if (!filterInclude || filterInclude.length === 0) {
    return true
  }
  
  // Check if any media value matches the include filter
  return mediaValues.some((v) => filterInclude.includes(v))
}

// Helper to get the end time of a schedule slot (round up to nearest 30 min based on runtime)
function getSlotEndTime(startMinutes: number, runtimeMinutes: number): number {
  // Calculate slot span: same logic as schedule-grid.tsx
  let slots: number
  if (runtimeMinutes <= 30) {
    slots = 1
  } else {
    slots = Math.ceil(runtimeMinutes / 30) + (runtimeMinutes % 30 === 0 ? 1 : 0)
  }
  return startMinutes + slots * 30
}

interface AutoScheduleResult {
  scheduled: number
  skipped: number
  errors: string[]
}

export function useAutoScheduler() {
  const autoScheduleChannel = useCallback(
    (
      channel: Channel,
      settings: Settings,
      existingScheduleItems: ScheduleItem[],
    ): { newItems: Omit<ScheduleItem, "id">[]; result: AutoScheduleResult } => {
      const result: AutoScheduleResult = { scheduled: 0, skipped: 0, errors: [] }
      const newItems: Omit<ScheduleItem, "id">[] = []

      // Load media library
      const allMedia: MediaItem[] = JSON.parse(localStorage.getItem("mediaLibrary") || "[]")

      // Filter to only media assigned to this channel
      const channelMedia = allMedia.filter((media) => {
        if (!channel.assignedMedia || channel.assignedMedia.length === 0) return false
        return channel.assignedMedia.includes(media.id)
      })

      if (channelMedia.length === 0) {
        result.errors.push("No media assigned to this channel")
        return { newItems, result }
      }

      // Get channel type settings for dayparts
      const channelType = channel.channelType || "Over-the-Air (OTA)"
      const channelTypeSettings = settings.channelTypeSettings?.channelTypes?.[channelType]
      const dayparts = channelTypeSettings?.dayparts || {}

      // Safe harbor settings
      const safeHarborEnabled = settings.safeHarbor
      const safeHarborStart = parseTimeToMinutes(settings.safeHarborTimes?.startTime || "6:00 AM")
      const safeHarborEnd = parseTimeToMinutes(settings.safeHarborTimes?.endTime || "10:00 PM")

      // Audience match setting
      const audienceMatchEnabled = settings.audienceMatch

      // Build a map of existing schedule slots (by dayOfWeek and startTime)
      const occupiedSlots = new Set<string>()
      for (const item of existingScheduleItems) {
        if (item.channelId === channel.id) {
          // Mark all half-hour slots this item occupies
          const startMin = parseTimeToMinutes(item.startTime)
          const endMin = parseTimeToMinutes(item.endTime)
          for (let t = startMin; t < endMin; t += 30) {
            occupiedSlots.add(`${item.dayOfWeek}-${t}`)
          }
        }
      }

      // Iterate through each day and each half-hour slot
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        for (let timeMinutes = 0; timeMinutes < 24 * 60; timeMinutes += 30) {
          const slotKey = `${dayOfWeek}-${timeMinutes}`
          
          // Skip if slot is already occupied
          if (occupiedSlots.has(slotKey)) {
            continue
          }

          // Find suitable media for this slot
          const startTime = formatMinutesToTime(timeMinutes)
          
          // Determine if we're in safe harbor
          const inSafeHarbor = safeHarborEnabled && isInSafeHarbor(timeMinutes, safeHarborStart, safeHarborEnd)

          // Get daypart settings
          const daypart = getDaypartForTime(timeMinutes, dayparts)

          // Filter media candidates
          const candidates = channelMedia.filter((media) => {
            // Skip filler - we don't auto-schedule filler as main content
            if (media.type === "filler") return false

            // Check runtime - must have one
            if (!media.runtime || media.runtime <= 0) return false

            // Check if media would fit without overlapping existing items
            const endMinutes = getSlotEndTime(timeMinutes, media.runtime)
            for (let t = timeMinutes; t < endMinutes && t < 24 * 60; t += 30) {
              if (occupiedSlots.has(`${dayOfWeek}-${t}`)) {
                return false
              }
            }

            // Safe harbor check
            if (inSafeHarbor && !isSafeHarborCompliant(media)) {
              return false
            }

            // Channel filter checks (channel settings take priority over daypart)
            
            // Audience filter
            const mediaAudience = media.audience ? [media.audience] : []
            if (!matchesFilter(
              mediaAudience,
              channel.autoSchedulerAudience || [],
              channel.autoSchedulerAudienceExclude
            )) {
              return false
            }

            // Genre filter (TV shows)
            if (media.type === "tvshows" && media.genre) {
              const mediaGenres = Array.isArray(media.genre) ? media.genre : [media.genre]
              if (!matchesFilter(
                mediaGenres,
                channel.autoSchedulerTVGenre || [],
                channel.autoSchedulerTVGenreExclude
              )) {
                return false
              }
            }

            // Genre filter (Movies)
            if (media.type === "movies" && media.genre) {
              const mediaGenres = Array.isArray(media.genre) ? media.genre : [media.genre]
              if (!matchesFilter(
                mediaGenres,
                channel.autoSchedulerMovieGenre || [],
                channel.autoSchedulerMovieGenreExclude
              )) {
                return false
              }
            }

            // Program format filter
            if (media.programFormat) {
              if (!matchesFilter(
                [media.programFormat],
                channel.autoSchedulerProgramFormat || [],
                channel.autoSchedulerProgramFormatExclude
              )) {
                return false
              }
            }

            // Content warning filter
            if (channel.contentWarningFilter) {
              const mediaWarnings = media.contentWarningData?.categories || []
              if (channel.contentWarningFilter.exclude && channel.contentWarningFilter.exclude.length > 0) {
                if (mediaWarnings.some((w) => channel.contentWarningFilter!.exclude.includes(w))) {
                  return false
                }
              }
              if (channel.contentWarningFilter.include && channel.contentWarningFilter.include.length > 0) {
                if (!mediaWarnings.some((w) => channel.contentWarningFilter!.include.includes(w))) {
                  return false
                }
              }
            }

            // Daypart settings check (only if channel doesn't override)
            if (daypart && daypart.settings) {
              const dp = daypart.settings

              // Media type check
              if (dp.mediaTypes && dp.mediaTypes.length > 0) {
                if (!dp.mediaTypes.includes(media.type)) {
                  return false
                }
              }

              // Audience check from daypart (only if channel didn't specify)
              if ((!channel.autoSchedulerAudience || channel.autoSchedulerAudience.length === 0) &&
                  dp.audience && dp.audience.length > 0) {
                if (!matchesFilter(mediaAudience, dp.audience)) {
                  return false
                }
              }

              // Genre check from daypart (only if channel didn't specify)
              if (media.genre) {
                const mediaGenres = Array.isArray(media.genre) ? media.genre : [media.genre]
                const channelGenreFilter = media.type === "tvshows" 
                  ? channel.autoSchedulerTVGenre 
                  : channel.autoSchedulerMovieGenre
                if ((!channelGenreFilter || channelGenreFilter.length === 0) &&
                    dp.genre && dp.genre.length > 0) {
                  if (!matchesFilter(mediaGenres, dp.genre)) {
                    return false
                  }
                }
              }

              // Program format check from daypart (only if channel didn't specify)
              if (media.programFormat &&
                  (!channel.autoSchedulerProgramFormat || channel.autoSchedulerProgramFormat.length === 0)) {
                if (!matchesFilter([media.programFormat], dp.programFormat, dp.programFormatExclude)) {
                  return false
                }
              }
            }

            return true
          })

          if (candidates.length === 0) {
            result.skipped++
            continue
          }

          // Pick a random candidate from the filtered list
          const selectedMedia = candidates[Math.floor(Math.random() * candidates.length)]
          
          // Calculate end time
          const endMinutes = getSlotEndTime(timeMinutes, selectedMedia.runtime)
          const endTime = formatMinutesToTime(endMinutes)

          // Create schedule item
          const scheduleItem: Omit<ScheduleItem, "id"> = {
            channelId: channel.id,
            dayOfWeek,
            startTime,
            endTime,
            mediaId: selectedMedia.id,
            mediaType: selectedMedia.type,
            title: selectedMedia.title,
            runtime: selectedMedia.runtime,
            occurrence: "weekly",
            scheduledDate: new Date().toISOString().split("T")[0],
            order: selectedMedia.type === "tvshows" ? "airdate" : "chronological",
            repeat: "restart",
            fillerSource: "channel",
            fillStyle: "intermixed",
          }

          newItems.push(scheduleItem)
          result.scheduled++

          // Mark all slots this item occupies as occupied
          for (let t = timeMinutes; t < endMinutes && t < 24 * 60; t += 30) {
            occupiedSlots.add(`${dayOfWeek}-${t}`)
          }
        }
      }

      return { newItems, result }
    },
    [],
  )

  return { autoScheduleChannel }
}
