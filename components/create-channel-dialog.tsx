"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { FileUpload } from "@/components/file-upload"
import { TimeSelect } from "@/components/time-select"
import { MediaSelector } from "@/components/media-selector"
import type { Channel, OverlayPosition } from "@/types/channel"
import type { MediaItem } from "@/types/media"

interface CreateChannelDialogProps {
  channel: Channel | null
  onSave: (channel: Omit<Channel, "id" | "dateCreated">) => void
  onCancel: () => void
}

const languages = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
  { code: "nl", name: "Dutch" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "separator", name: "----" },
  { code: "ar", name: "Arabic (ar)" },
  { code: "zh", name: "Chinese (zh)" },
  { code: "da", name: "Danish (da)" },
  { code: "fi", name: "Finnish (fi)" },
  { code: "he", name: "Hebrew (he)" },
  { code: "hi", name: "Hindi (hi)" },
  { code: "ko", name: "Korean (ko)" },
  { code: "no", name: "Norwegian (no)" },
  { code: "pl", name: "Polish (pl)" },
  { code: "pt", name: "Portuguese (pt)" },
  { code: "ru", name: "Russian (ru)" },
  { code: "sv", name: "Swedish (sv)" },
  { code: "th", name: "Thai (th)" },
  { code: "tr", name: "Turkish (tr)" },
]

