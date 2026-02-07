"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2Icon, Trash2Icon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { Channel } from "@/types/channel"
import type { ScheduleItem, TimeSlot } from "@/types/schedule"
import { useBlocksMarathons } from "@/hooks/use-blocks-marathons"
import { useMediaLibrary } from "@/hooks/use-media-library"

interface ScheduleGridProps {
  channel: Channel
  scheduleItems: ScheduleItem[]
  onTimeSlotClick: (timeSlot: TimeSlot) => void
  onEditScheduleItem: (item: ScheduleItem) => void
  onDeleteScheduleItem: (itemId: string) => void
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const COLORS = ["#F2C419", "#E87348", "#AD2040", "#8F14A0", "#364ECC", "#3BB34F"]

// Generate time slots for 24 hours in 30-minute intervals
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      const ampm = hour < 12 ? "AM" : "PM"
      const time12 = `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`
      slots.push({ time24, time12 })
    }
  }
  return slots
}

// Generate week options for the next 52 weeks
const generateWeekOptions = () => {
  const weeks = []
  const today = new Date()

  // Start from the beginning of current week (Sunday)
  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(today.getDate() - today.getDay())

  for (let i = 0; i < 53; i++) {
    // Current week + 52 future weeks
    const weekStart = new Date(currentWeekStart)
    weekStart.setDate(currentWeekStart.getDate() + i * 7)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const startMonth = weekStart.getMonth() + 1
    const startDay = weekStart.getDate()
    const endMonth = weekEnd.getMonth() + 1
    const endDay = weekEnd.getDate()

    weeks.push({
      value: i,
      label: `Week of ${startMonth}/${startDay} to ${endMonth}/${endDay}`,
      startDate: weekStart,
      endDate: weekEnd,
    })
  }

  return weeks
}

