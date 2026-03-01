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
import { useAutoScheduler } from "@/hooks/use-auto-scheduler"
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
  const { autoScheduleChannel } = useAutoScheduler()

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
    if (!selectedChannel) {
      toast({
        title: "No Channel Selected",
        description: "Please select a channel to auto-schedule.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Auto-Schedule Started",
      description: `Filling empty time slots on ${selectedChannel.name}...`,
    })

    // Get all existing schedules for this channel
    const storedSchedules = localStorage.getItem("virtualTvSchedules")
    const allSchedules: ScheduleItem[] = storedSchedules ? JSON.parse(storedSchedules) : []

    // Run auto-scheduler for the selected channel
    const { newItems, result } = autoScheduleChannel(selectedChannel, settings, allSchedules)

    if (newItems.length > 0) {
      // Add the new schedule items
      addScheduleItems(newItems)

      toast({
        title: "Auto-Schedule Complete",
        description: `Scheduled ${result.scheduled} items. ${result.skipped} slots skipped (no suitable media).`,
      })
    } else if (result.errors.length > 0) {
      toast({
        title: "Auto-Schedule Failed",
        description: result.errors[0],
        variant: "destructive",
      })
    } else {
      toast({
        title: "Auto-Schedule Complete",
        description: "No empty slots to fill or no suitable media found.",
      })
    }
  }

  const handleRefreshSchedule = () => {
    if (!selectedChannel) {
      toast({
        title: "No Channel Selected",
        description: "Please select a channel to refresh schedule.",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Refresh Schedule Started",
      description: `Re-running auto-scheduler on ${selectedChannel.name}...`,
    })

    // Get all existing schedules
    const storedSchedules = localStorage.getItem("virtualTvSchedules")
    const allSchedules: ScheduleItem[] = storedSchedules ? JSON.parse(storedSchedules) : []

    // For now, refresh just re-runs auto-schedule on empty slots
    // In a more advanced implementation, we could track which items were auto-scheduled
    // and clear only those before re-running
    const { newItems, result } = autoScheduleChannel(selectedChannel, settings, allSchedules)

    if (newItems.length > 0) {
      addScheduleItems(newItems)

      toast({
        title: "Refresh Schedule Complete",
        description: `Added ${result.scheduled} new items to empty slots.`,
      })
    } else {
      toast({
        title: "Refresh Schedule Complete",
        description: "No new slots to fill.",
      })
    }
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
                  disabled={!settings.autoSchedule || !selectedChannelId}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                  title={!settings.autoSchedule ? "Enable Auto-Schedule in Settings" : !selectedChannelId ? "Select a channel first" : "Auto-fill empty slots"}
                >
                  <CalendarIcon className="h-3 w-3" />
                  Auto-Schedule
                </Button>
                <Button
                  size="sm"
                  onClick={handleRefreshSchedule}
                  disabled={!settings.autoSchedule || !selectedChannelId}
                  className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                  title={!settings.autoSchedule ? "Enable Auto-Schedule in Settings" : !selectedChannelId ? "Select a channel first" : "Re-run auto-scheduler"}
                >
                  <CalendarIcon className="h-3 w-3" />
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
