"use client"

import { useState, useEffect } from "react"
import type { ScheduleItem } from "@/types/schedule"

export function useSchedule(channelId: string | null) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load schedule items for the selected channel
  useEffect(() => {
    if (!channelId) {
      setScheduleItems([])
      setIsLoading(false)
      return
    }

    const loadSchedule = async () => {
      setIsLoading(true)
      try {
        const storedSchedules = localStorage.getItem("virtualTvSchedules")
        const allSchedules: ScheduleItem[] = storedSchedules ? JSON.parse(storedSchedules) : []

        // Filter schedules for the selected channel
        const channelSchedules = allSchedules.filter((item) => item.channelId === channelId)
        setScheduleItems(channelSchedules)
      } catch (error) {
        console.error("Error loading schedule:", error)
        setScheduleItems([])
      } finally {
        setIsLoading(false)
      }
    }

    loadSchedule()
  }, [channelId])

  // Save all schedules to storage
  const saveSchedules = (newScheduleItems: ScheduleItem[]) => {
    try {
      // Get all schedules from storage
      const storedSchedules = localStorage.getItem("virtualTvSchedules")
      const allSchedules: ScheduleItem[] = storedSchedules ? JSON.parse(storedSchedules) : []

      // Remove schedules for current channel
      const otherChannelSchedules = allSchedules.filter((item) => item.channelId !== channelId)

      // Add updated schedules for current channel
      const updatedSchedules = [...otherChannelSchedules, ...newScheduleItems]

      localStorage.setItem("virtualTvSchedules", JSON.stringify(updatedSchedules))
    } catch (error) {
      console.error("Error saving schedules:", error)
    }
  }

  // Add schedule items (can be multiple for weekdays)
  const addScheduleItems = (scheduleDataArray: Omit<ScheduleItem, "id">[]): ScheduleItem[] => {
    const newItems: ScheduleItem[] = scheduleDataArray.map((scheduleData, index) => ({
      ...scheduleData,
      id: `schedule-${Date.now()}-${index}`,
    }))

    const updatedItems = [...scheduleItems, ...newItems]
    setScheduleItems(updatedItems)
    saveSchedules(updatedItems)

    return newItems
  }

  // Update schedule items (handles both single and multiple items)
  const updateScheduleItems = (
    originalItemId: string,
    newScheduleDataArray: Omit<ScheduleItem, "id">[],
  ): ScheduleItem[] => {
    // Find the original item to get its media info for finding related items
    const originalItem = scheduleItems.find((item) => item.id === originalItemId)
    if (!originalItem) return []

    // Remove all related items (same media, time, and channel)
    // This handles both single items and weekday groups
    const filteredItems = scheduleItems.filter(
      (item) =>
        !(
          item.mediaId === originalItem.mediaId &&
          item.startTime === originalItem.startTime &&
          item.channelId === originalItem.channelId
        ),
    )

    // Create new items
    const newItems: ScheduleItem[] = newScheduleDataArray.map((scheduleData, index) => ({
      ...scheduleData,
      id: `schedule-${Date.now()}-${index}`,
    }))

    const updatedItems = [...filteredItems, ...newItems]
    setScheduleItems(updatedItems)
    saveSchedules(updatedItems)

    return newItems
  }

  // Delete a schedule item and any related items (for weekday groups)
  const deleteScheduleItem = (itemId: string) => {
    const itemToDelete = scheduleItems.find((item) => item.id === itemId)
    if (!itemToDelete) return

    // Remove the item and any related items (same media, time, and channel)
    const updatedItems = scheduleItems.filter(
      (item) =>
        !(
          item.mediaId === itemToDelete.mediaId &&
          item.startTime === itemToDelete.startTime &&
          item.channelId === itemToDelete.channelId
        ),
    )

    setScheduleItems(updatedItems)
    saveSchedules(updatedItems)
  }

  // Legacy single item functions for backward compatibility
  const addScheduleItem = (scheduleData: Omit<ScheduleItem, "id">) => {
    return addScheduleItems([scheduleData])[0]
  }

  const updateScheduleItem = (updatedItem: ScheduleItem) => {
    const updatedItems = scheduleItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    setScheduleItems(updatedItems)
    saveSchedules(updatedItems)
  }

  return {
    scheduleItems,
    addScheduleItem,
    addScheduleItems,
    updateScheduleItem,
    updateScheduleItems,
    deleteScheduleItem,
    isLoading,
  }
}
