"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { FileUpload } from "@/components/file-upload"
import { MediaSelector } from "@/components/media-selector"
import { DragDropEpisodeList } from "@/components/blocks-marathons/drag-drop-episode-list"
import { useChannels } from "@/hooks/use-channels"
import { useMediaLibrary } from "@/hooks/use-media-library"
import type {
  Marathon,
  BlockOccurrence,
  MarathonFillerSource,
  BlockFillStyle,
  BlockRepeat,
  OverlayPosition,
  MarathonEpisode,
} from "@/types/blocks-marathons"
import type { MediaItem } from "@/types/media"

interface CreateMarathonDialogProps {
  marathon: Marathon | null
  onSave: (marathon: Omit<Marathon, "id" | "dateCreated">) => void
  onCancel: () => void
}

const overlayPositions: { value: OverlayPosition; label: string }[] = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
]

const occurrenceOptions: { value: BlockOccurrence; label: string }[] = [
  { value: "weekly", label: "Weekly (on the same day)" },
  { value: "weekdays", label: "Weekdays (Monday to Friday)" },
  { value: "annual", label: "Annual" },
  { value: "once", label: "Once" },
]

const durationOptions = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1 hour 30 min" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2 hours 30 min" },
  { value: 180, label: "3 hours" },
  { value: 210, label: "3 hours 30 min" },
  { value: 240, label: "4 hours" },
  { value: 300, label: "5 hours" },
  { value: 360, label: "6 hours" },
  { value: 480, label: "8 hours" },
  { value: 720, label: "12 hours" },
  { value: 1440, label: "24 hours" },
]

const fillerSourceOptions: { value: MarathonFillerSource; label: string }[] = [
  { value: "marathon", label: "Marathon" },
  { value: "marathon-channel", label: "Marathon+Channel" },
  { value: "all", label: "All" },
  { value: "none", label: "None" },
]

const fillStyleOptions: { value: BlockFillStyle; label: string }[] = [
  { value: "intermixed", label: "Intermixed" },
  { value: "at-end", label: "At End" },
  { value: "at-beginning", label: "At Beginning" },
  { value: "none", label: "None" },
  { value: "static", label: "Static" },
]

const repeatOptions: { value: BlockRepeat; label: string }[] = [
  { value: "restart", label: "Restart at Beginning" },
  { value: "end", label: "End" },
]

