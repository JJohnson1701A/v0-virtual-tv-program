"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { Channel } from "@/types/channel"

interface ChannelListProps {
  channels: Channel[]
  selectedChannelId: string | null
  onChannelSelect: (channelId: string) => void
  isLoading: boolean
}

export function ChannelList({ channels, selectedChannelId, onChannelSelect, isLoading }: ChannelListProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-500">Loading channels...</div>
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div className="p-4">
        <div className="text-sm text-gray-500">No channels created yet.</div>
        <div className="text-xs text-gray-400 mt-1">Create channels in the Channel Creator tab.</div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onChannelSelect(channel.id)}
            className={`w-full text-left p-2 rounded text-sm hover:bg-gray-100 transition-colors ${
              selectedChannelId === channel.id ? "bg-blue-100 border border-blue-300" : ""
            }`}
          >
            <div className="font-medium">
              {channel.number} - {channel.name}
            </div>
            {channel.signOff && (
              <div className="text-xs text-gray-500 mt-1">
                Sign-off: {channel.signOffTime} - {channel.signOnTime}
              </div>
            )}
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}
