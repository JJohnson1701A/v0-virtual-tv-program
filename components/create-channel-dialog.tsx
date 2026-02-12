"use client"

import { Checkbox } from "@/components/ui/checkbox"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { TriStateCheckbox, type TriState } from "@/components/ui/tri-state-checkbox"
import { FileUpload } from "@/components/file-upload"
import { TimeSelect } from "@/components/time-select"
import { MediaSelector } from "@/components/media-selector"
import type { Channel, OverlayPosition, ChannelType } from "@/types/channel"
import type { MediaItem } from "@/types/media"
import { ContentWarningFilterSelector } from "@/components/content-warning-filter"
import { programFormatOptions, getOptionsForCategory } from "@/lib/program-format-options"

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
    overlayOpacity: 40,
    overlaySize: 150,
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
    autoSchedulerAudienceExclude: [] as string[],
    autoSchedulerTVGenre: [] as string[],
    autoSchedulerTVGenreExclude: [] as string[],
    autoSchedulerMovieGenre: [] as string[],
    autoSchedulerMovieGenreExclude: [] as string[],
    autoSchedulerShowCategory: [] as string[],
    autoSchedulerShowCategoryExclude: [] as string[],
    autoSchedulerProgramFormat: [] as string[],
    autoSchedulerProgramFormatExclude: [] as string[],
    contentWarningFilter: { include: [] as string[], exclude: [] as string[] },
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
        overlayOpacity: channel.overlayOpacity ?? 40,
        overlaySize: channel.overlaySize ?? 150,
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
        autoSchedulerAudienceExclude: channel.autoSchedulerAudienceExclude || [],
        autoSchedulerTVGenre: channel.autoSchedulerTVGenre || [],
        autoSchedulerTVGenreExclude: channel.autoSchedulerTVGenreExclude || [],
        autoSchedulerMovieGenre: channel.autoSchedulerMovieGenre || [],
        autoSchedulerMovieGenreExclude: channel.autoSchedulerMovieGenreExclude || [],
        autoSchedulerShowCategory: channel.autoSchedulerShowCategory || [],
        autoSchedulerShowCategoryExclude: channel.autoSchedulerShowCategoryExclude || [],
        autoSchedulerProgramFormat: channel.autoSchedulerProgramFormat || [],
        autoSchedulerProgramFormatExclude: channel.autoSchedulerProgramFormatExclude || [],
        contentWarningFilter: channel.contentWarningFilter || { include: [], exclude: [] },
        channelType: channel.channelType,
      })
    }
  }, [channel])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Helper to get tri-state value
  const getTriState = (value: string, includeArray: string[], excludeArray: string[]): TriState => {
    if (includeArray.includes(value)) return "checked"
    if (excludeArray.includes(value)) return "excluded"
    return "unchecked"
  }

  // Helper to handle tri-state change
  const handleTriStateChange = (
    value: string,
    newState: TriState,
    includeKey: string,
    excludeKey: string,
    includeArray: string[],
    excludeArray: string[]
  ) => {
    // Remove from both arrays first
    const newInclude = includeArray.filter((v) => v !== value)
    const newExclude = excludeArray.filter((v) => v !== value)

    if (newState === "checked") {
      newInclude.push(value)
    } else if (newState === "excluded") {
      newExclude.push(value)
    }

    handleInputChange(includeKey, newInclude)
    handleInputChange(excludeKey, newExclude)
  }

  const handleAudienceToggle = (audience: string, newState: TriState) => {
    handleTriStateChange(
      audience,
      newState,
      "autoSchedulerAudience",
      "autoSchedulerAudienceExclude",
      formData.autoSchedulerAudience,
      formData.autoSchedulerAudienceExclude
    )
  }

  const handleTVGenreToggle = (genre: string, newState: TriState) => {
    handleTriStateChange(
      genre,
      newState,
      "autoSchedulerTVGenre",
      "autoSchedulerTVGenreExclude",
      formData.autoSchedulerTVGenre,
      formData.autoSchedulerTVGenreExclude
    )
  }

  const handleMovieGenreToggle = (genre: string, newState: TriState) => {
    handleTriStateChange(
      genre,
      newState,
      "autoSchedulerMovieGenre",
      "autoSchedulerMovieGenreExclude",
      formData.autoSchedulerMovieGenre,
      formData.autoSchedulerMovieGenreExclude
    )
  }

  const handleProgramFormatToggle = (value: string, newState: TriState) => {
    handleTriStateChange(
      value,
      newState,
      "autoSchedulerProgramFormat",
      "autoSchedulerProgramFormatExclude",
      formData.autoSchedulerProgramFormat,
      formData.autoSchedulerProgramFormatExclude
    )
  }

  const handleProgramFormatCategoryToggle = (categoryLabel: string, newState: TriState) => {
    const children = getOptionsForCategory(categoryLabel)
    let newInclude = formData.autoSchedulerProgramFormat.filter((v) => !children.includes(v))
    let newExclude = formData.autoSchedulerProgramFormatExclude.filter((v) => !children.includes(v))

    if (newState === "checked") {
      newInclude = [...newInclude, ...children]
    } else if (newState === "excluded") {
      newExclude = [...newExclude, ...children]
    }

    handleInputChange("autoSchedulerProgramFormat", newInclude)
    handleInputChange("autoSchedulerProgramFormatExclude", newExclude)
  }

  const getProgramFormatCategoryState = (categoryLabel: string): TriState => {
    const children = getOptionsForCategory(categoryLabel)
    const allChecked = children.every((c) => formData.autoSchedulerProgramFormat.includes(c))
    const allExcluded = children.every((c) => formData.autoSchedulerProgramFormatExclude.includes(c))
    if (allChecked) return "checked"
    if (allExcluded) return "excluded"
    return "unchecked"
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
      overlayOpacity: formData.overlayOpacity,
      overlaySize: formData.overlaySize,
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
      autoSchedulerAudienceExclude: formData.autoSchedulerAudienceExclude,
      autoSchedulerTVGenre: formData.autoSchedulerTVGenre,
      autoSchedulerTVGenreExclude: formData.autoSchedulerTVGenreExclude,
      autoSchedulerMovieGenre: formData.autoSchedulerMovieGenre,
      autoSchedulerMovieGenreExclude: formData.autoSchedulerMovieGenreExclude,
      autoSchedulerShowCategory: formData.autoSchedulerShowCategory,
      autoSchedulerShowCategoryExclude: formData.autoSchedulerShowCategoryExclude,
      autoSchedulerProgramFormat: formData.autoSchedulerProgramFormat,
      autoSchedulerProgramFormatExclude: formData.autoSchedulerProgramFormatExclude,
      contentWarningFilter: formData.contentWarningFilter,
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
                <div className="space-y-4">
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="overlay-opacity">Overlay Opacity</Label>
                      <span className="text-sm text-muted-foreground">{formData.overlayOpacity}%</span>
                    </div>
                    <Slider
                      id="overlay-opacity"
                      min={0}
                      max={100}
                      step={1}
                      value={[formData.overlayOpacity]}
                      onValueChange={([value]) => handleInputChange("overlayOpacity", value)}
                    />
                    <p className="text-xs text-muted-foreground">0% = fully transparent, 100% = fully opaque</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="overlay-size">Overlay Size</Label>
                      <span className="text-sm text-muted-foreground">{formData.overlaySize}px</span>
                    </div>
                    <Slider
                      id="overlay-size"
                      min={60}
                      max={250}
                      step={1}
                      value={[formData.overlaySize]}
                      onValueChange={([raw]) => {
                        const stickyPoints = [80, 150, 200]
                        const snapRange = 6
                        let value = raw
                        for (const point of stickyPoints) {
                          if (Math.abs(raw - point) <= snapRange) {
                            value = point
                            break
                          }
                        }
                        handleInputChange("overlaySize", value)
                      }}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                      <span>60px</span>
                      <span className="ml-2">80px</span>
                      <span>150px</span>
                      <span>200px</span>
                      <span>250px</span>
                    </div>
                  </div>

                  {/* Overlay Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="relative w-full h-40 rounded-md overflow-hidden border border-border bg-gray-400">
                      <div
                        className={`absolute ${
                          formData.overlayPosition === "top-left"
                            ? "top-3 left-3"
                            : formData.overlayPosition === "top-right"
                              ? "top-3 right-3"
                              : formData.overlayPosition === "bottom-left"
                                ? "bottom-3 left-3"
                                : "bottom-3 right-3"
                        }`}
                      >
                        <img
                          src={formData.overlay}
                          alt="Overlay preview"
                          className="object-contain"
                          style={{
                            opacity: formData.overlayOpacity / 100,
                            width: `${Math.min(formData.overlaySize, 120) * (120 / 150)}px`,
                            height: `${Math.min(formData.overlaySize, 120) * (120 / 150)}px`,
                          }}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-gray-600 text-sm">Video area</span>
                      </div>
                    </div>
                  </div>
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
                <p className="text-xs text-muted-foreground">Click to cycle: blank (neutral) → check (include) → X (exclude)</p>
                <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                  {audienceOptions.map((audience) => (
                    <div key={audience} className="flex items-center space-x-2">
                      <TriStateCheckbox
                        id={`audience-${audience}`}
                        value={getTriState(audience, formData.autoSchedulerAudience, formData.autoSchedulerAudienceExclude)}
                        onValueChange={(newState) => handleAudienceToggle(audience, newState)}
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
                <p className="text-xs text-muted-foreground">Click to cycle: blank (neutral) → check (include) → X (exclude)</p>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {tvGenreOptions.map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <TriStateCheckbox
                        id={`tv-genre-${genre}`}
                        value={getTriState(genre, formData.autoSchedulerTVGenre, formData.autoSchedulerTVGenreExclude)}
                        onValueChange={(newState) => handleTVGenreToggle(genre, newState)}
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
                <p className="text-xs text-muted-foreground">Click to cycle: blank (neutral) → check (include) → X (exclude)</p>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {movieGenreOptions.map((genre) => (
                    <div key={genre} className="flex items-center space-x-2">
                      <TriStateCheckbox
                        id={`movie-genre-${genre}`}
                        value={getTriState(genre, formData.autoSchedulerMovieGenre, formData.autoSchedulerMovieGenreExclude)}
                        onValueChange={(newState) => handleMovieGenreToggle(genre, newState)}
                      />
                      <label htmlFor={`movie-genre-${genre}`} className="text-sm cursor-pointer">
                        {genre}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Program Format Multi-Select */}
              <div className="space-y-2">
                <Label>Program Format</Label>
                <p className="text-xs text-muted-foreground">Click to cycle: blank (neutral) &rarr; check (include) &rarr; X (exclude). Category headers toggle all items in that group.</p>
                <div className="border rounded-md p-3 max-h-64 overflow-y-auto">
                  <div className="flex flex-col gap-1">
                    {programFormatOptions.map((item, index) => {
                      if (item.type === "header") {
                        return (
                          <div key={`header-${index}`} className="flex items-center gap-2 mt-2 first:mt-0">
                            <TriStateCheckbox
                              id={`pf-cat-${item.label}`}
                              value={getProgramFormatCategoryState(item.label)}
                              onValueChange={(newState) => handleProgramFormatCategoryToggle(item.label, newState)}
                            />
                            <label htmlFor={`pf-cat-${item.label}`} className="font-semibold text-xs text-muted-foreground cursor-pointer">
                              {item.label}
                            </label>
                          </div>
                        )
                      }

                      return (
                        <div key={item.value} className="flex items-center gap-2 ml-5">
                          <TriStateCheckbox
                            id={`pf-${item.value}`}
                            value={getTriState(item.value!, formData.autoSchedulerProgramFormat, formData.autoSchedulerProgramFormatExclude)}
                            onValueChange={(newState) => handleProgramFormatToggle(item.value!, newState)}
                          />
                          <label htmlFor={`pf-${item.value}`} className="text-sm cursor-pointer">
                            {item.label}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Content Warning Filter */}
              <ContentWarningFilterSelector
                value={formData.contentWarningFilter}
                onChange={(filter) => handleInputChange("contentWarningFilter", filter)}
              />
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
