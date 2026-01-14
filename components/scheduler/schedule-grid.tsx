"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2Icon, Trash2Icon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import type { Channel } from "@/types/channel"
import type { ScheduleItem, TimeSlot } from "@/types/schedule"
import { useBlocksMarathons } from "@/hooks/use-blocks-marathons" // Added to load blocks/marathons

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
  const { blocks, marathons } = useBlocksMarathons() // Load blocks and marathons

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
        const itemSpan = getItemSpan(item.runtime || 30)
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
      onTimeSlotClick({ dayOfWeek: dayIndex, time: timeSlot })
    }
  }

  const currentWeekOption = weekOptions[selectedWeek]

  const getBlockDetails = (scheduleItem: ScheduleItem) => {
    if (scheduleItem.mediaType === "block") {
      const block = blocks.find((b) => b.id === scheduleItem.mediaId)
      if (block && block.mediaItems.length > 0) {
        return {
          blockName: block.name,
          seriesName: block.mediaItems[0].title,
        }
      }
    } else if (scheduleItem.mediaType === "marathon") {
      const marathon = marathons.find((m) => m.id === scheduleItem.mediaId)
      if (marathon && marathon.episodes.length > 0) {
        return {
          blockName: marathon.name,
          seriesName: marathon.episodes[0].title,
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
              {DAYS.map((day) => (
                <div key={day} className="p-2 border-r font-medium text-sm text-center bg-gray-50">
                  {day}
                </div>
              ))}
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

                    return (
                      <div
                        key={`${day}-${timeSlot.time12}`}
                        className={`p-1 border-r min-h-[40px] relative cursor-pointer transition-colors ${
                          scheduleItem ? "" : "hover:bg-blue-50"
                        }`}
                        style={{
                          backgroundColor: scheduleItem ? getItemColor(scheduleItem.id) : "transparent",
                        }}
                        onClick={() => handleSlotClick(dayIndex, timeSlot.time12)}
                        onMouseEnter={() => setHoveredSlot(slotKey)}
                        onMouseLeave={() => setHoveredSlot(null)}
                      >
                        {isFirstSlotOfItem && scheduleItem && (
                          <div className="text-xs font-medium text-white p-1 rounded">
                            {scheduleItem.mediaType === "block" || scheduleItem.mediaType === "marathon"
                              ? (() => {
                                  const details = getBlockDetails(scheduleItem)
                                  return details ? (
                                    <>
                                      <div>{truncateTitle(details.blockName)}</div>
                                      <div className="text-[10px] opacity-90">{truncateTitle(details.seriesName)}</div>
                                    </>
                                  ) : (
                                    truncateTitle(scheduleItem.title)
                                  )
                                })()
                              : truncateTitle(scheduleItem.title)}
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
