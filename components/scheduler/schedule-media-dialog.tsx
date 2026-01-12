"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [occurrence, setOccurrence] = useState<"weekly" | "weekdays">("weekly")
  const [selectedWeekday, setSelectedWeekday] = useState<number>(timeSlot.dayOfWeek) // Initialize with clicked day
  const [order, setOrder] = useState("chronological")
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

  // Calculate end time based on media runtime with proper 2-hour slot handling
  const calculateEndTime = (startTime: string, runtime: number): string => {
    const [time, period] = startTime.split(" ")
    const [hours, minutes] = time.split(":").map(Number)
    let totalMinutes = (hours % 12) * 60 + minutes + (period === "PM" ? 12 * 60 : 0)

    // For shows 90-120 minutes, round up to 2 hours (120 minutes)
    let adjustedRuntime = runtime
    if (runtime >= 90 && runtime <= 120) {
      adjustedRuntime = 120
    }

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

    // Calculate adjusted runtime for scheduling
    let adjustedRuntime = runtime
    if (adjustedRuntime >= 90 && adjustedRuntime <= 120) {
      adjustedRuntime = 120
    }

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
      // Create single item for selected weekday
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

  const formatMediaDisplay = (media: MediaItem | Block | Marathon) => {
    if ("type" in media) {
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
    } else {
      // It's a Block or Marathon
      const type = "mediaItems" in media ? "Block" : "Marathon"
      const itemCount = "mediaItems" in media ? media.mediaItems.length : media.episodes.length
      return `${media.name} • ${type} • ${media.duration} min • ${itemCount} items • ${media.occurrence}`
    }
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

  const mediaList = getMediaList()

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingItem ? "Edit Scheduled Media" : "Schedule Media"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {DAYS[timeSlot.dayOfWeek]} at {timeSlot.time} on {channel.name}
          </p>
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
                    {mediaList.map((media) => (
                      <div
                        key={media.id}
                        className={`p-3 rounded border cursor-pointer transition-colors ${
                          selectedMedia?.id === media.id ? "bg-blue-100 border-blue-300" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedMedia(media)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {"type" in media ? (
                                <>
                                  {media.type === "movies" && "Movie"} {media.type === "tvshows" && "TV Show"}{" "}
                                  {media.type === "musicvideos" && "Music Video"}{" "}
                                  {media.type === "podcasts" && "Podcast"} {media.type === "filler" && "Filler"}{" "}
                                  {media.type === "livestreams" && "Livestream"} • {formatMediaDisplay(media)}
                                </>
                              ) : (
                                <>
                                  {"mediaItems" in media ? "Block" : "Marathon"} • {formatMediaDisplay(media)}
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
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">{getSchedulingNote(selectedMedia)}</p>
            </div>
          )}

          {/* Scheduling Options */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Occurrence</Label>
                <Select value={occurrence} onValueChange={(value: "weekly" | "weekdays") => setOccurrence(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="weekdays">Weekdays (M-F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Weekday Selection - only show when occurrence is weekly */}
              {occurrence === "weekly" && (
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select
                    value={selectedWeekday.toString()}
                    onValueChange={(value) => setSelectedWeekday(Number.parseInt(value))}
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
                    <SelectItem value="chronological">Chronological</SelectItem>
                    <SelectItem value="airdate">Airdate</SelectItem>
                    <SelectItem value="shuffle">Shuffle</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Repeat</Label>
                <Select value={repeat} onValueChange={setRepeat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                                followUpMedia?.id === media.id ? "bg-blue-100 border-blue-300" : "hover:bg-gray-50"
                              }`}
                              onClick={() => setFollowUpMedia(media)}
                            >
                              <div className="font-medium">
                                {"type" in media ? media.title : media.name}
                                {isSameType && <span className="ml-1 text-xs text-blue-600">• Same Type</span>}
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
