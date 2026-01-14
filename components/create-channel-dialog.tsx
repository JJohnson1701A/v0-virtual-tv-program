"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUpload } from "@/components/file-upload"
import { TimeSelect } from "@/components/time-select"
import { MediaSelector } from "@/components/media-selector"
import type { Channel, OverlayPosition, ChannelType } from "@/types/channel"
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

const audienceOptions = ["family", "adult", "senior", "baby", "toddler", "boy", "girl", "teen", "young adult"]

const tvGenreOptions = [
  "Action",
  "Adventure",
  "Animation",
  "Anime",
  "Children/Kids",
  "Comedy",
  "Crime",
  "Documentary",
  "Docuseries",
  "Drama",
  "Educational",
  "Faith/Religious",
  "Fantasy",
  "Game Show",
  "Historical/Period",
  "Horror",
  "Lifestyle (Food, Travel, Home)",
  "Medical",
  "Mystery",
  "News",
  "Political",
  "Reality",
  "Romance",
  "Science Fiction",
  "Sitcom",
  "Sports",
  "Talk Show",
  "Thriller",
  "True Crime",
  "Variety",
  "Western",
]

const movieGenreOptions = [
  "Action",
  "Adventure",
  "Animation",
  "Anime",
  "Biographical/Biopic",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Epic",
  "Faith/Religious",
  "Fantasy",
  "Historical/Period",
  "Horror",
  "Independent/Art House",
  "Martial Arts",
  "Musical",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Sports",
  "Superhero",
  "Thriller",
  "War",
  "Western",
]

const showCategoryOptions = [
  "kids cartoon",
  "kids live",
  "kids educational",
  "sitcom",
  "drama",
  "soap opera",
  "sketch comedy",
  "variety",
  "animation (general/adult)",
  "anime",
  "horror",
  "romance",
  "sci-fi/fantasy",
  "classic/retro",
  "rerun",
  "concert",
  "sports",
  "talk",
  "late-night",
  "game show",
  "reality/unscripted",
]

const channelTypeOptions: ChannelType[] = [
  "Over-the-Air (OTA)",
  "Basic Cable",
  "Premium Cable",
  "Movie Channel",
  "Kids Channel",
  "Sports Channel",
  "Music/Variety Channel",
  "Faith Channel",
  "News/Talk Channel",
  "On-Demand/Playlist Channel",
  "FAST/Streaming Linear Channel",
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
    assignedMedia: [] as string[],
    assignedSeasons: {} as Record<string, number[]>,
    autoSchedulerAudience: [] as string[],
    autoSchedulerTVGenre: [] as string[],
    autoSchedulerMovieGenre: [] as string[],
    autoSchedulerShowCategory: [] as string[],
    channelType: undefined as ChannelType | undefined,
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
        autoSchedulerAudience: channel.autoSchedulerAudience || [],
        autoSchedulerTVGenre: channel.autoSchedulerTVGenre || [],
        autoSchedulerMovieGenre: channel.autoSchedulerMovieGenre || [],
        autoSchedulerShowCategory: channel.autoSchedulerShowCategory || [],
        channelType: channel.channelType,
      })
    }
  }, [channel])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAudienceToggle = (audience: string, checked: boolean) => {
    if (checked) {
      handleInputChange("autoSchedulerAudience", [...formData.autoSchedulerAudience, audience])
    } else {
      handleInputChange(
        "autoSchedulerAudience",
        formData.autoSchedulerAudience.filter((a) => a !== audience),
      )
    }
  }

  const handleTVGenreToggle = (genre: string, checked: boolean) => {
    if (checked) {
      handleInputChange("autoSchedulerTVGenre", [...formData.autoSchedulerTVGenre, genre])
    } else {
      handleInputChange(
        "autoSchedulerTVGenre",
        formData.autoSchedulerTVGenre.filter((g) => g !== genre),
      )
    }
  }

  const handleMovieGenreToggle = (genre: string, checked: boolean) => {
    if (checked) {
      handleInputChange("autoSchedulerMovieGenre", [...formData.autoSchedulerMovieGenre, genre])
    } else {
      handleInputChange(
        "autoSchedulerMovieGenre",
        formData.autoSchedulerMovieGenre.filter((g) => g !== genre),
      )
    }
  }

  const handleShowCategoryToggle = (category: string, checked: boolean) => {
    if (checked) {
      handleInputChange("autoSchedulerShowCategory", [...formData.autoSchedulerShowCategory, category])
    } else {
      handleInputChange(
        "autoSchedulerShowCategory",
        formData.autoSchedulerShowCategory.filter((c) => c !== category),
      )
    }
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
      autoSchedulerAudience: formData.autoSchedulerAudience,
      autoSchedulerTVGenre: formData.autoSchedulerTVGenre,
      autoSchedulerMovieGenre: formData.autoSchedulerMovieGenre,
      autoSchedulerShowCategory: formData.autoSchedulerShowCategory,
      channelType: formData.channelType,
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

            {/* Auto-Scheduler Defaults */}
            <div className="space-y-4 mt-6">
              <div>
                <Label className="text-base font-medium">Auto-Scheduler Defaults</Label>
                <p className="text-sm text-muted-foreground">
                  Set default preferences for the auto-scheduler when filling blank timeslots on this channel.
                </p>
              </div>

              {/* Channel Type Picklist */}
              <div className="space-y-2">
                <Label htmlFor="channel-type">Channel Type</Label>
                <Select
                  value={formData.channelType || ""}
                  onValueChange={(value) => handleInputChange("channelType", value as ChannelType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {channelTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Audience Multi-Select */}
              <div className="space-y-2">
                <Label>Audience</Label>
                <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                  {audienceOptions.map((audience) => (
                    <div key={audience} className="flex items-center space-x-2">
                      <Checkbox
                        id={`audience-${audience}`}
                        checked={formData.autoSchedulerAudience.includes(audience)}
                        onCheckedChange={(checked) => handleAudienceToggle(audience, checked as boolean)}
                      />
                      <label htmlFor={`audience-${audience}`} className="text-sm capitalize cursor-pointer">
                        {audience}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* TV Genre Multi-Select */}
              <div className="space-y-2">
                <Label>TV Genre</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {tvGenreOptions.map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tv-genre-${genre}`}
                        checked={formData.autoSchedulerTVGenre.includes(genre)}
                        onCheckedChange={(checked) => handleTVGenreToggle(genre, checked as boolean)}
                      />
                      <label htmlFor={`tv-genre-${genre}`} className="text-sm cursor-pointer">
                        {genre}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Movie Genre Multi-Select */}
              <div className="space-y-2">
                <Label>Movie Genre</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {movieGenreOptions.map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={`movie-genre-${genre}`}
                        checked={formData.autoSchedulerMovieGenre.includes(genre)}
                        onCheckedChange={(checked) => handleMovieGenreToggle(genre, checked as boolean)}
                      />
                      <label htmlFor={`movie-genre-${genre}`} className="text-sm cursor-pointer">
                        {genre}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Show Category Multi-Select */}
              <div className="space-y-2">
                <Label>Show Category</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {showCategoryOptions.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={`show-category-${category}`}
                        checked={formData.autoSchedulerShowCategory.includes(category)}
                        onCheckedChange={(checked) => handleShowCategoryToggle(category, checked as boolean)}
                      />
                      <label htmlFor={`show-category-${category}`} className="text-sm capitalize cursor-pointer">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