export function CreateMarathonDialog({ marathon, onSave, onCancel }: CreateMarathonDialogProps) {
  const { channels } = useChannels()
  const { mediaItems: allMovies } = useMediaLibrary("movies", "a-z")
  const { mediaItems: allTVShows } = useMediaLibrary("tvshows", "a-z")

  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    overlay: "",
    overlayPosition: "bottom-right" as OverlayPosition,
    occurrence: "weekly" as BlockOccurrence,
    annualDate: "",
    duration: 120,
    channelId: "",
    fillerSource: "marathon" as MarathonFillerSource,
    fillStyle: "at-end" as BlockFillStyle,
    repeat: "restart" as BlockRepeat,
    episodes: [] as MarathonEpisode[],
  })

  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([])

  useEffect(() => {
    if (marathon) {
      setFormData({
        name: marathon.name,
        logo: marathon.logo || "",
        overlay: marathon.overlay || "",
        overlayPosition: marathon.overlayPosition,
        occurrence: marathon.occurrence,
        annualDate: marathon.annualDate || "",
        duration: marathon.duration,
        channelId: marathon.channelId || "",
        fillerSource: marathon.fillerSource,
        fillStyle: marathon.fillStyle,
        repeat: marathon.repeat,
        episodes: marathon.episodes,
      })

      // Extract unique media IDs from episodes
      const mediaIds = [...new Set(marathon.episodes.map((ep) => ep.mediaId))]
      setSelectedMediaIds(mediaIds)
    }
  }, [marathon])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMediaSelection = (selectedMedia: MediaItem[]) => {
    setSelectedMediaIds(selectedMedia.map((media) => media.id))

    // Generate episodes list from selected media
    const newEpisodes: MarathonEpisode[] = []
    let orderIndex = 0

    selectedMedia.forEach((media) => {
      if (media.type === "movies") {
        newEpisodes.push({
          id: `episode-${Date.now()}-${orderIndex}`,
          mediaId: media.id,
          title: media.title,
          runtime: media.runtime || 120,
          order: orderIndex++,
        })
      } else if (media.type === "tvshows" && media.episodes) {
        media.episodes.forEach((episode) => {
          newEpisodes.push({
            id: `episode-${Date.now()}-${orderIndex}`,
            mediaId: media.id,
            episodeId: episode.id,
            title: `${media.title} - S${episode.seasonNumber}E${episode.episodeNumber}: ${episode.title}`,
            runtime: media.runtime || 30,
            order: orderIndex++,
          })
        })
      }
    })

    handleInputChange("episodes", newEpisodes)
  }

  const handleEpisodeReorder = (reorderedEpisodes: MarathonEpisode[]) => {
    const updatedEpisodes = reorderedEpisodes.map((episode, index) => ({
      ...episode,
      order: index,
    }))
    handleInputChange("episodes", updatedEpisodes)
  }

  const handleSave = () => {
    const marathonData = {
      name: formData.name,
      logo: formData.logo,
      overlay: formData.overlay,
      overlayPosition: formData.overlayPosition,
      occurrence: formData.occurrence,
      annualDate: formData.occurrence === "annual" ? formData.annualDate : undefined,
      duration: formData.duration,
      channelId: formData.channelId || undefined,
      fillerSource: formData.fillerSource,
      fillStyle: formData.fillStyle,
      repeat: formData.repeat,
      episodes: formData.episodes,
    }
    onSave(marathonData)
  }

  const isValid = formData.name.trim() && (formData.occurrence !== "annual" || formData.annualDate)

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{marathon ? "Edit Marathon" : "Create Marathon"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="marathon-name">Name</Label>
              <Input
                id="marathon-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter marathon name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <p className="text-sm text-muted-foreground">For use in program and electronic program guide</p>
                <FileUpload
                  value={formData.logo}
                  onChange={(value) => handleInputChange("logo", value)}
                  accept="image/*"
                  placeholder="Upload logo"
                />
              </div>

              <div className="space-y-2">
                <Label>Overlay</Label>
                <p className="text-sm text-muted-foreground">For display during media playback</p>
                <FileUpload
                  value={formData.overlay}
                  onChange={(value) => handleInputChange("overlay", value)}
                  accept="image/*"
                  placeholder="Upload overlay"
                />
              </div>
            </div>

            {formData.overlay && (
              <div className="space-y-2">
                <Label>Overlay Position</Label>
                <Select
                  value={formData.overlayPosition}
                  onValueChange={(value) => handleInputChange("overlayPosition", value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {overlayPositions.map((position) => (
                      <SelectItem key={position.value} value={position.value}>
                        {position.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Scheduling */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Occurrence</Label>
                <Select value={formData.occurrence} onValueChange={(value) => handleInputChange("occurrence", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {occurrenceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.occurrence === "annual" && (
                <div className="space-y-2">
                  <Label>Annual Date</Label>
                  <Input
                    type="date"
                    value={formData.annualDate}
                    onChange={(e) => handleInputChange("annualDate", e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={formData.duration.toString()}
                onValueChange={(value) => handleInputChange("duration", Number.parseInt(value))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Channel Assignment */}
          <div className="space-y-2">
            <Label>Channel</Label>
            <Select value={formData.channelId} onValueChange={(value) => handleInputChange("channelId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select channel (optional)" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.number} - {channel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Filler Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Filler Source</Label>
                <Select
                  value={formData.fillerSource}
                  onValueChange={(value) => handleInputChange("fillerSource", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fillerSourceOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fill Style</Label>
                <Select value={formData.fillStyle} onValueChange={(value) => handleInputChange("fillStyle", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fillStyleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Media Selection */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Media Selection</Label>
              <p className="text-sm text-muted-foreground">
                Select movies and TV shows to include in this marathon. All episodes will be listed below for
                reordering.
              </p>
            </div>
            <MediaSelector
              selectedMediaIds={selectedMediaIds}
              onSelectionChange={handleMediaSelection}
              allowMultiple={true}
              disableChannelSpecific={!formData.channelId}
              restrictToMoviesAndTVShows={true}
            />
          </div>

          {/* Episode Order */}
          {formData.episodes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Episode Order</Label>
                  <p className="text-sm text-muted-foreground">
                    Drag and drop to reorder how episodes and movies will play in the marathon.
                  </p>
                </div>
                <DragDropEpisodeList episodes={formData.episodes} onReorder={handleEpisodeReorder} />
              </div>
            </>
          )}

          <Separator />

          {/* Repeat Settings */}
          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select value={formData.repeat} onValueChange={(value) => handleInputChange("repeat", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {repeatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
