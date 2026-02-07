"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMediaLibrary } from "@/hooks/use-media-library"
import { useBlocksMarathons } from "@/hooks/use-blocks-marathons"
import type { Channel } from "@/types/channel"
import type { TimeSlot, ScheduleItem } from "@/types/schedule"
import type { MediaItem } from "@/types/media"
import type { Block, Marathon } from "@/types/blocks-marathons"

interface ScheduleMediaDialogProps {
  channel: Channel
  timeSlot: TimeSlot
  existingItem?: ScheduleItem // For editing existing items
  onSchedule: (scheduleData: Omit<ScheduleItem, "id">[]) => void // Changed to array
  onCancel: () => void
}

const MEDIA_TYPES = [
  { id: "channel-specific", label: "Channel-Specific" },
  { id: "movies", label: "Movies" },
  { id: "tvshows", label: "TV Shows" },
  { id: "musicvideos", label: "Music Videos" },
  { id: "podcasts", label: "Podcasts" },
  { id: "filler", label: "Filler" },
  { id: "livestreams", label: "Livestreams" },
  { id: "blocks-marathons", label: "Blocks-Marathons" },
]

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function ScheduleMediaDialog({
  channel,
  timeSlot,
  existingItem,
  onSchedule,
  onCancel,
}: ScheduleMediaDialogProps) {
  const [selectedMediaType, setSelectedMediaType] = useState("channel-specific")
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | Block | Marathon | null>(null)
  const [followUpMedia, setFollowUpMedia] = useState<MediaItem | Block | Marathon | null>(null)
  const [occurrence, setOccurrence] = useState<"weekly" | "weekdays" | "one-time">("weekly")
  const [selectedWeekday, setSelectedWeekday] = useState<number>(timeSlot.dayOfWeek) // Initialize with clicked day
  const [scheduledDate, setScheduledDate] = useState<Date>(timeSlot.date || new Date())
  const [order, setOrder] = useState("one-time")
  const [repeat, setRepeat] = useState("restart")
  const [fillerSource, setFillerSource] = useState("channel")
  const [fillStyle, setFillStyle] = useState("at-end")

  // Get media items for different types
  const { mediaItems: movies } = useMediaLibrary("movies", "a-z")
  const { mediaItems: tvshows } = useMediaLibrary("tvshows", "a-z")
  const { mediaItems: musicvideos } = useMediaLibrary("musicvideos", "a-z")
  const { mediaItems: podcasts } = useMediaLibrary("podcasts", "a-z")
  const { mediaItems: filler } = useMediaLibrary("filler", "a-z")
  const { mediaItems: livestreams } = useMediaLibrary("livestreams", "a-z")
  const { blocks, marathons } = useBlocksMarathons()

  // Initialize form with existing item data if editing
  useEffect(() => {
    if (existingItem) {
      setOccurrence(existingItem.occurrence)
      setOrder(existingItem.order)
      setRepeat(existingItem.repeat)
      setFillerSource(existingItem.fillerSource)
      setFillStyle(existingItem.fillStyle)

      // Find and set the selected media
      const allMedia = [
        ...movies,
        ...tvshows,
        ...musicvideos,
        ...podcasts,
        ...filler,
        ...livestreams,
        ...blocks,
        ...marathons,
      ]
      const media = allMedia.find((m) => m.id === existingItem.mediaId)
      if (media) {
        setSelectedMedia(media)
        // Set the appropriate media type tab
        if ("type" in media) {
          setSelectedMediaType(media.type)
        } else {
          setSelectedMediaType("blocks-marathons")
        }
      }

      // If it's a weekly occurrence, set the selected weekday
      if (existingItem.occurrence === "weekly") {
        setSelectedWeekday(existingItem.dayOfWeek)
      }
    } else {
      // For new items, initialize with the clicked day
      setSelectedWeekday(timeSlot.dayOfWeek)
    }
  }, [existingItem, movies, tvshows, musicvideos, podcasts, filler, livestreams, blocks, marathons, timeSlot.dayOfWeek])

  // Update occurrence and repeat defaults based on selected media type
  useEffect(() => {
    if (!existingItem && selectedMedia) {
      if ("type" in selectedMedia) {
        // Movies default to one-time occurrence and no repeat
        if (selectedMedia.type === "movies") {
          setOccurrence("one-time")
          setRepeat("none")
        } else if (selectedMedia.type === "tvshows") {
          // TV shows default to weekly
          setOccurrence("weekly")
        }
      }
    }
  }, [selectedMedia, existingItem])

  // Update day of week when scheduled date changes
  const handleScheduledDateChange = (dateString: string) => {
    const newDate = new Date(dateString + "T12:00:00") // Add time to avoid timezone issues
    setScheduledDate(newDate)
    setSelectedWeekday(newDate.getDay())
  }

  // Format date for input field (MM-DD-YY)
  const formatDateForDisplay = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const year = String(date.getFullYear()).slice(-2)
    return `${month}-${day}-${year}`
  }

  // Format date for input type="date" (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Calculate end time based on media runtime, rounding up to the next half hour
  const calculateEndTime = (startTime: string, runtime: number): string => {
    const [time, period] = startTime.split(" ")
    const [hours, minutes] = time.split(":").map(Number)
    let totalMinutes = (hours % 12) * 60 + minutes + (period === "PM" && hours !== 12 ? 12 * 60 : 0)
    if (period === "AM" && hours === 12) totalMinutes = minutes // Handle 12:xx AM

    // Round up runtime to the next half hour (30 minute increment)
    const adjustedRuntime = Math.ceil(runtime / 30) * 30

    totalMinutes += adjustedRuntime

    const endHours = Math.floor(totalMinutes / 60) % 24
    const endMins = totalMinutes % 60
    const endPeriod = endHours >= 12 ? "PM" : "AM"
    const displayHours = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours

    return `${displayHours}:${endMins.toString().padStart(2, "0")} ${endPeriod}`
  }

  // Add this function after the calculateEndTime function:
  const calculateLastEpisodeDate = (media: MediaItem | Block | Marathon | null, startDate: Date): string => {
    if (!media || !("type" in media) || media.type !== "tvshows" || !media.episodes) {
      return "N/A"
    }

    // Find the episode with the highest season and episode number
    const lastEpisode = media.episodes.reduce((latest, current) => {
      if (current.seasonNumber > latest.seasonNumber) return current
      if (current.seasonNumber === latest.seasonNumber && current.episodeNumber > latest.episodeNumber) return current
      return latest
    }, media.episodes[0])

    if (!lastEpisode) return "N/A"

    // Calculate how many episodes come before this one
    const episodesBefore = media.episodes.filter(
      (ep) =>
        ep.seasonNumber < lastEpisode.seasonNumber ||
        (ep.seasonNumber === lastEpisode.seasonNumber && ep.episodeNumber < lastEpisode.episodeNumber),
    ).length

    // Calculate the date based on occurrence
    const weeksToAdd = episodesBefore
    if (occurrence === "weekdays") {
      // For weekdays, episodes play Monday through Friday
      const daysToAdd = episodesBefore
      const lastEpisodeDate = new Date(startDate)

      // Add business days
      let addedDays = 0
      while (addedDays < daysToAdd) {
        lastEpisodeDate.setDate(lastEpisodeDate.getDate() + 1)
        // Skip weekends (Saturday = 6, Sunday = 0)
        if (lastEpisodeDate.getDay() !== 0 && lastEpisodeDate.getDay() !== 6) {
          addedDays++
        }
      }

      return lastEpisodeDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } else {
      // For weekly, add weeks
      const lastEpisodeDate = new Date(startDate)
      lastEpisodeDate.setDate(lastEpisodeDate.getDate() + weeksToAdd * 7)

      return lastEpisodeDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }
  }

  // Get the start date for calculation (current week + selected week from timeSlot)
  const getStartDate = (): Date => {
    const today = new Date()
    const currentWeekStart = new Date(today)
    currentWeekStart.setDate(today.getDate() - today.getDay()) // Start of current week (Sunday)

    // Add the selected day of week
    const startDate = new Date(currentWeekStart)
    startDate.setDate(currentWeekStart.getDate() + timeSlot.dayOfWeek)

    return startDate
  }

  const handleSchedule = () => {
    if (!selectedMedia) return

    // Determine runtime based on media type
    let runtime = 30
    let mediaType = "unknown"
    let mediaId = ""
    let title = ""

    if ("type" in selectedMedia) {
      // It's a MediaItem
      runtime = selectedMedia.runtime || 30
      mediaType = selectedMedia.type
      mediaId = selectedMedia.id
      title = selectedMedia.title
    } else {
      // It's a Block or Marathon
      runtime = selectedMedia.duration
      mediaType = "type" in selectedMedia ? "block" : "marathon"
      mediaId = selectedMedia.id
      title = selectedMedia.name
    }

    // Calculate adjusted runtime for scheduling (round up to next half hour)
    const adjustedRuntime = Math.ceil(runtime / 30) * 30

    const baseScheduleData = {
      channelId: channel.id,
      startTime: timeSlot.time,
      endTime: calculateEndTime(timeSlot.time, runtime),
      mediaId,
      mediaType,
      title,
      runtime: adjustedRuntime,
      occurrence,
      order,
      repeat,
      fillerSource,
      fillStyle,
      followUpMediaId: followUpMedia?.id || null,
      scheduledDate: scheduledDate.toISOString(),
    }

    const scheduleItems: Omit<ScheduleItem, "id">[] = []

    if (occurrence === "weekdays") {
      // Create 5 items for Monday through Friday (1-5)
      for (let day = 1; day <= 5; day++) {
        scheduleItems.push({
          ...baseScheduleData,
          dayOfWeek: day,
        })
      }
    } else {
      // Create single item for selected weekday (weekly or one-time)
      scheduleItems.push({
        ...baseScheduleData,
        dayOfWeek: selectedWeekday,
      })
    }

    onSchedule(scheduleItems)
  }

  // Get channel-specific media with season filtering
  const getChannelSpecificMedia = (): MediaItem[] => {
    const allMedia = [...movies, ...tvshows, ...musicvideos, ...podcasts, ...filler, ...livestreams]
    return allMedia.filter((media) => {
      if (!channel.assignedMedia?.includes(media.id)) return false

      // For TV shows, check if any seasons are assigned
      if (media.type === "tvshows" && channel.assignedSeasons?.[media.id]) {
        const assignedSeasons = channel.assignedSeasons[media.id]
        return assignedSeasons.length > 0
      }

      return true
    })
  }

  const getFollowUpMediaList = (): (MediaItem | Block | Marathon)[] => {
    if (!selectedMedia) return []

    const channelSpecificMedia = getChannelSpecificMedia()
    const allMedia = [...channelSpecificMedia, ...blocks, ...marathons]

    // Filter by same media type first
    const sameType: (MediaItem | Block | Marathon)[] = []
    const otherTypes: (MediaItem | Block | Marathon)[] = []

    const selectedType = "type" in selectedMedia ? selectedMedia.type : "blocks-marathons"

    allMedia.forEach((media) => {
      if (media.id === selectedMedia.id) return // Exclude the selected media itself

      const mediaType = "type" in media ? media.type : "blocks-marathons"
      if (mediaType === selectedType) {
        sameType.push(media)
      } else {
        otherTypes.push(media)
      }
    })

    // Sort alphabetically
    const sortByTitle = (a: MediaItem | Block | Marathon, b: MediaItem | Block | Marathon) => {
      const titleA = "type" in a ? a.title : a.name
      const titleB = "type" in b ? b.title : b.name
      return titleA.localeCompare(titleB)
    }

    sameType.sort(sortByTitle)
    otherTypes.sort(sortByTitle)

    return [...sameType, ...otherTypes]
  }

  const getMediaList = (): (MediaItem | Block | Marathon)[] => {
    switch (selectedMediaType) {
      case "channel-specific":
        return getChannelSpecificMedia()
      case "movies":
        return movies
      case "tvshows":
        return tvshows
      case "musicvideos":
        return musicvideos
      case "podcasts":
        return podcasts
      case "filler":
        return filler
      case "livestreams":
        return livestreams
      case "blocks-marathons":
        return [...blocks, ...marathons]
      default:
        return []
    }
  }

  // Check if item is a Block - blocks have mediaItems array
  const isBlock = (media: MediaItem | Block | Marathon): media is Block => {
    return Array.isArray((media as Block).mediaItems)
  }

  // Check if item is a Marathon - marathons have episodes array and name property (not title)
  const isMarathon = (media: MediaItem | Block | Marathon): media is Marathon => {
    const m = media as Marathon
    return Array.isArray(m.episodes) && typeof m.name === "string" && !("mediaItems" in media) && !("title" in media)
  }

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes < 120) {
      return `${minutes} min`
    }
    const hours = minutes / 60
    return `${hours % 1 === 0 ? hours : hours.toFixed(1)} hours`
  }

  const formatMediaDisplay = (media: MediaItem | Block | Marathon) => {
    // Check for Block first
    if (isBlock(media)) {
      const itemCount = media.mediaItems?.length || 0
      const rating = media.mediaItems?.[0]?.title ? "TV-G" : "NR" // Default rating
      return `${media.name || "Unnamed Block"} (Block) • ${itemCount} show${itemCount !== 1 ? "s" : ""} • ${formatDuration(media.duration)} • ${rating}`
    }
    
    // Check for Marathon
    if (isMarathon(media)) {
      const episodeCount = media.episodes?.length || 0
      const rating = "TV-G" // Default rating for marathons
      return `${media.name || "Unnamed Marathon"} (Marathon) • ${episodeCount} episode${episodeCount !== 1 ? "s" : ""} • ${formatDuration(media.duration)} • ${rating}`
    }
    
    // It's a MediaItem
    if (media.type === "movies") {
      return `${media.title} • ${media.year} • ${media.runtime || 0} min • ${media.rating || "NR"}`
    } else if (media.type === "tvshows") {
      // For channel-specific TV shows, show assigned seasons
      if (selectedMediaType === "channel-specific" && channel.assignedSeasons?.[media.id]) {
        const assignedSeasons = channel.assignedSeasons[media.id]
        const seasonText =
          assignedSeasons.length === 1 ? `Season ${assignedSeasons[0]}` : `Seasons ${assignedSeasons.join(", ")}`

        // Calculate episodes in assigned seasons
        const assignedEpisodes = media.episodes?.filter((ep) => assignedSeasons.includes(ep.seasonNumber)).length || 0

        return `${media.title} • ${media.runtime || 0} min • ${media.rating || "NR"} • ${seasonText}, ${assignedEpisodes} Episodes`
      } else {
        const seasons = Math.max(...(media.episodes?.map((ep) => ep.seasonNumber) || [1]))
        const episodes = media.episodes?.length || 0
        return `${media.title} • ${media.runtime || 0} min • ${media.rating || "NR"} • ${seasons} Season${
          seasons > 1 ? "s" : ""
        }, ${episodes} Episodes`
      }
    } else if (media.type === "musicvideos") {
      return `${media.bandName || "Unknown Artist"} - ${media.songTitle || media.title} • ${media.year} • ${media.genre || "Unknown Genre"}`
    }
    return `${media.title} • ${media.year} • ${media.runtime || 0} min • ${media.rating || "NR"}`
  }

  const getSchedulingNote = (media: MediaItem | Block | Marathon | null): string => {
    if (!media) return ""

    let runtime = 0
    if ("type" in media) {
      runtime = media.runtime || 0
    } else {
      runtime = media.duration
    }

    if (runtime >= 90 && runtime <= 120) {
      return `Note: This ${runtime}-minute content will fill a 2-hour timeslot.`
    }
    return ""
  }

  // Calculate series schedule information for blocks
  const getBlockSeriesScheduleInfo = () => {
    if (!selectedMedia || !isBlock(selectedMedia)) return []

    // Get unique series in the block
    const uniqueSeries = selectedMedia.mediaItems.reduce((acc, item) => {
      if (!acc.find((existing) => existing.mediaId === item.mediaId)) {
        acc.push(item)
      }
      return acc
    }, [] as typeof selectedMedia.mediaItems)

    // Format dates as MM-DD-YY
    const formatDate = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const year = String(date.getFullYear()).slice(-2)
      return `${month}-${day}-${year}`
    }

    // For each unique series, calculate next episode and dates
    return uniqueSeries.map((seriesItem) => {
      // Find the full media item to get episode details
      const fullMedia = (tvshows || []).find((show) => show.id === seriesItem.mediaId)
      const episodes = fullMedia?.episodes || []
      const episodeCount = episodes.length || 1

      // Calculate start date and current date
      const start = new Date(scheduledDate)
      start.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Calculate which episode number we're on based on how many airings have passed
      let nextEpisodeIndex = 0
      let nextAirdate = new Date(start)

      if (occurrence === "weekly") {
        // Calculate weeks elapsed since start
        const msPerWeek = 7 * 24 * 60 * 60 * 1000
        const weeksElapsed = Math.floor((today.getTime() - start.getTime()) / msPerWeek)
        nextEpisodeIndex = Math.max(0, Math.min(weeksElapsed, episodeCount - 1))
        
        // If today is past this episode's airdate, move to next episode
        const currentEpisodeDate = new Date(start)
        currentEpisodeDate.setDate(currentEpisodeDate.getDate() + nextEpisodeIndex * 7)
        if (today > currentEpisodeDate && nextEpisodeIndex < episodeCount - 1) {
          nextEpisodeIndex++
        }
        
        nextAirdate = new Date(start)
        nextAirdate.setDate(nextAirdate.getDate() + nextEpisodeIndex * 7)
      } else if (occurrence === "weekdays") {
        // Calculate weekdays elapsed since start
        let daysElapsed = 0
        const tempDate = new Date(start)
        while (tempDate < today) {
          tempDate.setDate(tempDate.getDate() + 1)
          const dayOfWeek = tempDate.getDay()
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            daysElapsed++
          }
        }
        nextEpisodeIndex = Math.min(daysElapsed, episodeCount - 1)
        
        // Calculate next airdate
        let episodesCount = 0
        nextAirdate = new Date(start)
        while (episodesCount < nextEpisodeIndex) {
          nextAirdate.setDate(nextAirdate.getDate() + 1)
          const dayOfWeek = nextAirdate.getDay()
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            episodesCount++
          }
        }
      }

      // Calculate last airdate (final episode)
      let lastAirdate = new Date(start)
      if (occurrence === "weekly") {
        lastAirdate.setDate(lastAirdate.getDate() + (episodeCount - 1) * 7)
      } else if (occurrence === "weekdays") {
        let episodesScheduled = 0
        while (episodesScheduled < episodeCount - 1) {
          lastAirdate.setDate(lastAirdate.getDate() + 1)
          const dayOfWeek = lastAirdate.getDay()
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            episodesScheduled++
          }
        }
      }

      // Format next episode as S01E## 
      const nextEpisode = episodes[nextEpisodeIndex]
      const seasonNum = nextEpisode?.seasonNumber || 1
      const episodeNum = nextEpisode?.episodeNumber || (nextEpisodeIndex + 1)
      const nextEpisodeStr = `S${String(seasonNum).padStart(2, "0")}E${String(episodeNum).padStart(2, "0")}`

      return {
        title: seriesItem.title,
        runtime: seriesItem.runtime,
        nextEpisode: nextEpisodeStr,
        nextAirdate: formatDate(nextAirdate),
        lastAirdate: formatDate(lastAirdate),
      }
    })
  }

  const mediaList = getMediaList()

  // Generate detailed edit info for the header
  const getEditDetailInfo = () => {
    if (!existingItem || !selectedMedia) return null

    const formatDateShort = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const year = String(date.getFullYear()).slice(-2)
      return `${month}/${day}/${year}`
    }

    // Block info
    if (isBlock(selectedMedia)) {
      const totalEpisodes = selectedMedia.mediaItems.reduce((sum, item) => {
        const fullMedia = (tvshows || []).find((show) => show.id === item.mediaId)
        return sum + (fullMedia?.episodes?.length || 0)
      }, 0)
      const totalMinutes = selectedMedia.mediaItems.reduce((sum, item) => {
        const fullMedia = (tvshows || []).find((show) => show.id === item.mediaId)
        const episodeCount = fullMedia?.episodes?.length || 0
        return sum + (episodeCount * (item.runtime || 30))
      }, 0)
      const totalHours = Math.round(totalMinutes / 60)
      const scheduledHours = selectedMedia.duration / 60

      return {
        type: "block",
        logo: selectedMedia.logo,
        name: selectedMedia.name,
        scheduledDuration: `${scheduledHours} hours`,
        totalDuration: `${totalHours} hours total`,
        itemCount: `${totalEpisodes} episodes`,
      }
    }

    // Marathon info
    if (isMarathon(selectedMedia)) {
      const episodeCount = selectedMedia.episodes?.length || 0
      const totalMinutes = episodeCount * (selectedMedia.duration / episodeCount || 120)
      const totalHours = Math.round(totalMinutes / 60)
      const scheduledHours = selectedMedia.duration / 60

      return {
        type: "marathon",
        logo: selectedMedia.logo,
        name: selectedMedia.name,
        scheduledDuration: `${scheduledHours} hours`,
        totalDuration: `${totalHours} hours total`,
        itemCount: `${episodeCount} episodes`,
      }
    }

    // TV Show info
    if ("type" in selectedMedia && selectedMedia.type === "tvshows") {
      const episodes = selectedMedia.episodes || []
      const currentEpisodeIndex = 0 // Would need to track this
      const currentEpisode = episodes[currentEpisodeIndex]
      
      // Calculate start and end dates
      const startDate = new Date(scheduledDate)
      const endDate = new Date(startDate)
      if (occurrence === "weekly") {
        endDate.setDate(endDate.getDate() + (episodes.length - 1) * 7)
      } else if (occurrence === "weekdays") {
        let daysToAdd = episodes.length - 1
        let addedDays = 0
        while (addedDays < daysToAdd) {
          endDate.setDate(endDate.getDate() + 1)
          if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
            addedDays++
          }
        }
      }

      const seasonNum = currentEpisode?.seasonNumber || 1
      const episodeNum = currentEpisode?.episodeNumber || 1
      const episodeCode = `S${String(seasonNum).padStart(2, "0")}E${String(episodeNum).padStart(2, "0")}`

      return {
        type: "tvshow",
        title: selectedMedia.title,
        episodeName: currentEpisode?.title || "Unknown Episode",
        episodeCode,
        startDate: `Started ${formatDateShort(startDate)} at ${timeSlot.time}`,
        endDate: `Ends ${formatDateShort(endDate)}`,
      }
    }

    // Movie info
    if ("type" in selectedMedia && selectedMedia.type === "movies") {
      const movieDate = new Date(scheduledDate)
      return {
        type: "movie",
        title: selectedMedia.title,
        year: selectedMedia.year,
        scheduledDateTime: `${formatDateShort(movieDate)} at ${timeSlot.time}`,
      }
    }

    return null
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingItem ? "Edit Scheduled Media" : "Schedule Media"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {DAYS[timeSlot.dayOfWeek]} at {timeSlot.time} on {channel.name}
          </p>
          {/* Detailed edit info for existing items */}
          {existingItem && selectedMedia && (() => {
            const editInfo = getEditDetailInfo()
            if (!editInfo) return null

            if (editInfo.type === "block" || editInfo.type === "marathon") {
              return (
                <div className="flex items-center gap-3 mt-3 p-3 bg-muted/50 rounded-md">
                  <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    {editInfo.logo ? (
                      <img src={editInfo.logo || "/placeholder.svg"} alt={editInfo.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px]">No Logo</div>
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    {editInfo.name} • {editInfo.scheduledDuration} ({editInfo.totalDuration}) • {editInfo.itemCount}
                  </div>
                </div>
              )
            }

            if (editInfo.type === "tvshow") {
              return (
                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                  <div className="text-sm font-medium">
                    {editInfo.title} • {editInfo.episodeName} • {editInfo.episodeCode} • {editInfo.startDate} • {editInfo.endDate}
                  </div>
                </div>
              )
            }

            if (editInfo.type === "movie") {
              return (
                <div className="mt-3 p-3 bg-muted/50 rounded-md">
                  <div className="text-sm font-medium">
                    {editInfo.title} ({editInfo.year}) • {editInfo.scheduledDateTime}
                  </div>
                </div>
              )
            }

            return null
          })()}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Media Type Tabs */}
          <Tabs value={selectedMediaType} onValueChange={setSelectedMediaType}>
            <TabsList className="grid w-full grid-cols-8">
              {MEDIA_TYPES.map((type) => (
                <TabsTrigger key={type.id} value={type.id} className="text-xs">
                  {type.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedMediaType} className="mt-4">
              <ScrollArea className="h-48 border rounded-md p-4">
                {mediaList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>
                      {selectedMediaType === "channel-specific"
                        ? "No media assigned to this channel yet."
                        : selectedMediaType === "blocks-marathons"
                          ? "No blocks or marathons created yet."
                          : `No ${selectedMediaType} in your media library yet.`}
                    </p>
                    <p className="text-sm">
                      {selectedMediaType === "channel-specific"
                        ? "Assign media to this channel in the Channel Creator."
                        : selectedMediaType === "blocks-marathons"
                          ? "Create blocks and marathons in the Blocks-Marathons tab."
                          : "Add some in the Media Library tab."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mediaList
                      .sort((a, b) => {
                        const nameA = isBlock(a) || isMarathon(a) ? a.name : a.title
                        const nameB = isBlock(b) || isMarathon(b) ? b.name : b.title
                        return (nameA || "").localeCompare(nameB || "")
                      })
                      .map((media) => (
                      <div
                        key={media.id}
                        className={`p-3 rounded border cursor-pointer transition-colors ${
                          selectedMedia?.id === media.id ? "bg-primary/15 border-primary/30" : "hover:bg-primary/10"
                        }`}
                        onClick={() => setSelectedMedia(media)}
                      >
                          <div className="flex items-center gap-3">
                          {/* Logo for blocks/marathons */}
                          {(isBlock(media) || isMarathon(media)) && (
                            <div className="w-8 h-8 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                              {media.logo ? (
                                <img 
                                  src={media.logo || "/placeholder.svg"} 
                                  alt={media.name || "Logo"} 
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px]">
                                  No Logo
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {isBlock(media) || isMarathon(media) ? (
                                formatMediaDisplay(media)
                              ) : (
                                <>
                                  {media.type === "movies" && "Movie"} {media.type === "tvshows" && "TV Show"}{" "}
                                  {media.type === "musicvideos" && "Music Video"}{" "}
                                  {media.type === "podcasts" && "Podcast"} {media.type === "filler" && "Filler"}{" "}
                                  {media.type === "livestreams" && "Livestream"} • {formatMediaDisplay(media)}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Scheduling Note */}
          {selectedMedia && getSchedulingNote(selectedMedia) && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-sm text-primary">{getSchedulingNote(selectedMedia)}</p>
            </div>
          )}

          {/* Scheduling Options */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Occurrence</Label>
                <Select value={occurrence} onValueChange={(value: "weekly" | "weekdays" | "one-time") => setOccurrence(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">One Time</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="weekdays">Weekdays (M-F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Weekday Selection - show for weekly and one-time */}
              {(occurrence === "weekly" || occurrence === "one-time") && (
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select
                    value={selectedWeekday.toString()}
                    onValueChange={(value) => {
                      const newDayOfWeek = Number.parseInt(value)
                      setSelectedWeekday(newDayOfWeek)
                      // Update scheduled date to match the new day of week
                      const newDate = new Date(scheduledDate)
                      const currentDay = newDate.getDay()
                      const diff = newDayOfWeek - currentDay
                      newDate.setDate(newDate.getDate() + diff)
                      setScheduledDate(newDate)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAYS.map((day, index) => {
                        // Map display order to actual day values
                        const dayValue = index === 6 ? 0 : index + 1 // Sunday=0, Monday=1, etc.
                        return (
                          <SelectItem key={day} value={dayValue.toString()}>
                            {day}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Date Scheduled - show for weekly and one-time */}
              {(occurrence === "weekly" || occurrence === "one-time") && (
                <div className="space-y-2">
                  <Label>Date Scheduled</Label>
                  <Input
                    type="date"
                    value={formatDateForInput(scheduledDate)}
                    onChange={(e) => handleScheduledDateChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatDateForDisplay(scheduledDate)}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Start</Label>
                <div className="p-2 border rounded bg-gray-50 text-sm">{timeSlot.time}</div>
              </div>

              <div className="space-y-2">
                <Label>End</Label>
                <div className="p-2 border rounded bg-gray-50 text-sm">
                  {selectedMedia
                    ? calculateEndTime(
                        timeSlot.time,
                        "type" in selectedMedia ? selectedMedia.runtime || 30 : selectedMedia.duration,
                      )
                    : timeSlot.time}
                </div>
              </div>

              <div className="space-y-2">
              <Label>Order</Label>
              <Select value={order} onValueChange={setOrder}>
              <SelectTrigger>
              <SelectValue />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="one-time">One Time</SelectItem>
              <SelectItem value="chronological">Chronological</SelectItem>
              <SelectItem value="airdate">Airdate</SelectItem>
              <SelectItem value="shuffle">Shuffle</SelectItem>
              <SelectItem value="random">Random</SelectItem>
              </SelectContent>
              </Select>
              </div>

              {/* Block Series Schedule Section */}
              {selectedMedia && isBlock(selectedMedia) && selectedMedia.mediaItems.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label className="text-base font-medium">Series Schedule</Label>
                  <p className="text-xs text-muted-foreground">
                    Current schedule for each series showing the next episode to air.
                  </p>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Series</TableHead>
                          <TableHead className="w-20">Runtime</TableHead>
                          <TableHead className="w-24">Next Episode</TableHead>
                          <TableHead className="w-24">Next Airdate</TableHead>
                          <TableHead className="w-24">Last Airdate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getBlockSeriesScheduleInfo().map((series) => (
                          <TableRow key={series.title}>
                            <TableCell className="font-medium">{series.title}</TableCell>
                            <TableCell>{series.runtime} min</TableCell>
                            <TableCell>{series.nextEpisode}</TableCell>
                            <TableCell>{series.nextAirdate}</TableCell>
                            <TableCell>{series.lastAirdate}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
              <Label>Repeat</Label>
              <Select value={repeat} onValueChange={setRepeat}>
              <SelectTrigger>
              <SelectValue />
              </SelectTrigger>
              <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="restart">Restart at Beginning</SelectItem>
              <SelectItem value="end">End</SelectItem>
              <SelectItem value="follow-up">Play Follow-Up</SelectItem>
              </SelectContent>
              </Select>
              </div>

              {/* Follow-Up Media Selection */}
              {repeat === "follow-up" && (
                <div className="space-y-2">
                  <Label>Follow-Up Media</Label>
                  <ScrollArea className="h-32 border rounded-md p-2">
                    {getFollowUpMediaList().length === 0 ? (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No other media assigned to this channel
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {getFollowUpMediaList().map((media) => {
                          const isSameType =
                            "type" in selectedMedia && "type" in media
                              ? selectedMedia.type === media.type
                              : !("type" in selectedMedia) && !("type" in media)

                          return (
                            <div
                              key={media.id}
                              className={`p-2 rounded border cursor-pointer transition-colors text-sm ${
                                followUpMedia?.id === media.id ? "bg-primary/15 border-primary/30" : "hover:bg-primary/10"
                              }`}
                              onClick={() => setFollowUpMedia(media)}
                            >
                              <div className="font-medium">
                                {"type" in media ? media.title : media.name}
                                {isSameType && <span className="ml-1 text-xs text-primary">• Same Type</span>}
                              </div>
                              <div className="text-xs text-gray-500">
                                {"type" in media ? media.type : "Block/Marathon"}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}

              <div className="space-y-2">
                <Label>Filler Source</Label>
                <Select value={fillerSource} onValueChange={setFillerSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channel">Channel</SelectItem>
                    <SelectItem value="media-channel">Media+Channel</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="block-marathon">Block/Marathon</SelectItem>
                    <SelectItem value="block-marathon-channel">Block/Marathon+Channel</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fill Style</Label>
                <Select value={fillStyle} onValueChange={setFillStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intermixed">Intermixed</SelectItem>
                    <SelectItem value="at-end">At End</SelectItem>
                    <SelectItem value="at-beginning">At Beginning</SelectItem>
                    <SelectItem value="none" disabled={fillerSource !== "none"}>
                      None
                    </SelectItem>
                    <SelectItem value="static" disabled={fillerSource !== "none"}>
                      Static
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Last Episode Information */}
              {selectedMedia &&
                "type" in selectedMedia &&
                selectedMedia.type === "tvshows" &&
                selectedMedia.episodes && (
                  <div className="space-y-1 p-3 bg-gray-50 rounded-md">
                    <Label className="text-sm font-medium text-gray-700">Last Episode:</Label>
                    <p className="text-sm text-gray-600">{calculateLastEpisodeDate(selectedMedia, getStartDate())}</p>
                  </div>
                )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={!selectedMedia}>
            {existingItem ? "Update Schedule" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