export function ScheduleGrid({
  channel,
  scheduleItems,
  onTimeSlotClick,
  onEditScheduleItem,
  onDeleteScheduleItem,
}: ScheduleGridProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(0) // 0 = current week
  const timeSlots = generateTimeSlots()
  const weekOptions = generateWeekOptions()
  const { blocks, marathons } = useBlocksMarathons()
  const { tvshows } = useMediaLibrary()

  const handlePreviousWeek = () => {
    if (selectedWeek > 0) {
      setSelectedWeek(selectedWeek - 1)
    }
  }

  const handleNextWeek = () => {
    if (selectedWeek < 52) {
      setSelectedWeek(selectedWeek + 1)
    }
  }

  // Get schedule item for a specific day and time
  const getScheduleItem = (dayIndex: number, timeSlot: string): ScheduleItem | null => {
    return scheduleItems.find((item) => item.dayOfWeek === dayIndex && item.startTime === timeSlot) || null
  }

  // Calculate how many slots an item spans based on runtime
  const getItemSpan = (runtime: number): number => {
    return Math.ceil(runtime / 30)
  }

  // Get color for schedule item
  const getItemColor = (itemId: string): string => {
    const index = scheduleItems.findIndex((item) => item.id === itemId)
    return COLORS[index % COLORS.length]
  }

  // Truncate title if too long
  const truncateTitle = (title: string | undefined): string => {
    if (!title || typeof title !== "string") return ""
    return title.length > 10 ? `${title.substring(0, 10)}...` : title
  }

  // Check if a slot is part of a multi-slot item
  const isPartOfItem = (dayIndex: number, timeIndex: number): ScheduleItem | null => {
    for (const item of scheduleItems) {
      if (item.dayOfWeek === dayIndex) {
        const itemStartIndex = timeSlots.findIndex((slot) => slot.time12 === item.startTime)
        // Use block/marathon duration for those types, otherwise use runtime
        const duration = (item.mediaType === "block" || item.mediaType === "marathon") 
          ? getBlockDuration(item) 
          : (item.runtime || 30)
        const itemSpan = Math.ceil(duration / 30)
        if (timeIndex >= itemStartIndex && timeIndex < itemStartIndex + itemSpan) {
          return item
        }
      }
    }
    return null
  }

  const handleSlotClick = (dayIndex: number, timeSlot: string) => {
    const existingItem = getScheduleItem(dayIndex, timeSlot)
    if (!existingItem) {
      // Calculate the actual date for this slot
      const slotDate = new Date(currentWeekOption?.startDate || new Date())
      slotDate.setDate(slotDate.getDate() + dayIndex)
      onTimeSlotClick({ dayOfWeek: dayIndex, time: timeSlot, date: slotDate })
    }
  }

  const currentWeekOption = weekOptions[selectedWeek]

  // Calculate which episode should be shown for a TV show on a given day
  const getEpisodeForDay = (scheduleItem: ScheduleItem, dayIndex: number): string | null => {
    if (scheduleItem.mediaType !== "tvshows") return null

    const tvshow = (tvshows || []).find((show) => show.id === scheduleItem.mediaId)
    if (!tvshow || !tvshow.episodes || tvshow.episodes.length === 0) return null

    // Get the date for this grid cell
    const cellDate = new Date(currentWeekOption?.startDate || new Date())
    cellDate.setDate(cellDate.getDate() + dayIndex)
    cellDate.setHours(0, 0, 0, 0)

    // Get the scheduled start date
    const startDate = scheduleItem.scheduledDate 
      ? new Date(scheduleItem.scheduledDate)
      : new Date(currentWeekOption?.startDate || new Date())
    startDate.setHours(0, 0, 0, 0)

    // Calculate episode index based on occurrence type
    let episodeIndex = 0

    if (scheduleItem.occurrence === "weekly") {
      // Weekly: count weeks since start
      const msPerWeek = 7 * 24 * 60 * 60 * 1000
      const weeksSinceStart = Math.floor((cellDate.getTime() - startDate.getTime()) / msPerWeek)
      episodeIndex = weeksSinceStart
    } else if (scheduleItem.occurrence === "weekdays") {
      // Weekdays: count weekdays since start
      let weekdays = 0
      const tempDate = new Date(startDate)
      while (tempDate < cellDate) {
        tempDate.setDate(tempDate.getDate() + 1)
        const dayOfWeek = tempDate.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          weekdays++
        }
      }
      episodeIndex = weekdays
    } else {
      // One-time: always episode 0 (or first)
      episodeIndex = 0
    }

    // Handle negative index (viewing before scheduled start)
    if (episodeIndex < 0) return null

    // Handle episode cycling based on repeat setting
    const totalEpisodes = tvshow.episodes.length
    if (episodeIndex >= totalEpisodes) {
      if (scheduleItem.repeat === "restart") {
        episodeIndex = episodeIndex % totalEpisodes
      } else {
        return null // Show has ended
      }
    }

    const episode = tvshow.episodes[episodeIndex]
    if (!episode) return null

    const seasonNum = episode.seasonNumber || 1
    const episodeNum = episode.episodeNumber || (episodeIndex + 1)
    return `S${String(seasonNum).padStart(2, "0")}E${String(episodeNum).padStart(2, "0")}`
  }

  // Get block/marathon details for a specific slot index within the block
  const getBlockDetailsForSlot = (scheduleItem: ScheduleItem, slotIndexWithinBlock: number) => {
    if (scheduleItem.mediaType === "block") {
      const block = blocks.find((b) => b.id === scheduleItem.mediaId)
      if (block && block.mediaItems.length > 0) {
        // Calculate which media item should show in this slot based on runtime
        let accumulatedSlots = 0
        for (const mediaItem of block.mediaItems) {
          const itemSlots = Math.ceil(mediaItem.runtime / 30)
          if (slotIndexWithinBlock < accumulatedSlots + itemSlots) {
            return {
              blockName: block.name,
              seriesName: mediaItem.title,
              duration: block.duration,
            }
          }
          accumulatedSlots += itemSlots
        }
        // Fallback to last item if we went past the end
        const lastItem = block.mediaItems[block.mediaItems.length - 1]
        return {
          blockName: block.name,
          seriesName: lastItem?.title || "Unknown",
          duration: block.duration,
        }
      }
    } else if (scheduleItem.mediaType === "marathon") {
      const marathon = marathons.find((m) => m.id === scheduleItem.mediaId)
      if (marathon && marathon.episodes.length > 0) {
        // Calculate which episode should show in this slot based on runtime
        let accumulatedSlots = 0
        for (const episode of marathon.episodes) {
          const episodeSlots = Math.ceil(episode.runtime / 30)
          if (slotIndexWithinBlock < accumulatedSlots + episodeSlots) {
            return {
              blockName: marathon.name,
              seriesName: episode.title,
              duration: marathon.duration,
            }
          }
          accumulatedSlots += episodeSlots
        }
        // Fallback to last episode if we went past the end
        const lastEpisode = marathon.episodes[marathon.episodes.length - 1]
        return {
          blockName: marathon.name,
          seriesName: lastEpisode?.title || "Unknown",
          duration: marathon.duration,
        }
      }
    }
    return null
  }

  // Get the block/marathon duration for span calculation
  const getBlockDuration = (scheduleItem: ScheduleItem): number => {
    if (scheduleItem.mediaType === "block") {
      const block = blocks.find((b) => b.id === scheduleItem.mediaId)
      return block?.duration || scheduleItem.runtime || 30
    } else if (scheduleItem.mediaType === "marathon") {
      const marathon = marathons.find((m) => m.id === scheduleItem.mediaId)
      return marathon?.duration || scheduleItem.runtime || 30
    }
    return scheduleItem.runtime || 30
  }

  // Check if a slot is part of a block/marathon and get the slot index within it
  const getSlotInfoForBlockMarathon = (dayIndex: number, timeIndex: number): { item: ScheduleItem; slotIndex: number } | null => {
    for (const item of scheduleItems) {
      if (item.dayOfWeek === dayIndex && (item.mediaType === "block" || item.mediaType === "marathon")) {
        const itemStartIndex = timeSlots.findIndex((slot) => slot.time12 === item.startTime)
        const duration = getBlockDuration(item)
        const itemSpan = Math.ceil(duration / 30)
        if (timeIndex >= itemStartIndex && timeIndex < itemStartIndex + itemSpan) {
          return { item, slotIndex: timeIndex - itemStartIndex }
        }
      }
    }
    return null
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Week Navigation */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">
              {channel.name} (Channel {channel.number}) - Schedule
            </h2>
            <p className="text-sm text-gray-600">Click on a time slot to schedule media</p>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
              disabled={selectedWeek === 0}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(Number.parseInt(value))}>
              <SelectTrigger className="w-48 h-8">
                <SelectValue>{currentWeekOption?.label || "Current Week"}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {weekOptions.map((week) => (
                  <SelectItem key={week.value} value={week.value.toString()}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              disabled={selectedWeek === 52}
              className="h-8 w-8 p-0 bg-transparent"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Fixed Header Row */}
          <div className="border-b bg-white sticky top-0 z-10">
            <div className="grid grid-cols-8 gap-0">
              <div className="p-2 border-r font-medium text-sm bg-gray-50">Timeslot</div>
              {DAYS.map((day, dayIndex) => {
                // Calculate date for this day based on selected week
                const dayDate = new Date(currentWeekOption?.startDate || new Date())
                dayDate.setDate(dayDate.getDate() + dayIndex)
                const month = String(dayDate.getMonth() + 1).padStart(2, "0")
                const date = String(dayDate.getDate()).padStart(2, "0")
                return (
                  <div key={day} className="p-2 border-r font-medium text-sm text-center bg-gray-50">
                    {day} ({month}-{date})
                  </div>
                )
              })}
            </div>
          </div>

          {/* Scrollable Time Slots */}
          <ScrollArea className="flex-1">
            <div className="min-w-full">
              {timeSlots.map((timeSlot, timeIndex) => (
                <div key={timeSlot.time12} className="grid grid-cols-8 gap-0 border-b hover:bg-gray-50">
                  {/* Time Column */}
                  <div className="p-2 border-r text-sm font-medium bg-white sticky left-0 z-5">{timeSlot.time12}</div>

                  {/* Day Columns */}
                  {DAYS.map((day, dayIndex) => {
                    const scheduleItem = isPartOfItem(dayIndex, timeIndex)
                    const isFirstSlotOfItem =
                      scheduleItem && getScheduleItem(dayIndex, timeSlot.time12) === scheduleItem
                    const slotKey = `${dayIndex}-${timeIndex}`
                    
                    // Get block/marathon info for this specific slot
                    const blockSlotInfo = getSlotInfoForBlockMarathon(dayIndex, timeIndex)
                    const isBlockOrMarathon = scheduleItem && (scheduleItem.mediaType === "block" || scheduleItem.mediaType === "marathon")

                    return (
                      <div
                        key={`${day}-${timeSlot.time12}`}
                        className={`p-1 border-r min-h-[40px] relative cursor-pointer transition-colors ${
                          scheduleItem ? "" : "hover:bg-primary/10"
                        }`}
                        style={{
                          backgroundColor: scheduleItem ? getItemColor(scheduleItem.id) : "transparent",
                        }}
                        onClick={() => handleSlotClick(dayIndex, timeSlot.time12)}
                        onMouseEnter={() => setHoveredSlot(slotKey)}
                        onMouseLeave={() => setHoveredSlot(null)}
                      >
                        {/* For blocks/marathons, show name and series in EVERY slot */}
                        {isBlockOrMarathon && blockSlotInfo && (
                          <div className="text-xs font-medium text-white p-1 rounded">
                            {(() => {
                              const details = getBlockDetailsForSlot(blockSlotInfo.item, blockSlotInfo.slotIndex)
                              return details ? (
                                <>
                                  <div className="font-bold">{truncateTitle(details.blockName)}</div>
                                  <div className="text-[10px] opacity-90">{truncateTitle(details.seriesName)}</div>
                                </>
                              ) : (
                                truncateTitle(scheduleItem.title)
                              )
                            })()}
                          </div>
                        )}
                        
                        {/* For regular media, only show in first slot */}
                        {!isBlockOrMarathon && isFirstSlotOfItem && scheduleItem && (
                          <div className="text-xs font-medium text-white p-1 rounded">
                            <div>{truncateTitle(scheduleItem.title)}</div>
                            {scheduleItem.mediaType === "tvshows" && (
                              <div className="text-[10px] opacity-90">
                                {getEpisodeForDay(scheduleItem, dayIndex) || ""}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hover Actions */}
                        {scheduleItem && hoveredSlot === slotKey && (
                          <div className="absolute top-1 right-1 flex gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditScheduleItem(scheduleItem)
                              }}
                            >
                              <Edit2Icon className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0 bg-red-500/80 hover:bg-red-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteScheduleItem(scheduleItem.id)
                              }}
                            >
                              <Trash2Icon className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
