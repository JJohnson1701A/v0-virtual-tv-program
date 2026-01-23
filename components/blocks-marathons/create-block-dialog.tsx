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
import { useChannels } from "@/hooks/use-channels"
import type {
  Block,
  BlockOccurrence,
  BlockOrder,
  BlockFillerSource,
  BlockFillStyle,
  BlockRepeat,
  OverlayPosition,
  BlockMediaItem,
} from "@/types/blocks-marathons"
import type { MediaItem } from "@/types/media"
import { useMediaLibrary } from "@/hooks/use-media-library"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CreateBlockDialogProps {
  block: Block | null
  onSave: (block: Omit<Block, "id" | "dateCreated">) => void
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

const dayOptions = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
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

const orderOptions: { value: BlockOrder; label: string }[] = [
  { value: "chronological", label: "Chronological" },
  { value: "shuffle", label: "Shuffle" },
  { value: "random", label: "Random" },
]

const fillerSourceOptions: { value: BlockFillerSource; label: string }[] = [
  { value: "block", label: "Block" },
  { value: "block-channel", label: "Block+Channel" },
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
  { value: "followup", label: "Play Followup" },
  { value: "end", label: "End" },
]

const generateTimeOptions = () => {
  const times: { value: string; label: string }[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const period = hour >= 12 ? "PM" : "AM"
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      const timeValue = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`
      const timeLabel = `${displayHour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")} ${period}`
      times.push({ value: timeValue, label: timeLabel })
    }
  }
  return times
}

const timeOptions = generateTimeOptions()

export function CreateBlockDialog({ block, onSave, onCancel }: CreateBlockDialogProps) {
  const { channels } = useChannels()
  const { tvshows } = useMediaLibrary()
  const [formData, setFormData] = useState({
    name: "",
    logo: "",
    overlay: "",
    overlayPosition: "bottom-right" as OverlayPosition,
    occurrence: "weekly" as BlockOccurrence,
    annualDate: "",
    dayOfWeek: 1, // Added dayOfWeek field, default to Monday
    startTime: "20:00",
    duration: 60,
    order: "chronological" as BlockOrder,
    channelId: "",
    fillerSource: "block" as BlockFillerSource,
    fillStyle: "at-end" as BlockFillStyle,
    repeat: "restart" as BlockRepeat,
    mediaItems: [] as BlockMediaItem[],
  })
  const [startingDate, setStartingDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })

  useEffect(() => {
    if (block) {
      setFormData({
        name: block.name,
        logo: block.logo || "",
        overlay: block.overlay || "",
        overlayPosition: block.overlayPosition,
        occurrence: block.occurrence,
        annualDate: block.annualDate || "",
        dayOfWeek: block.dayOfWeek ?? 1, // Load dayOfWeek from block
        startTime: block.startTime || "20:00",
        duration: block.duration,
        order: block.order,
        channelId: block.channelId || "",
        fillerSource: block.fillerSource,
        fillStyle: block.fillStyle,
        repeat: block.repeat,
        mediaItems: block.mediaItems,
      })
    }
  }, [block])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMediaSelection = (selectedMedia: MediaItem[]) => {
    const newMediaItems: BlockMediaItem[] = selectedMedia.map((media, index) => ({
      id: `media-${Date.now()}-${index}`,
      mediaId: media.id,
      mediaType: media.type,
      title: media.title,
      runtime: media.runtime || 30,
      order: index,
    }))
    handleInputChange("mediaItems", newMediaItems)
  }

  const handleMediaReorder = (reorderedItems: BlockMediaItem[]) => {
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index,
    }))
    handleInputChange("mediaItems", updatedItems)
  }

  const handleFollowupChange = (mediaItemId: string, followupMediaId: string) => {
    const updatedItems = formData.mediaItems.map((item) =>
      item.id === mediaItemId ? { ...item, followupMediaId } : item,
    )
    handleInputChange("mediaItems", updatedItems)
  }

  const handleSlotMediaChange = (index: number, value: string) => {
    const updatedItems = formData.mediaItems.map((item, idx) => (idx === index ? { ...item, mediaId: value } : item))
    handleInputChange("mediaItems", updatedItems)
  }

  const handleSave = () => {
    const blockData = {
      name: formData.name,
      logo: formData.logo,
      overlay: formData.overlay,
      overlayPosition: formData.overlayPosition,
      occurrence: formData.occurrence,
      annualDate: formData.occurrence === "annual" ? formData.annualDate : undefined,
      dayOfWeek: formData.occurrence === "weekly" ? formData.dayOfWeek : undefined, // Include dayOfWeek for weekly blocks
      startTime: formData.startTime,
      duration: formData.duration,
      order: formData.order,
      channelId: formData.channelId || undefined,
      fillerSource: formData.fillerSource,
      fillStyle: formData.fillStyle,
      repeat: formData.repeat,
      mediaItems: formData.mediaItems,
    }
    onSave(blockData)
  }

  const isValid = formData.name.trim() && (formData.occurrence !== "annual" || formData.annualDate)

  // Calculate series schedule information
  const getSeriesScheduleInfo = () => {
    // Get unique series in the block
    const uniqueSeries = formData.mediaItems.reduce((acc, item) => {
      if (!acc.find((existing) => existing.mediaId === item.mediaId)) {
        acc.push(item)
      }
      return acc
    }, [] as BlockMediaItem[])

    // For each unique series, calculate episode count and end date
    return uniqueSeries.map((seriesItem) => {
      // Find the full media item to get episode count
      const fullMedia = (tvshows || []).find((show) => show.id === seriesItem.mediaId)
      const episodeCount = fullMedia?.episodes?.length || seriesItem.episodes || 1

      // Calculate end date based on occurrence
      const start = new Date(startingDate + "T12:00:00")
      let endDate = new Date(start)

      if (formData.occurrence === "weekly") {
        // Weekly: add (episodeCount - 1) weeks
        endDate.setDate(endDate.getDate() + (episodeCount - 1) * 7)
      } else if (formData.occurrence === "weekdays") {
        // Weekdays: calculate based on 5 days per week
        const weeksNeeded = Math.ceil(episodeCount / 5)
        const remainingDays = (episodeCount - 1) % 5
        endDate.setDate(endDate.getDate() + (weeksNeeded - 1) * 7 + remainingDays)
      } else {
        // Once or annual: same day
        endDate = start
      }

      // Format dates as MM-DD-YY
      const formatDate = (date: Date) => {
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const day = String(date.getDate()).padStart(2, "0")
        const year = String(date.getFullYear()).slice(-2)
        return `${month}-${day}-${year}`
      }

      return {
        title: seriesItem.title,
        runtime: seriesItem.runtime,
        episodeCount,
        startingOn: formatDate(start),
        endingOn: formatDate(endDate),
      }
    })
  }

  const calculateSlots = () => {
    const numSlots = formData.duration / 30
    const slots: { slotNumber: number; startTime: string; endTime: string }[] = []

    // Parse startTime from formData (format: "HH:MM")
    const [startHour, startMin] = formData.startTime.split(":").map(Number)
    let currentMinutes = startHour * 60 + startMin

    for (let i = 0; i < numSlots; i++) {
      const startHour = Math.floor(currentMinutes / 60) % 24
      const startMin = currentMinutes % 60
      const endMinutes = currentMinutes + 30
      const endHour = Math.floor(endMinutes / 60) % 24
      const endMin = endMinutes % 60

      const formatTime = (hour: number, min: number) => {
        const period = hour >= 12 ? "PM" : "AM"
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")} ${period}`
      }

      slots.push({
        slotNumber: i + 1,
        startTime: formatTime(startHour, startMin),
        endTime: formatTime(endHour, endMin),
      })

      currentMinutes += 30
    }

    return slots
  }

  const getFollowUpOptions = (currentMediaId: string) => {
    const uniqueMedia = formData.mediaItems.reduce((acc, item) => {
      if (!acc.find((existing) => existing.mediaId === item.mediaId)) {
        acc.push(item)
      }
      return acc
    }, [] as BlockMediaItem[])

    return uniqueMedia.filter((item) => item.mediaId !== currentMediaId).sort((a, b) => a.title.localeCompare(b.title))
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{block ? "Edit Block" : "Create Block"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="block-name">Name</Label>
              <Input
                id="block-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter block name"
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

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select value={formData.startTime} onValueChange={(value) => handleInputChange("startTime", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.occurrence === "weekly" && (
              <div className="space-y-2">
                <Label>Day of the Week</Label>
                <Select
                  value={formData.dayOfWeek.toString()}
                  onValueChange={(value) => handleInputChange("dayOfWeek", Number.parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={formData.duration.toString()}
                  onValueChange={(value) => handleInputChange("duration", Number.parseInt(value))}
                >
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label>Order</Label>
                <Select value={formData.order} onValueChange={(value) => handleInputChange("order", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Series Schedule Section */}
            {formData.mediaItems.length > 0 && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Starting Date</Label>
                  <Input
                    type="date"
                    value={startingDate}
                    onChange={(e) => setStartingDate(e.target.value)}
                    className="w-48"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Series Schedule</Label>
                  <p className="text-sm text-muted-foreground">
                    Estimated schedule for each series in this block based on episode count and occurrence.
                  </p>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Series</TableHead>
                          <TableHead className="w-24">Runtime</TableHead>
                          <TableHead className="w-28">Episodes</TableHead>
                          <TableHead className="w-28">Starting on</TableHead>
                          <TableHead className="w-28">Ending on</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSeriesScheduleInfo().map((series) => (
                          <TableRow key={series.title}>
                            <TableCell className="font-medium">{series.title}</TableCell>
                            <TableCell>{series.runtime} min</TableCell>
                            <TableCell>{series.episodeCount} episode{series.episodeCount !== 1 ? "s" : ""}</TableCell>
                            <TableCell>{series.startingOn}</TableCell>
                            <TableCell>{series.endingOn}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
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
                Select media to include in this block. You can reorder them below.
              </p>
            </div>
            <MediaSelector
              selectedMediaIds={formData.mediaItems.map((item) => item.mediaId)}
              onSelectionChange={handleMediaSelection}
              allowMultiple={true}
              disableChannelSpecific={!formData.channelId}
            />
          </div>

          {/* Media Order and Followup */}
          {formData.mediaItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Media Order</Label>
                  <p className="text-sm text-muted-foreground">Assign media to specific time slots in the block.</p>
                </div>

                <div className="space-y-2">
                  {calculateSlots().map((slot, index) => {
                    const assignedMedia = formData.mediaItems[index]
                    const isDisabled = assignedMedia && (assignedMedia as any).isSpan

                    const uniqueMediaItems = formData.mediaItems.reduce((acc, item) => {
                      if (!acc.find((existing) => existing.mediaId === item.mediaId)) {
                        acc.push(item)
                      }
                      return acc
                    }, [] as BlockMediaItem[])

                    return (
                      <div key={slot.slotNumber} className="flex items-center gap-3">
                        <div className="text-sm font-medium w-48">
                          Slot {slot.slotNumber} ({slot.startTime}-{slot.endTime})
                        </div>
                        <Select
                          value={assignedMedia?.mediaId || ""}
                          onValueChange={(value) => handleSlotMediaChange(index, value)}
                          disabled={isDisabled}
                        >
                          <SelectTrigger className={isDisabled ? "opacity-50" : ""}>
                            <SelectValue placeholder="Select media" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueMediaItems
                              .sort((a, b) => a.title.localeCompare(b.title))
                              .map((item) => (
                                <SelectItem key={item.mediaId} value={item.mediaId}>
                                  {item.title} ({item.runtime} min)
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>

                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Follow-Up Show</Label>
                    <p className="text-sm text-muted-foreground">
                      When a show runs out of episodes, play the follow-up series. Otherwise, it will restart.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {formData.mediaItems
                      .reduce((acc, item) => {
                        if (!acc.find((existing) => existing.mediaId === item.mediaId)) {
                          acc.push(item)
                        }
                        return acc
                      }, [] as BlockMediaItem[])
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map((item) => (
                        <div key={item.mediaId} className="flex items-center gap-3">
                          <div className="text-sm font-medium flex-1">{item.title}</div>
                          <Select
                            value={item.followupMediaId || "none"}
                            onValueChange={(value) => handleFollowupChange(item.id, value === "none" ? "" : value)}
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="No follow-up" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No follow-up (Restart)</SelectItem>
                              {getFollowUpOptions(item.mediaId).map((option) => (
                                <SelectItem key={option.mediaId} value={option.mediaId}>
                                  {option.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                  </div>
                </div>
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