const overlayPositions: { value: OverlayPosition; label: string }[] = [
  { value: "bottom-right", label: "Bottom Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "top-right", label: "Top Right" },
  { value: "top-left", label: "Top Left" },
]

export function CreateChannelDialog({ channel, onSave, onCancel }: CreateChannelDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    logo: "",
    overlay: "",
    overlayPosition: "bottom-right" as OverlayPosition,
    defaultLanguage: "en",
    defaultSubtitleLanguage: "en",
    signOff: false,
    signOffTime: "12:00 AM",
    signOnTime: "6:00 AM",
    signOffVideo: "",
    ratingContentWarning: false,
    assignedMedia: [] as string[], // Array of media IDs assigned to this channel
    assignedSeasons: {} as Record<string, number[]>, // mediaId -> array of season numbers
  })

  useEffect(() => {
    if (channel) {
      setFormData({
        name: channel.name,
        number: channel.number.toString(),
        logo: channel.logo || "",
        overlay: channel.overlay || "",
        overlayPosition: channel.overlayPosition || "bottom-right",
        defaultLanguage: channel.defaultLanguage || "en",
        defaultSubtitleLanguage: channel.defaultSubtitleLanguage || "en",
        signOff: channel.signOff || false,
        signOffTime: channel.signOffTime || "12:00 AM",
        signOnTime: channel.signOnTime || "6:00 AM",
        signOffVideo: channel.signOffVideo || "",
        ratingContentWarning: channel.ratingContentWarning || false,
        assignedMedia: channel.assignedMedia || [],
        assignedSeasons: channel.assignedSeasons || {},
      })
    }
  }, [channel])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMediaSelection = (selectedMedia: MediaItem[], selectedSeasons?: Record<string, number[]>) => {
    const mediaIds = selectedMedia.map((media) => media.id)
    handleInputChange("assignedMedia", mediaIds)
    if (selectedSeasons) {
      handleInputChange("assignedSeasons", selectedSeasons)
    }
  }

  const handleSave = () => {
    const channelData = {
      name: formData.name,
      number: Number.parseInt(formData.number),
      logo: formData.logo,
      overlay: formData.overlay,
      overlayPosition: formData.overlayPosition,
      defaultLanguage: formData.defaultLanguage,
      defaultSubtitleLanguage: formData.defaultSubtitleLanguage,
      signOff: formData.signOff,
      signOffTime: formData.signOffTime,
      signOnTime: formData.signOnTime,
      signOffVideo: formData.signOffVideo,
      ratingContentWarning: formData.ratingContentWarning,
      assignedMedia: formData.assignedMedia,
      assignedSeasons: formData.assignedSeasons,
    }
    onSave(channelData)
  }

  const isValid = formData.name.trim() && formData.number.trim() && !isNaN(Number(formData.number))

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{channel ? "Edit Channel" : "Create Channel"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="channel-name">Channel Name</Label>
                <Input
                  id="channel-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter channel name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel-number">Channel Number</Label>
                <Input
                  id="channel-number"
                  type="number"
                  min="1"
                  max="999"
                  value={formData.number}
                  onChange={(e) => handleInputChange("number", e.target.value)}
                  placeholder="Enter channel number"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* File Uploads */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Channel Logo</Label>
              <p className="text-sm text-muted-foreground">
                Upload an image for the channel logo (webp, png, jpg, jpeg, gif, svg)
              </p>
              <FileUpload
                value={formData.logo}
                onChange={(value) => handleInputChange("logo", value)}
                accept="image/webp,image/png,image/jpg,image/jpeg,image/gif,image/svg+xml"
                placeholder="Upload channel logo"
              />
            </div>

            <div className="space-y-2">
              <Label>Channel Overlay</Label>
              <p className="text-sm text-muted-foreground">
                Upload an overlay image to display during media playback (webp, png, jpg, jpeg, gif, svg)
              </p>
              <FileUpload
                value={formData.overlay}
                onChange={(value) => handleInputChange("overlay", value)}
                accept="image/webp,image/png,image/jpg,image/jpeg,image/gif,image/svg+xml"
                placeholder="Upload channel overlay"
              />

              {formData.overlay && (
                <div className="space-y-2">
                  <Label htmlFor="overlay-position">Overlay Position</Label>
                  <Select
                    value={formData.overlayPosition}
                    onValueChange={(value) => handleInputChange("overlayPosition", value)}
                  >
                    <SelectTrigger>
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
          </div>

          <Separator />

          {/* Media Assignment */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Assign Media to Channel</Label>
              <p className="text-sm text-muted-foreground">
                Select media from your library to assign to this channel. For TV shows, you can choose specific seasons.
                This media will appear in the Channel-Specific tab when scheduling.
              </p>
            </div>
            <MediaSelector
              selectedMediaIds={formData.assignedMedia}
              selectedSeasons={formData.assignedSeasons}
              onSelectionChange={handleMediaSelection}
              allowMultiple={true}
            />
          </div>

          <Separator />

          {/* Language Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default-language">Default Language</Label>
                <Select
                  value={formData.defaultLanguage}
                  onValueChange={(value) => handleInputChange("defaultLanguage", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) =>
                      lang.code === "separator" ? (
                        <div key={lang.code} className="px-2 py-1 text-xs text-muted-foreground border-t">
                          {lang.name}
                        </div>
                      ) : (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-subtitle-language">Default Subtitle Language</Label>
                <Select
                  value={formData.defaultSubtitleLanguage}
                  onValueChange={(value) => handleInputChange("defaultSubtitleLanguage", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) =>
                      lang.code === "separator" ? (
                        <div key={lang.code} className="px-2 py-1 text-xs text-muted-foreground border-t">
                          {lang.name}
                        </div>
                      ) : (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sign-Off Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sign-off">Sign-Off</Label>
                <p className="text-sm text-muted-foreground">
                  Enable channel sign-off with static display during off-hours
                </p>
              </div>
              <Switch
                id="sign-off"
                checked={formData.signOff}
                onCheckedChange={(checked) => handleInputChange("signOff", checked)}
              />
            </div>

            {formData.signOff && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sign-off-time">Sign-Off Time</Label>
                    <TimeSelect
                      value={formData.signOffTime}
                      onChange={(value) => handleInputChange("signOffTime", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sign-on-time">Sign-On Time</Label>
                    <TimeSelect
                      value={formData.signOnTime}
                      onChange={(value) => handleInputChange("signOnTime", value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Sign-Off Video</Label>
                  <p className="text-sm text-muted-foreground">Upload a video to play before going to static</p>
                  <FileUpload
                    value={formData.signOffVideo}
                    onChange={(value) => handleInputChange("signOffVideo", value)}
                    accept="video/*"
                    placeholder="Upload sign-off video"
                  />
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="rating-content-warning">Rating and Content Warning</Label>
                <p className="text-sm text-muted-foreground">
                  Display rating and content warning screen before media with ratings above G/TV-G/TV-Y7/TV-Y or with
                  content warning tags
                </p>
              </div>
              <Switch
                id="rating-content-warning"
                checked={formData.ratingContentWarning}
                onCheckedChange={(checked) => handleInputChange("ratingContentWarning", checked)}
              />
            </div>
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
