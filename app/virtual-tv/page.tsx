"use client"

import { useState, useEffect, useCallback } from "react"
import { Navigation } from "@/components/navigation"
import { VirtualTVDisplay } from "@/components/virtual-tv/virtual-tv-display"
import { ChannelInfoOverlay } from "@/components/virtual-tv/channel-info-overlay"
import { MediaInfoOverlay } from "@/components/virtual-tv/media-info-overlay"
import { useChannels } from "@/hooks/use-channels"
import { useSettings } from "@/hooks/use-settings"
import { useVirtualTV } from "@/hooks/use-virtual-tv"

export default function VirtualTVPage() {
  const { channels } = useChannels()
  const { settings, updateLastViewedChannel } = useSettings()
  const [currentChannelNumber, setCurrentChannelNumber] = useState<number>(3)
  const [showChannelInfo, setShowChannelInfo] = useState(false)
  const [showMediaInfo, setShowMediaInfo] = useState(false)
  const [channelInputBuffer, setChannelInputBuffer] = useState("")

  const { currentMedia, isStatic } = useVirtualTV(currentChannelNumber)

  // Get current channel object
  const currentChannel = channels.find((c) => c.number === currentChannelNumber)

  // Initialize channel on mount
  useEffect(() => {
    let initialChannel = 3

    if (settings.rememberLastChannel && settings.lastViewedChannel) {
      // Use last viewed channel if it exists
      const lastChannel = channels.find((c) => c.number === settings.lastViewedChannel)
      if (lastChannel) {
        initialChannel = settings.lastViewedChannel
      }
    } else {
      // Use default channel if it exists
      const defaultChannel = channels.find((c) => c.number === settings.defaultChannel)
      if (defaultChannel) {
        initialChannel = settings.defaultChannel
      } else if (channels.length > 0) {
        // Use lowest numbered channel if default doesn't exist
        initialChannel = Math.min(...channels.map((c) => c.number))
      }
    }

    setCurrentChannelNumber(initialChannel)
  }, [channels, settings.rememberLastChannel, settings.lastViewedChannel, settings.defaultChannel])

  // Show channel info when channel changes
  useEffect(() => {
    if (settings.showChannelInfo) {
      setShowChannelInfo(true)
      const timer = setTimeout(() => setShowChannelInfo(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [currentChannelNumber, settings.showChannelInfo])

  // Show media info when media changes
  useEffect(() => {
    if (settings.showMediaInfo && currentMedia) {
      setShowMediaInfo(true)
      const timer = setTimeout(() => setShowMediaInfo(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [currentMedia, settings.showMediaInfo])

  // Update last viewed channel
  useEffect(() => {
    updateLastViewedChannel(currentChannelNumber)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChannelNumber])

  // Get sorted channel numbers
  const getChannelNumbers = () => {
    return channels.map((c) => c.number).sort((a, b) => a - b)
  }

  // Navigate to next channel
  const goToNextChannel = useCallback(() => {
    const channelNumbers = getChannelNumbers()
    if (channelNumbers.length === 0) return

    const currentIndex = channelNumbers.indexOf(currentChannelNumber)
    const nextIndex = (currentIndex + 1) % channelNumbers.length
    setCurrentChannelNumber(channelNumbers[nextIndex])
  }, [currentChannelNumber, channels])

  // Navigate to previous channel
  const goToPreviousChannel = useCallback(() => {
    const channelNumbers = getChannelNumbers()
    if (channelNumbers.length === 0) return

    const currentIndex = channelNumbers.indexOf(currentChannelNumber)
    const prevIndex = currentIndex === 0 ? channelNumbers.length - 1 : currentIndex - 1
    setCurrentChannelNumber(channelNumbers[prevIndex])
  }, [currentChannelNumber, channels])

  // Handle direct channel input
  const handleChannelInput = useCallback(
    (digit: string) => {
      const newBuffer = channelInputBuffer + digit
      setChannelInputBuffer(newBuffer)

      // Check if this forms a valid channel number
      const channelNumber = Number.parseInt(newBuffer)
      const validChannel = channels.find((c) => c.number === channelNumber)

      if (validChannel) {
        setCurrentChannelNumber(channelNumber)
        setChannelInputBuffer("")
      } else {
        // Clear buffer after 2 seconds if no valid channel found
        setTimeout(() => {
          setChannelInputBuffer("")
        }, 2000)
      }
    },
    [channelInputBuffer, channels],
  )

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowUp":
          event.preventDefault()
          goToNextChannel()
          break
        case "ArrowDown":
          event.preventDefault()
          goToPreviousChannel()
          break
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          event.preventDefault()
          handleChannelInput(event.key)
          break
        case "Escape":
          setChannelInputBuffer("")
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goToNextChannel, goToPreviousChannel, handleChannelInput])

  return (
    <div className="flex flex-col h-screen">
      <Navigation activeTab="Virtual TV" />

      <div className="flex-1 relative bg-black overflow-hidden">
        {/* Main TV Display */}
        <VirtualTVDisplay
          channel={currentChannel}
          media={currentMedia}
          isStatic={isStatic}
          onChannelUp={goToNextChannel}
          onChannelDown={goToPreviousChannel}
        />

        {/* Channel Info Overlay */}
        {showChannelInfo && currentChannel && (
          <ChannelInfoOverlay
            channelNumber={currentChannel.number}
            channelName={currentChannel.name}
            onFadeComplete={() => setShowChannelInfo(false)}
          />
        )}

        {/* Media Info Overlay */}
        {showMediaInfo && currentMedia && currentChannel && (
          <MediaInfoOverlay
            media={currentMedia}
            channel={currentChannel}
            onFadeComplete={() => setShowMediaInfo(false)}
          />
        )}

        {/* Channel Input Buffer Display */}
        {channelInputBuffer && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white text-6xl font-bold px-8 py-4 rounded">
            {channelInputBuffer}
          </div>
        )}
      </div>
    </div>
  )
}
