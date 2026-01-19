"use client"

import React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSettings } from "@/hooks/use-settings"
import { useDisplays } from "@/hooks/use-displays"
import { useChannels } from "@/hooks/use-channels"
import { FileUpload } from "@/components/file-upload"
import { RefreshCwIcon, MonitorIcon, CalendarIcon } from "lucide-react"
import type { RatingAudioFiles } from "@/hooks/use-settings"
import { Checkbox } from "@/components/ui/checkbox" // Added Checkbox import

export function SettingsPanel() {
  const {
    settings,
    updateSetting,
    updateTVSeasonSetting,
    updateRatingAudioFile,
    updateChannelInfoDisplay,
    updateMediaInfoDisplay,
    updateSafeHarborTimes,
    updateChannelTypeSettings,
    updateSelectedChannelType,
    updateCooldownSetting,
    updateDaypartSetting,
    getCurrentChannelTypeSettings,
    saveCurrentChannelTypeSettings,
    clearCurrentChannelTypeSettings,
  } = useSettings()
  const { displays, isLoading: displaysLoading, refreshDisplays } = useDisplays()
  const { channels } = useChannels()

  const getDisplayName = (displayId: string) => {
    const display = displays.find((d) => d.id === displayId)
    return display ? display.name : "Unknown Display"
  }

  // Get available channels for default channel selection
  const getAvailableChannels = () => {
    const channelNumbers = channels.map((c) => c.number).sort((a, b) => a - b)

    // If no channels exist, return default options
    if (channelNumbers.length === 0) {
      return [3, 4]
    }

    return channelNumbers
  }

  // Get the lowest available channel number
  const getLowestChannel = () => {
    const availableChannels = getAvailableChannels()
    return availableChannels[0] || 3
  }

  // Ensure default channel is valid
  const ensureValidDefaultChannel = () => {
    const availableChannels = getAvailableChannels()
    if (!availableChannels.includes(settings.defaultChannel)) {
      updateSetting("defaultChannel", getLowestChannel())
    }
  }

  // Check if default channel is valid on component mount
  React.useEffect(() => {
    ensureValidDefaultChannel()
  }, [channels])

  const ratingLabels: Record<keyof RatingAudioFiles, string> = {
    "TV-Y": "TV-Y (Children)",
    "TV-Y7": "TV-Y7 (Children 7+)",
    "TV-G": "TV-G (General Audience)",
    "TV-PG": "TV-PG (Parental Guidance)",
    "TV-14": "TV-14 (Parents Strongly Cautioned)",
    "TV-MA": "TV-MA (Mature Audiences)",
    G: "G (General Audiences)",
    PG: "PG (Parental Guidance Suggested)",
    "PG-13": "PG-13 (Parents Strongly Cautioned)",
    R: "R (Restricted)",
    "NC-17": "NC-17 (Adults Only)",
    X: "X (Adults Only)",
  }

  // Generate seasons per season options
  const seasonsPerSeasonOptions = [
    { value: "unlimited", label: "Unlimited" },
    ...Array.from({ length: 10 }, (_, i) => ({
      value: (i + 1).toString(),
      label: (i + 1).toString(),
    })),
  ]

  // Helper to format date for display with error handling
  const formatDateForDisplay = (dateString: string): string => {
    try {
      if (!dateString) return "Invalid date"

      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid date"

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const dayName = dayNames[date.getDay()]
      return `${date.toLocaleDateString()} (${dayName})`
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  const generateTimeOptions = () => {
    const times: string[] = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const period = hour < 12 ? "AM" : "PM"
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        const displayMinute = minute === 0 ? "00" : minute.toString()
        times.push(`${displayHour}:${displayMinute} ${period}`)
      }
    }
    return times
  }

  const timeOptions = generateTimeOptions()

  // New options for Channel Type Settings section
  const cooldownOptions = [
    "Same Day only",
    "1 Day",
    "3 Days",
    "7 Days (1 Week)",
    "14 Days (2 Weeks)",
    "30 Days (1 Month)",
    "60 Days (2 Months)",
    "90 Days (3 Months)",
    "180 Days (6 Months)",
    "365 Days (1 Year)",
  ]

  const channelTypeOptions = [
    "Broadcast / OTA",
    "General Cable",
    "Premium Cable",
    "Movie Channel",
    "Kids",
    "News/Talk",
    "Sports",
    "Faith/Religious",
    "Music/Variety",
    "Educational/Documentary",
    "Public Access",
    "FAST/Streaming Linear",
  ]

  const mediaTypeOptions = ["TV Show", "Movie", "Music Video", "Filler", "Podcasts"]

  const audienceOptions = ["family", "adult", "senior", "baby", "toddler", "boy", "girl", "teen", "young adult"]

  // Base genres for all media types
  const baseGenreOptions = [
    "Action",
    "Adventure",
    "Animation",
    "Children/Kids",
    "Comedy",
    "Crime",
    "Drama",
    "Fantasy",
    "Historical/Period",
    "Horror",
    "Mystery",
    "Romance",
    "Science Fiction",
    "Thriller",
    "War",
    "Western",
  ]

  // Additional genres for TV Shows
  const tvShowGenres = [
    "Anime",
    "Competition",
    "Documentary",
    "Docuseries",
    "Educational",
    "Faith/Religious",
    "Game Show",
    "Lifestyle (food, travel, home)",
    "Medical",
    "News",
    "Political",
    "Reality",
    "Sitcom",
    "Sports",
    "Talk Show",
    "True Crime",
    "Variety Show",
  ]

  // Additional genres for Movies
  const movieGenres = [
    "Art House",
    "Concert",
    "Dance/Performance",
    "Epic",
    "Musical",
    "Road Movie",
    "Silent",
  ]

  // Function to get contextual genre options based on selected media types in a daypart
  const getGenreOptionsForDaypart = (daypartKey: string): string[] => {
    const daypartSettings = getDaypartSettings(daypartKey)
    const selectedMediaTypes = daypartSettings.mediaTypes || []

    let genres = [...baseGenreOptions]

    if (selectedMediaTypes.includes("TV Show")) {
      genres = [...genres, ...tvShowGenres]
    }

    if (selectedMediaTypes.includes("Movie")) {
      genres = [...genres, ...movieGenres]
    }

    // Sort alphabetically and remove duplicates
    return [...new Set(genres)].sort((a, b) => a.localeCompare(b))
  }

  const dayparts = [
    { key: "earlyMorning", label: "Early Morning (5:00 AM - 9:00 AM)" },
    { key: "daytime", label: "Daytime (9:00 AM - 3:00 PM)" },
    { key: "afterSchool", label: "After School (3:00 PM - 5:00 PM)" },
    { key: "earlyFringe", label: "Early Fringe (5:00 PM - 7:00 PM)" },
    { key: "earlyPrime", label: "Early Prime (7:00 PM - 8:00 PM)" },
    { key: "primetime", label: "Primetime (8:00 PM - 10:00 PM)" },
    { key: "latePrime", label: "Late Prime (10:00 PM - 11:00 PM)" },
    { key: "lateNight", label: "Late Night (10:00 PM - 12:00 AM)" },
    { key: "overnight", label: "Overnight (12:00 AM - 5:00 AM)" },
  ]

  const getDaypartSettings = (daypart: string) => {
    const currentSettings = getCurrentChannelTypeSettings()
    if (!currentSettings?.dayparts) return { mediaTypes: [], audience: [], genre: [] }
    const dp = currentSettings.dayparts[daypart as keyof typeof currentSettings.dayparts]
    if (!dp) return { mediaTypes: [], audience: [], genre: [] }
    return {
      mediaTypes: dp.mediaTypes || [],
      audience: dp.audience || [],
      genre: dp.genre || [],
    }
  }

  const getCooldownSettings = () => {
    const currentSettings = getCurrentChannelTypeSettings()
    return currentSettings?.cooldown || {
      movies: "Same Day only",
      tvShow: "Same Day only",
      tvEpisodes: "Same Day only",
      filler: "Same Day only",
      musicVideos: "Same Day only",
    }
  }

  const handleDaypartMediaTypeToggle = (daypart: string, mediaType: string, checked: boolean) => {
    const currentMediaTypes = getDaypartSettings(daypart).mediaTypes
    if (checked) {
      updateDaypartSetting(daypart as keyof typeof settings.channelTypeSettings.dayparts, "mediaTypes", [
        ...currentMediaTypes,
        mediaType,
      ])
    } else {
      updateDaypartSetting(
        daypart as keyof typeof settings.channelTypeSettings.dayparts,
        "mediaTypes",
        currentMediaTypes.filter((mt) => mt !== mediaType),
      )
    }
  }

  const handleDaypartAudienceToggle = (daypart: string, audience: string, checked: boolean) => {
    const currentAudience = getDaypartSettings(daypart).audience
    if (checked) {
      updateDaypartSetting(daypart as keyof typeof settings.channelTypeSettings.dayparts, "audience", [
        ...currentAudience,
        audience,
      ])
    } else {
      updateDaypartSetting(
        daypart as keyof typeof settings.channelTypeSettings.dayparts,
        "audience",
        currentAudience.filter((a) => a !== audience),
      )
    }
  }

  const handleDaypartGenreToggle = (daypart: string, genre: string, checked: boolean) => {
    const currentGenre = getDaypartSettings(daypart).genre
    if (checked) {
      updateDaypartSetting(daypart as keyof typeof settings.channelTypeSettings.dayparts, "genre", [
        ...currentGenre,
        genre,
      ])
    } else {
      updateDaypartSetting(
        daypart as keyof typeof settings.channelTypeSettings.dayparts,
        "genre",
        currentGenre.filter((g) => g !== genre),
      )
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your Virtual TV 3 preferences</p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Display Output</CardTitle>
            <CardDescription>Configure which display device should show the TV programming</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tv-out" className="text-base font-medium">
                    TV Out
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Select which monitor or display device should show the TV programming. This does not affect the
                    Virtual TV tab, which you can use for testing and preview purposes.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshDisplays}
                    disabled={displaysLoading}
                    className="shrink-0 bg-transparent"
                  >
                    <RefreshCwIcon className={`h-4 w-4 ${displaysLoading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Select
                  value={settings.tvOut}
                  onValueChange={(value) => updateSetting("tvOut", value)}
                  disabled={displaysLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select display output">
                      <div className="flex items-center space-x-2">
                        <MonitorIcon className="h-4 w-4" />
                        <span>{getDisplayName(settings.tvOut)}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {displays.map((display) => (
                      <SelectItem key={display.id} value={display.id} disabled={!display.isConnected}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <MonitorIcon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{display.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {display.resolution}
                                {display.isPrimary && " • Primary"}
                                {!display.isConnected && " • Disconnected"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {displaysLoading && <p className="text-xs text-muted-foreground">Detecting displays...</p>}

                {!displaysLoading && displays.length === 0 && (
                  <p className="text-xs text-red-500">No displays detected. Click refresh to try again.</p>
                )}

                {settings.tvOut !== "auto" && (
                  <div className="text-xs text-muted-foreground">Selected: {getDisplayName(settings.tvOut)}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Defaults</CardTitle>
            <CardDescription>Configure default behavior for Virtual TV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="default-channel" className="text-base font-medium">
                  Default Channel
                </Label>
                <p className="text-sm text-muted-foreground">
                  The channel to display when Virtual TV starts and Remember Last Channel is disabled
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Select
                  value={settings.defaultChannel.toString()}
                  onValueChange={(value) => updateSetting("defaultChannel", Number.parseInt(value))}
                  disabled={settings.rememberLastChannel}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableChannels().map((channelNumber) => {
                      const channel = channels.find((c) => c.number === channelNumber)
                      return (
                        <SelectItem key={channelNumber} value={channelNumber.toString()}>
                          {channelNumber}
                          {channel ? ` - ${channel.name}` : ""}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="remember-last-channel" className="text-base font-medium">
                  Remember Last Channel
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, Virtual TV will start on the last channel viewed. When disabled, it will use the Default
                  Channel setting.
                </p>
              </div>
              <Switch
                id="remember-last-channel"
                checked={settings.rememberLastChannel}
                onCheckedChange={(checked) => updateSetting("rememberLastChannel", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-channel-info" className="text-base font-medium">
                  Show Channel Info
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display channel number and name overlay when switching channels (3 seconds)
                </p>
              </div>
              <Switch
                id="show-channel-info"
                checked={settings.showChannelInfo}
                onCheckedChange={(checked) => updateSetting("showChannelInfo", checked)}
              />
            </div>

            {settings.showChannelInfo && (
              <div className="ml-6 space-y-4 pl-4 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-channel-number" className="text-sm font-medium">
                    Channel Number
                  </Label>
                  <Switch
                    id="show-channel-number"
                    checked={settings.channelInfoDisplay.showChannelNumber}
                    onCheckedChange={(checked) => updateChannelInfoDisplay("showChannelNumber", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-channel-name" className="text-sm font-medium">
                    Channel Name
                  </Label>
                  <Switch
                    id="show-channel-name"
                    checked={settings.channelInfoDisplay.showChannelName}
                    onCheckedChange={(checked) => updateChannelInfoDisplay("showChannelName", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel-info-location" className="text-sm font-medium">
                    Location
                  </Label>
                  <Select
                    value={settings.channelInfoDisplay.location}
                    onValueChange={(value) =>
                      updateChannelInfoDisplay(
                        "location",
                        value as "top-left" | "top-right" | "bottom-left" | "bottom-right",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channel-info-font" className="text-sm font-medium">
                    Font
                  </Label>
                  <Select
                    value={settings.channelInfoDisplay.font}
                    onValueChange={(value) => updateChannelInfoDisplay("font", value as "PxPlus IBM CGA" | "Arial")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PxPlus IBM CGA">PxPlus IBM CGA</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-media-info" className="text-base font-medium">
                  Show Media Info
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display media title and timeslot overlay when viewing content (5 seconds)
                </p>
              </div>
              <Switch
                id="show-media-info"
                checked={settings.showMediaInfo}
                onCheckedChange={(checked) => updateSetting("showMediaInfo", checked)}
              />
            </div>

            {settings.showMediaInfo && (
              <div className="ml-6 space-y-4 pl-4 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-media-name" className="text-sm font-medium">
                    Media Name
                  </Label>
                  <Switch
                    id="show-media-name"
                    checked={settings.mediaInfoDisplay.showMediaName}
                    onCheckedChange={(checked) => updateMediaInfoDisplay("showMediaName", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-episode-name" className="text-sm font-medium">
                    Episode Name
                  </Label>
                  <Switch
                    id="show-episode-name"
                    checked={settings.mediaInfoDisplay.showEpisodeName}
                    onCheckedChange={(checked) => updateMediaInfoDisplay("showEpisodeName", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-media-timeslot" className="text-sm font-medium">
                    Timeslot
                  </Label>
                  <Switch
                    id="show-media-timeslot"
                    checked={settings.mediaInfoDisplay.showTimeslot}
                    onCheckedChange={(checked) => updateMediaInfoDisplay("showTimeslot", checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="media-info-location" className="text-sm font-medium">
                    Location
                  </Label>
                  <Select
                    value={settings.mediaInfoDisplay.location}
                    onValueChange={(value) =>
                      updateMediaInfoDisplay(
                        "location",
                        value as "top-left" | "top-right" | "bottom-left" | "bottom-right",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top-left">Top Left</SelectItem>
                      <SelectItem value="top-right">Top Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel Type Settings</CardTitle>
            <CardDescription>
              Configure auto-scheduler behavior for different channel types and time periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Channel Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="channel-type-select">Channel Type</Label>
              <Select
                value={settings.channelTypeSettings.selectedChannelType}
                onValueChange={(value) => updateSelectedChannelType(value)}
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
              <p className="text-sm text-muted-foreground">
                Each channel type has its own settings. Select a type to configure its auto-scheduler behavior.
              </p>
            </div>

            <Separator />

            {/* Cooldown Settings */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Cooldown</Label>
                <p className="text-sm text-muted-foreground">
                  Set how long to wait before repeating content of each type
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cooldown-movies">Movies</Label>
                  <Select
                    value={getCooldownSettings().movies}
                    onValueChange={(value) => updateCooldownSetting("movies", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cooldownOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooldown-tv-show">TV Show</Label>
                  <Select
                    value={getCooldownSettings().tvShow}
                    onValueChange={(value) => updateCooldownSetting("tvShow", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cooldownOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooldown-tv-episodes">TV Episodes</Label>
                  <Select
                    value={getCooldownSettings().tvEpisodes}
                    onValueChange={(value) => updateCooldownSetting("tvEpisodes", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cooldownOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooldown-filler">Filler</Label>
                  <Select
                    value={getCooldownSettings().filler}
                    onValueChange={(value) => updateCooldownSetting("filler", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cooldownOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cooldown-music-videos">Music Videos</Label>
                  <Select
                    value={getCooldownSettings().musicVideos}
                    onValueChange={(value) => updateCooldownSetting("musicVideos", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cooldownOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Daypart Settings */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Daypart Settings</Label>
                <p className="text-sm text-muted-foreground">
                  Configure allowed media types, audiences, and genres for different times of day
                </p>
              </div>

              {dayparts.map((daypart) => (
                <div key={daypart.key} className="space-y-3 border rounded-lg p-4">
                  <Label className="text-sm font-medium">{daypart.label}</Label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Media Types */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Media Types</Label>
                      <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                        {mediaTypeOptions.map((mediaType) => (
                          <div key={mediaType} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${daypart.key}-mediatype-${mediaType}`}
                              checked={getDaypartSettings(daypart.key).mediaTypes.includes(mediaType)}
                              onCheckedChange={(checked) =>
                                handleDaypartMediaTypeToggle(daypart.key, mediaType, checked as boolean)
                              }
                            />
                            <label htmlFor={`${daypart.key}-mediatype-${mediaType}`} className="text-xs cursor-pointer">
                              {mediaType}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Audience */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Audience</Label>
                      <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                        {audienceOptions.map((audience) => (
                          <div key={audience} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${daypart.key}-audience-${audience}`}
                              checked={getDaypartSettings(daypart.key).audience.includes(audience)}
                              onCheckedChange={(checked) =>
                                handleDaypartAudienceToggle(daypart.key, audience, checked as boolean)
                              }
                            />
                            <label
                              htmlFor={`${daypart.key}-audience-${audience}`}
                              className="text-xs capitalize cursor-pointer"
                            >
                              {audience}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Genre */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Genre</Label>
                      <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                        {getGenreOptionsForDaypart(daypart.key).map((genre) => (
                          <div key={genre} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${daypart.key}-genre-${genre}`}
                              checked={getDaypartSettings(daypart.key).genre.includes(genre)}
                              onCheckedChange={(checked) =>
                                handleDaypartGenreToggle(daypart.key, genre, checked as boolean)
                              }
                            />
                            <label htmlFor={`${daypart.key}-genre-${genre}`} className="text-xs cursor-pointer">
                              {genre}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Save and Clear Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={clearCurrentChannelTypeSettings}
                className="bg-transparent"
              >
                Clear Settings
              </Button>
              <Button onClick={saveCurrentChannelTypeSettings}>
                Save Settings for {settings.channelTypeSettings.selectedChannelType}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              Save will store settings for this channel type. Clear will reset to defaults.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduling</CardTitle>
            <CardDescription>
              Configure how Virtual TV handles automatic scheduling and content management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-schedule" className="text-base font-medium">
                  Auto-Schedule media to fill schedule
                </Label>
                <p className="text-sm text-muted-foreground">
                  Triggered by the 'Auto-Schedule' button in the Scheduler tab. Automatically fills empty time slots
                  with appropriate media from your library. Use 'Refresh Schedule' to rerun after making changes.
                </p>
              </div>
              <Switch
                id="auto-schedule"
                checked={settings.autoSchedule}
                onCheckedChange={(checked) => updateSetting("autoSchedule", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="safe-harbor" className="text-base font-medium">
                  Safe Harbor
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled with Auto-Schedule, only content rated TV-Y, TV-Y7, TV-G, and TV-PG with no content
                  warning tags will be used to fill the schedule during safe harbor hours.
                </p>
              </div>
              <Switch
                id="safe-harbor"
                checked={settings.safeHarbor}
                onCheckedChange={(checked) => updateSetting("safeHarbor", checked)}
              />
            </div>

            {settings.safeHarbor && (
              <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                <div className="space-y-2">
                  <Label htmlFor="safe-harbor-start-time" className="text-sm font-medium">
                    Start Time
                  </Label>
                  <Select
                    value={settings.safeHarborTimes.startTime}
                    onValueChange={(value) => updateSafeHarborTimes("startTime", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Default: 6:00 AM</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="safe-harbor-end-time" className="text-sm font-medium">
                    End Time
                  </Label>
                  <Select
                    value={settings.safeHarborTimes.endTime}
                    onValueChange={(value) => updateSafeHarborTimes("endTime", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Default: 10:00 PM</p>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="audience-match" className="text-base font-medium">
                  Audience Match
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled with Auto-Schedule, matches filler content audience to media audience. For example, 'kid'
                  audience commercials will only play during 'kid' audience shows to prevent adult content during
                  children's programming.
                </p>
              </div>
              <Switch
                id="audience-match"
                checked={settings.audienceMatch}
                onCheckedChange={(checked) => updateSetting("audienceMatch", checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              TV Season
            </CardTitle>
            <CardDescription>
              Configure TV season settings for reruns and breaks. This controls when shows begin broadcasting and how
              reruns are handled during breaks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="seasons-per-season" className="text-sm font-medium">
                  Seasons per Season
                </Label>
                <Select
                  value={settings.tvSeason.seasonsPerSeason}
                  onValueChange={(value) => updateTVSeasonSetting("seasonsPerSeason", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonsPerSeasonOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How many seasons of a show to cycle through before repeating
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Season Date Range</Label>
                <p className="text-sm text-muted-foreground">
                  Season starts on a Sunday and ends 52 weeks later on a Saturday. Season start will be adjusted to the
                  nearest previous Sunday if needed.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="season-start" className="text-sm font-medium">
                    Season Start (Sunday)
                  </Label>
                  <Input
                    id="season-start"
                    type="date"
                    value={settings.tvSeason.seasonStart}
                    onChange={(e) => updateTVSeasonSetting("seasonStart", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{formatDateForDisplay(settings.tvSeason.seasonStart)}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="season-end" className="text-sm font-medium">
                    Season End (Saturday, 52 weeks later)
                  </Label>
                  <Input
                    id="season-end"
                    type="date"
                    value={settings.tvSeason.seasonEnd}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">{formatDateForDisplay(settings.tvSeason.seasonEnd)}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="winter-break" className="text-base font-medium">
                    Winter Break
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    During winter break, only episodes aired since season start will be rerun
                  </p>
                </div>
                <Switch
                  id="winter-break"
                  checked={settings.tvSeason.winterBreakEnabled}
                  onCheckedChange={(checked) => updateTVSeasonSetting("winterBreakEnabled", checked)}
                />
              </div>

              {settings.tvSeason.winterBreakEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="winter-break-start" className="text-sm font-medium">
                      Winter Break Start
                    </Label>
                    <Input
                      id="winter-break-start"
                      type="date"
                      value={settings.tvSeason.winterBreakStart}
                      onChange={(e) => updateTVSeasonSetting("winterBreakStart", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Default: Last Sunday of November</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="winter-break-end" className="text-sm font-medium">
                      Winter Break End
                    </Label>
                    <Input
                      id="winter-break-end"
                      type="date"
                      value={settings.tvSeason.winterBreakEnd}
                      onChange={(e) => updateTVSeasonSetting("winterBreakEnd", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Default: First Saturday of February (next year)</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="summer-break" className="text-base font-medium">
                    Summer Break
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    During summer break, only episodes that have aired since season start will be rerun at the same
                    date/time
                  </p>
                </div>
                <Switch
                  id="summer-break"
                  checked={settings.tvSeason.summerBreakEnabled}
                  onCheckedChange={(checked) => updateTVSeasonSetting("summerBreakEnabled", checked)}
                />
              </div>

              {settings.tvSeason.summerBreakEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div className="space-y-2">
                    <Label htmlFor="summer-break-start" className="text-sm font-medium">
                      Summer Break Start
                    </Label>
                    <Input
                      id="summer-break-start"
                      type="date"
                      value={settings.tvSeason.summerBreakStart}
                      onChange={(e) => updateTVSeasonSetting("summerBreakStart", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Default: First Sunday in June</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summer-break-end" className="text-sm font-medium">
                      Summer Break End
                    </Label>
                    <Input
                      id="summer-break-end"
                      type="date"
                      value={settings.tvSeason.summerBreakEnd}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Automatically set to Season End date</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> TV Season settings control how the auto-scheduler handles show progression and
                reruns. The season runs for exactly 52 weeks from Sunday to Saturday. During breaks, only episodes that
                have aired since the season start date will be available for reruns, creating an authentic broadcast
                television experience with seasonal programming patterns.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rating and Content Warning Audio Files</CardTitle>
            <CardDescription>
              Upload audio files to play during rating and content warning screens. These will be played when a channel
              has the "Rating and Content Warning" toggle enabled.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(ratingLabels).map(([rating, label]) => (
                <div key={rating} className="space-y-2">
                  <Label htmlFor={`rating-${rating}`} className="text-sm font-medium">
                    {label}
                  </Label>
                  <FileUpload
                    value={settings.ratingAudioFiles[rating as keyof RatingAudioFiles]}
                    onChange={(value) => updateRatingAudioFile(rating as keyof RatingAudioFiles, value)}
                    accept="audio/*"
                    placeholder={`Upload ${rating} audio`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> These audio files will play during the rating and content warning screen that
                displays before media with ratings above G/TV-G/TV-Y7/TV-Y or with content warning tags. The screen will
                show the rating on the left with the text "The following program contains material that may be harmful
                or traumatizing to some audiences. Viewer discretion is advised." and any content warnings on the right.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Virtual TV 3</CardTitle>
            <CardDescription>Information about your Virtual TV installation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-medium">Version</Label>
                <p className="text-muted-foreground">3.0.0</p>
              </div>
              <div>
                <Label className="font-medium">Build Date</Label>
                <p className="text-muted-foreground">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="font-medium">Description</Label>
              <p className="text-muted-foreground mt-1">
                Virtual TV 3 allows you to schedule media from your server to play at certain times, replicating the
                nostalgic feel of 80s and 90s television programming.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
