"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { ChannelGrid } from "@/components/channel-grid"
import { CreateChannelDialog } from "@/components/create-channel-dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useChannels } from "@/hooks/use-channels"
import { PlusIcon } from "lucide-react"
import type { Channel } from "@/types/channel"

export default function ChannelCreatorPage() {
  const { channels, addChannel, updateChannel, deleteChannel, isLoading } = useChannels()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editChannel, setEditChannel] = useState<Channel | null>(null)
  const [zoomLevel, setZoomLevel] = useState([100])

  const handleCreateChannel = () => {
    setEditChannel(null)
    setShowCreateDialog(true)
  }

  const handleEditChannel = (channel: Channel) => {
    setEditChannel(channel)
    setShowCreateDialog(true)
  }

  const handleSaveChannel = (channelData: Omit<Channel, "id" | "dateCreated">) => {
    if (editChannel) {
      updateChannel({ ...editChannel, ...channelData })
    } else {
      addChannel(channelData)
    }
    setShowCreateDialog(false)
    setEditChannel(null)
  }

  const handleCancelCreate = () => {
    setShowCreateDialog(false)
    setEditChannel(null)
  }

  return (
    <div className="flex flex-col h-screen">
      <Navigation activeTab="Channel Creator" />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Button Row */}
        <div className="p-4 border-b flex justify-between items-center">
          <Button onClick={handleCreateChannel} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Channel
          </Button>

          <div className="flex items-center gap-4">
            <Label htmlFor="zoom-slider" className="text-sm font-medium">
              Zoom
            </Label>
            <div className="w-32">
              <Slider
                id="zoom-slider"
                min={50}
                max={150}
                step={10}
                value={zoomLevel}
                onValueChange={setZoomLevel}
                className="w-full"
              />
            </div>
            <span className="text-sm text-muted-foreground w-12">{zoomLevel[0]}%</span>
          </div>
        </div>

        {/* Channel Grid */}
        <div className="flex-1 overflow-auto p-4">
          <ChannelGrid
            channels={channels}
            onEditChannel={handleEditChannel}
            onDeleteChannel={deleteChannel}
            zoomLevel={zoomLevel[0]}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Create/Edit Channel Dialog */}
      {showCreateDialog && (
        <CreateChannelDialog channel={editChannel} onSave={handleSaveChannel} onCancel={handleCancelCreate} />
      )}
    </div>
  )
}
