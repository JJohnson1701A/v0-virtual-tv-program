"use client"

import { useState, useEffect } from "react"
import type { Channel } from "@/types/channel"

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load channels from storage
  useEffect(() => {
    const loadChannels = async () => {
      setIsLoading(true)
      try {
        const storedChannels = localStorage.getItem("virtualTvChannels")
        const channelsData: Channel[] = storedChannels ? JSON.parse(storedChannels) : []

        // Sort channels by number
        channelsData.sort((a, b) => a.number - b.number)

        setChannels(channelsData)
      } catch (error) {
        console.error("Error loading channels:", error)
        setChannels([])
      } finally {
        setIsLoading(false)
      }
    }

    loadChannels()
  }, [])

  // Save channels to storage
  const saveChannels = (channelsData: Channel[]) => {
    try {
      localStorage.setItem("virtualTvChannels", JSON.stringify(channelsData))
    } catch (error) {
      console.error("Error saving channels:", error)
    }
  }

  // Add a new channel
  const addChannel = (channelData: Omit<Channel, "id" | "dateCreated">) => {
    const newChannel: Channel = {
      ...channelData,
      id: `channel-${Date.now()}`,
      dateCreated: new Date().toISOString(),
    }

    const updatedChannels = [...channels, newChannel].sort((a, b) => a.number - b.number)
    setChannels(updatedChannels)
    saveChannels(updatedChannels)

    return newChannel
  }

  // Update an existing channel
  const updateChannel = (updatedChannel: Channel) => {
    const updatedChannels = channels
      .map((channel) => (channel.id === updatedChannel.id ? updatedChannel : channel))
      .sort((a, b) => a.number - b.number)

    setChannels(updatedChannels)
    saveChannels(updatedChannels)
  }

  // Delete a channel
  const deleteChannel = (channelId: string) => {
    const updatedChannels = channels.filter((channel) => channel.id !== channelId)
    setChannels(updatedChannels)
    saveChannels(updatedChannels)
  }

  return {
    channels,
    addChannel,
    updateChannel,
    deleteChannel,
    isLoading,
  }
}
