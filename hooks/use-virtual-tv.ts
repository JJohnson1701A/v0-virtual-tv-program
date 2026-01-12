"use client"

import { useState, useEffect } from "react"
import { useMediaLibrary } from "./use-media-library"
import { useBlocksMarathons } from "./use-blocks-marathons"

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
}

export function useVirtualTV(channelNumber: number) {
  const [currentMedia, setCurrentMedia] = useState<CurrentMedia | null>(null)
  const [isStatic, setIsStatic] = useState(true)

  // Get all media libraries
  const { mediaItems: movies } = useMediaLibrary("movies", "a-z")
  const { mediaItems: tvshows } = useMediaLibrary("tvshows", "a-z")
  const { mediaItems: musicvideos } = useMediaLibrary("musicvideos", "a-z")
  const { mediaItems: filler } = useMediaLibrary("filler", "a-z")
  const { mediaItems: podcasts } = useMediaLibrary("podcasts", "a-z")
  const { mediaItems: livestreams } = useMediaLibrary("livestreams", "a-z")
  const { blocks, marathons } = useBlocksMarathons()

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
      setCurrentMedia(null)
      setIsStatic(true)
      return
    }

    // Find the actual media item
    const allMedia = [...movies, ...tvshows, ...musicvideos, ...filler, ...podcasts, ...livestreams]
    const mediaItem = allMedia.find((m) => m.id === currentScheduleItem.mediaId)

    if (mediaItem) {
      const media: CurrentMedia = {
        id: mediaItem.id,
        title: mediaItem.title,
        type: mediaItem.type,
        startTime: currentScheduleItem.startTime,
        endTime: currentScheduleItem.endTime,
        category: mediaItem.category,
      }

      // Add episode info for TV shows
      if (mediaItem.type === "tvshows" && mediaItem.episodes) {
        // For simplicity, just use the first episode
        const episode = mediaItem.episodes[0]
        if (episode) {
          media.episodeTitle = `S${episode.seasonNumber}E${episode.episodeNumber}: ${episode.title}`
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
        // These would normally be in the media item metadata
        media.artist = "Sample Artist"
        media.album = "Sample Album"
      }

      setCurrentMedia(media)
      setIsStatic(false)
    } else {
      // Check for blocks/marathons
      const block = blocks.find((b) => b.id === currentScheduleItem.mediaId)
      const marathon = marathons.find((m) => m.id === currentScheduleItem.mediaId)

      if (block || marathon) {
        const item = block || marathon
        const media: CurrentMedia = {
          id: item!.id,
          title: item!.name,
          type: block ? "block" : "marathon",
          startTime: currentScheduleItem.startTime,
          endTime: currentScheduleItem.endTime,
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
  }, [channelNumber, movies, tvshows, musicvideos, filler, podcasts, livestreams, blocks, marathons])

  return {
    currentMedia,
    isStatic,
  }
}
