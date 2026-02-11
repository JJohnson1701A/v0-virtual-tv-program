"use client"

import { useState, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { ChannelGrid } from "@/components/channel-grid"
import { CreateChannelDialog } from "@/components/create-channel-dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useChannels } from "@/hooks/use-channels"
import { useImportExport } from "@/hooks/use-import-export"
import { PlusIcon, DownloadIcon, UploadIcon } from "lucide-react"
import type { Channel } from "@/types/channel"

export default function ChannelCreatorPage() {
  const { channels, addChannel, updateChannel, deleteChannel, isLoading } = useChannels()
  const { exportChannels, importChannels } = useImportExport()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editChannel, setEditChannel] = useState<Channel | null>(null)
  const [zoomLevel, setZoomLevel] = useState([100])
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const importFileRef = useRef<HTMLInputElement>(null)

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

  const handleExportChannels = async () => {
    setIsExporting(true)
    try {
      const data = await exportChannels()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `channels-export-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to export channels. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportChannels = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const result = await importChannels(file)
      alert(`Successfully imported ${result.count} channel(s). The page will reload.`)
      window.location.reload()
    } catch (error: any) {
      console.error("Import failed:", error)
      alert(error.message || "Failed to import channels. Please check the file format.")
    } finally {
      setIsImporting(false)
      // Reset file input so the same file can be re-selected
      if (importFileRef.current) importFileRef.current.value = ""
    }
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
            <input
              ref={importFileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportChannels}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => importFileRef.current?.click()}
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              <UploadIcon className="h-4 w-4" />
              {isImporting ? "Importing..." : "Import"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportChannels}
              disabled={isExporting || channels.length === 0}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export"}
            </Button>

            <div className="w-px h-6 bg-border" />

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
