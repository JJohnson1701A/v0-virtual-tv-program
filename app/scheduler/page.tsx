"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { ChannelList } from "@/components/scheduler/channel-list"
import { ScheduleGrid } from "@/components/scheduler/schedule-grid"
import { ScheduleMediaDialog } from "@/components/scheduler/schedule-media-dialog"
import { Button } from "@/components/ui/button"
import { useChannels } from "@/hooks/use-channels"
import { useSchedule } from "@/hooks/use-schedule"
import { useSettings } from "@/hooks/use-settings"
import { useToast } from "@/hooks/use-toast"
import { CalendarIcon } from "lucide-react"
import type { ScheduleItem, TimeSlot } from "@/types/schedule"

export default function SchedulerPage() {
  const { channels, isLoading: channelsLoading } = useChannels()
  const { settings } = useSettings()
  const { toast } = useToast()
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null)
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  const { scheduleItems, addScheduleItems, updateScheduleItems, deleteScheduleItem } = useSchedule(selectedChannelId)

  const selectedChannel = channels.find((c) => c.id === selectedChannelId)

  const handleTimeSlotClick = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot)
    setEditingItem(null)
    setShowScheduleDialog(true)
  }

  const handleScheduleMedia = (scheduleDataArray: Omit<ScheduleItem, "id">[]) => {
    if (editingItem) {
      // Update existing item(s)
      updateScheduleItems(editingItem.id, scheduleDataArray)
    } else {
      // Add new item(s)
      addScheduleItems(scheduleDataArray)
    }
    setShowScheduleDialog(false)
    setSelectedTimeSlot(null)
    setEditingItem(null)
  }

  const handleEditScheduleItem = (item: ScheduleItem) => {
    // Convert schedule item back to time slot format for editing
    setSelectedTimeSlot({
      dayOfWeek: item.dayOfWeek,
      time: item.startTime,
    })
    setEditingItem(item)
    setShowScheduleDialog(true)
  }

  const handleDeleteScheduleItem = (itemId: string) => {
    deleteScheduleItem(itemId)
  }

  const handleCancelSchedule = () => {
    setShowScheduleDialog(false)
    setSelectedTimeSlot(null)
    setEditingItem(null)
  }

  const handleAutoSchedule = () => {
    // Mock auto-schedule functionality
    toast({
      title: "Auto-Schedule Started",
      description: "Automatically filling empty time slots with appropriate media from your library...",
    })

    // In a real implementation, this would:
    // 1. Analyze empty time slots across all channels
    // 2. Match appropriate media based on settings (safe harbor, audience match, etc.)
    // 3. Fill the schedule automatically
    // 4. Respect channel-specific media assignments
    // 5. Handle filler content appropriately

    setTimeout(() => {
      toast({
        title: "Auto-Schedule Complete",
        description: "Schedule has been automatically filled. Review the changes in each channel.",
      })
    }, 2000)
  }

  const handleRefreshSchedule = () => {
    // Mock refresh schedule functionality
    toast({
      title: "Refresh Schedule Started",
      description: "Re-running auto-scheduler with updated media library while preserving manual schedules...",
    })

    // In a real implementation, this would:
    // 1. Identify manually scheduled items (preserve them)
    // 2. Clear auto-scheduled items only
    // 3. Re-run auto-scheduler with current media library
    // 4. Fill empty slots with new/updated media
    // 5. Respect all settings (safe harbor, audience match, etc.)

    setTimeout(() => {
      toast({
        title: "Refresh Schedule Complete",
        description: "Schedule has been refreshed with your updated media library. Manual schedules preserved.",
      })
    }, 2000)
  }

  return (
    <div className="flex flex-col h-screen">
      <Navigation activeTab="Scheduler" />

      <div className="flex flex-1 overflow-hidden">
        {/* Channel List */}
        <div className="w-64 border-r">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-medium text-sm">Channels</h3>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  onClick={handleAutoSchedule}
                  disabled={!settings.autoSchedule}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                >
                  <CalendarIcon className="h-3 w-3" />
                  Auto-Schedule
                </Button>
                <Button
                  size="sm"
                  onClick={handleRefreshSchedule}
                  disabled={!settings.autoSchedule}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                >
                  <img src="/icons/refresh.png" alt="Refresh" className="h-3 w-3" />
                  Refresh Schedule
                </Button>
              </div>
            </div>
            <ChannelList
              channels={channels}
              selectedChannelId={selectedChannelId}
              onChannelSelect={setSelectedChannelId}
              isLoading={channelsLoading}
            />
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="flex-1">
          {selectedChannel ? (
            <ScheduleGrid
              channel={selectedChannel}
              scheduleItems={scheduleItems}
              onTimeSlotClick={handleTimeSlotClick}
              onEditScheduleItem={handleEditScheduleItem}
              onDeleteScheduleItem={handleDeleteScheduleItem}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Select a Channel</h3>
                <p>Choose a channel from the list to view and edit its schedule.</p>
                {!settings.autoSchedule && (
                  <p className="text-sm text-orange-600 mt-2">
                    Auto-Schedule is disabled. Enable it in Settings to use automatic scheduling.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Media Dialog */}
      {showScheduleDialog && selectedTimeSlot && selectedChannel && (
        <ScheduleMediaDialog
          channel={selectedChannel}
          timeSlot={selectedTimeSlot}
          existingItem={editingItem}
          onSchedule={handleScheduleMedia}
          onCancel={handleCancelSchedule}
        />
      )}
    </div>
  )
}
