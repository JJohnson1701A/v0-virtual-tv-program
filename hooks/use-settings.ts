"use client"

import { useState, useEffect, useCallback } from "react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface RatingAudioFiles {
  "TV-Y": string
  "TV-Y7": string
  "TV-G": string
  "TV-PG": string
  "TV-14": string
  "TV-MA": string
  G: string
  PG: string
  "PG-13": string
  R: string
  "NC-17": string
  X: string
}

export interface TVSeasonSettings {
  seasonsPerSeason: string // "unlimited" or "1" through "10"
  seasonStart: string // ISO date string
  seasonEnd: string // ISO date string
  winterBreakEnabled: boolean
  winterBreakStart: string // ISO date string
  winterBreakEnd: string // ISO date string
  summerBreakEnabled: boolean
  summerBreakStart: string // ISO date string
  summerBreakEnd: string // ISO date string
}

export interface ChannelInfoDisplay {
  showChannelNumber: boolean
  showChannelName: boolean
  location: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  font: "PxPlus IBM CGA" | "Arial"
}

export interface MediaInfoDisplay {
  showMediaName: boolean
  showEpisodeName: boolean
  showTimeslot: boolean
  location: "top-left" | "top-right" | "bottom-left" | "bottom-right"
}

export interface SafeHarborTimes {
  startTime: string // Time in format "HH:MM AM/PM"
  endTime: string // Time in format "HH:MM AM/PM"
}

export interface CooldownSettings {
  movies: string
  tvShow: string
  tvEpisodes: string
  filler: string
  musicVideos: string
}

export interface DaypartSettings {
  startTime: string // Time in format "HH:MM AM/PM"
  endTime: string // Time in format "HH:MM AM/PM"
  mediaTypes: string[]
  audience: string[]
  genre: string[]
}

export interface SingleChannelTypeSettings {
  cooldown: CooldownSettings
  dayparts: Record<string, DaypartSettings>
}

export interface ChannelTypeSettings {
  selectedChannelType: string
  channelTypes: Record<string, SingleChannelTypeSettings>
}

export type AccentColor = "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet"

export interface Settings {
  autoSchedule: boolean
  safeHarbor: boolean
  safeHarborTimes: SafeHarborTimes
  rememberLastChannel: boolean
  defaultChannel: number
  tvOut: string
  audienceMatch: boolean
  ratingAudioFiles: RatingAudioFiles
  showChannelInfo: boolean
  channelInfoDisplay: ChannelInfoDisplay
  showMediaInfo: boolean
  mediaInfoDisplay: MediaInfoDisplay
  lastViewedChannel?: number
  tvSeason: TVSeasonSettings
  channelTypeSettings: ChannelTypeSettings
  accentColor: AccentColor
  infoDisplayDuration: 2 | 3 | 5
}

const defaultRatingAudioFiles: RatingAudioFiles = {
  "TV-Y": "",
  "TV-Y7": "",
  "TV-G": "",
  "TV-PG": "",
  "TV-14": "",
  "TV-MA": "",
  G: "",
  PG: "",
  "PG-13": "",
  R: "",
  "NC-17": "",
  X: "",
}

const defaultCooldownSettings: CooldownSettings = {
  movies: "Same Day only",
  tvShow: "Same Day only",
  tvEpisodes: "Same Day only",
  filler: "Same Day only",
  musicVideos: "Same Day only",
}

const createDefaultDaypartSettings = (startTime: string, endTime: string): DaypartSettings => ({
  startTime,
  endTime,
  mediaTypes: [],
  audience: [],
  genre: [],
})

const createDefaultSingleChannelTypeSettings = (): SingleChannelTypeSettings => ({
  cooldown: defaultCooldownSettings,
  dayparts: {
    earlyMorning: createDefaultDaypartSettings("5:00 AM", "9:00 AM"),
    daytime: createDefaultDaypartSettings("9:00 AM", "3:00 PM"),
    afterSchool: createDefaultDaypartSettings("3:00 PM", "5:00 PM"),
    earlyFringe: createDefaultDaypartSettings("5:00 PM", "7:00 PM"),
    earlyPrime: createDefaultDaypartSettings("7:00 PM", "8:00 PM"),
    primetime: createDefaultDaypartSettings("8:00 PM", "10:00 PM"),
    latePrime: createDefaultDaypartSettings("10:00 PM", "11:00 PM"),
    lateNight: createDefaultDaypartSettings("11:00 PM", "12:00 AM"),
    overnight: createDefaultDaypartSettings("12:00 AM", "5:00 AM"),
  },
})

const defaultChannelTypeSettings: ChannelTypeSettings = {
  selectedChannelType: "Broadcast / OTA",
  channelTypes: {},
}

// Helper functions for date calculations
const getLastSundayOfNovember = (year: number): Date => {
  const november = new Date(year, 10, 30) // November 30th
  const dayOfWeek = november.getDay()
  const lastSunday = new Date(november)
  lastSunday.setDate(30 - dayOfWeek)
  return lastSunday
}

const getFirstSaturdayOfFebruary = (year: number): Date => {
  const february = new Date(year, 1, 1) // February 1st
  const dayOfWeek = february.getDay()
  const firstSaturday = new Date(february)
  const daysToAdd = dayOfWeek === 0 ? 6 : 6 - dayOfWeek
  firstSaturday.setDate(1 + daysToAdd)
  return firstSaturday
}

const getFirstSundayOfMonth = (year: number, month: number): Date => {
  const firstDay = new Date(year, month, 1)
  const dayOfWeek = firstDay.getDay()
  const firstSunday = new Date(firstDay)
  const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  firstSunday.setDate(1 + daysToAdd)
  return firstSunday
}

const calculateSeasonEnd = (seasonStart: Date): Date => {
  // Validate input date
  if (!seasonStart || isNaN(seasonStart.getTime())) {
    throw new Error("Invalid season start date")
  }

  // Add 52 weeks (364 days) to season start
  const fiftyTwoWeeksLater = new Date(seasonStart.getTime())
  fiftyTwoWeeksLater.setDate(seasonStart.getDate() + 52 * 7)

  // Validate the calculated date
  if (isNaN(fiftyTwoWeeksLater.getTime())) {
    throw new Error("Invalid calculated date")
  }

  // Find the Saturday of that week
  const dayOfWeek = fiftyTwoWeeksLater.getDay()
  const saturday = new Date(fiftyTwoWeeksLater.getTime())
  const daysToSaturday = dayOfWeek === 6 ? 0 : 6 - dayOfWeek
  saturday.setDate(fiftyTwoWeeksLater.getDate() + daysToSaturday)

  // Validate final date
  if (isNaN(saturday.getTime())) {
    throw new Error("Invalid final calculated date")
  }

  return saturday
}

const ensureSunday = (date: Date): Date => {
  // Validate input date
  if (!date || isNaN(date.getTime())) {
    throw new Error("Invalid input date")
  }

  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0) return new Date(date.getTime()) // Already Sunday, return copy

  // Move to the previous Sunday for consistency
  const sunday = new Date(date.getTime())
  sunday.setDate(date.getDate() - dayOfWeek)

  // Validate result
  if (isNaN(sunday.getTime())) {
    throw new Error("Invalid Sunday calculation")
  }

  return sunday
}

const isValidDateString = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== "string") return false
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/)
}

const formatDateToISO = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    throw new Error("Cannot format invalid date")
  }
  return date.toISOString().split("T")[0]
}

const getDefaultTVSeasonSettings = (): TVSeasonSettings => {
  try {
    const currentYear = new Date().getFullYear()

    // Start with September 7th, but ensure it's a Sunday
    const initialSeasonStart = new Date(currentYear, 8, 7) // September 7th
    const seasonStart = ensureSunday(initialSeasonStart)

    // Calculate season end as 52 weeks ahead, ending on Saturday
    const seasonEnd = calculateSeasonEnd(seasonStart)

    // Summer break: First Sunday in June to Season End
    const summerBreakStart = getFirstSundayOfMonth(seasonEnd.getFullYear(), 5) // June (month 5)
    const summerBreakEnd = new Date(seasonEnd.getTime()) // Same as season end

    const winterBreakStart = getLastSundayOfNovember(currentYear)
    const winterBreakEnd = getFirstSaturdayOfFebruary(currentYear + 1)

    return {
      seasonsPerSeason: "unlimited",
      seasonStart: formatDateToISO(seasonStart),
      seasonEnd: formatDateToISO(seasonEnd),
      winterBreakEnabled: false,
      winterBreakStart: formatDateToISO(winterBreakStart),
      winterBreakEnd: formatDateToISO(winterBreakEnd),
      summerBreakEnabled: false,
      summerBreakStart: formatDateToISO(summerBreakStart),
      summerBreakEnd: formatDateToISO(summerBreakEnd),
    }
  } catch (error) {
    console.error("Error creating default TV season settings:", error)
    // Fallback to basic settings if calculation fails
    const currentYear = new Date().getFullYear()
    const fallbackStart = new Date(currentYear, 8, 1) // September 1st
    const fallbackEnd = new Date(currentYear + 1, 7, 31) // August 31st next year

    return {
      seasonsPerSeason: "unlimited",
      seasonStart: formatDateToISO(fallbackStart),
      seasonEnd: formatDateToISO(fallbackEnd),
      winterBreakEnabled: false,
      winterBreakStart: formatDateToISO(new Date(currentYear, 10, 24)), // November 24th
      winterBreakEnd: formatDateToISO(new Date(currentYear + 1, 1, 8)), // February 8th
      summerBreakEnabled: false,
      summerBreakStart: formatDateToISO(new Date(currentYear + 1, 5, 1)), // June 1st
      summerBreakEnd: formatDateToISO(fallbackEnd),
    }
  }
}

const getDefaultChannelInfoDisplay = (): ChannelInfoDisplay => {
  return {
    showChannelNumber: true,
    showChannelName: true,
    location: "top-left",
    font: "PxPlus IBM CGA",
  }
}

const getDefaultMediaInfoDisplay = (): MediaInfoDisplay => {
  return {
    showMediaName: true,
    showEpisodeName: true,
    showTimeslot: true,
    location: "top-left",
  }
}

const getDefaultSafeHarborTimes = (): SafeHarborTimes => {
  return {
    startTime: "00:00 AM",
    endTime: "12:00 PM",
  }
}

const getDefaultChannelTypeSettings = (): ChannelTypeSettings => {
  return defaultChannelTypeSettings
}

const defaultSettings: Settings = {
  autoSchedule: false,
  safeHarbor: true,
  safeHarborTimes: getDefaultSafeHarborTimes(),
  rememberLastChannel: true,
  defaultChannel: 3,
  tvOut: "auto",
  audienceMatch: true,
  ratingAudioFiles: defaultRatingAudioFiles,
  showChannelInfo: true,
  channelInfoDisplay: getDefaultChannelInfoDisplay(),
  showMediaInfo: true,
  mediaInfoDisplay: getDefaultMediaInfoDisplay(),
  tvSeason: getDefaultTVSeasonSettings(),
  channelTypeSettings: defaultChannelTypeSettings,
  accentColor: "blue",
  infoDisplayDuration: 3,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  /* --------------------------- load on mount ---------------------------- */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("virtualTvSettings")
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        // Ensure tvSeason exists in loaded settings
        if (!parsedSettings.tvSeason) {
          parsedSettings.tvSeason = getDefaultTVSeasonSettings()
        }
        if (!parsedSettings.channelInfoDisplay) {
          parsedSettings.channelInfoDisplay = getDefaultChannelInfoDisplay()
        }
        if (!parsedSettings.mediaInfoDisplay) {
          parsedSettings.mediaInfoDisplay = getDefaultMediaInfoDisplay()
        }
        if (!parsedSettings.safeHarborTimes) {
          parsedSettings.safeHarborTimes = getDefaultSafeHarborTimes()
        }
        if (!parsedSettings.channelTypeSettings) {
          parsedSettings.channelTypeSettings = getDefaultChannelTypeSettings()
        }
        if (!parsedSettings.accentColor) {
          parsedSettings.accentColor = "blue"
        }
        if (!parsedSettings.infoDisplayDuration) {
          parsedSettings.infoDisplayDuration = 3
        }
        setSettings({ ...defaultSettings, ...parsedSettings })
      }
    } catch (err) {
      console.error("Error loading settings:", err)
    }
  }, [])

  /* ------------------------- helpers & setters -------------------------- */
  const saveSettings = (s: Settings) => {
    try {
      localStorage.setItem("virtualTvSettings", JSON.stringify(s))
      setSettings(s)
    } catch (err) {
      console.error("Error saving settings:", err)
    }
  }

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      saveSettings({ ...settings, [key]: value })
    },
    [settings],
  )

  // Update TV season settings
  const updateTVSeasonSetting = useCallback(
    <K extends keyof TVSeasonSettings>(key: K, value: TVSeasonSettings[K]) => {
      try {
        const updatedTVSeason = { ...settings.tvSeason, [key]: value }

        // Auto-calculate season end and summer break when season start changes
        if (key === "seasonStart" && typeof value === "string") {
          // Validate the input date string
          if (!isValidDateString(value)) {
            console.error("Invalid date string provided:", value)
            return
          }

          const startDate = new Date(value)

          // Validate the parsed date
          if (isNaN(startDate.getTime())) {
            console.error("Invalid date parsed from string:", value)
            return
          }

          // Ensure season start is always a Sunday
          const sundayStart = ensureSunday(startDate)
          updatedTVSeason.seasonStart = formatDateToISO(sundayStart)

          // Calculate season end as 52 weeks ahead, ending on Saturday
          const seasonEnd = calculateSeasonEnd(sundayStart)
          updatedTVSeason.seasonEnd = formatDateToISO(seasonEnd)

          // Update summer break dates
          const summerBreakStart = getFirstSundayOfMonth(seasonEnd.getFullYear(), 5) // June
          updatedTVSeason.summerBreakStart = formatDateToISO(summerBreakStart)
          updatedTVSeason.summerBreakEnd = formatDateToISO(seasonEnd) // Same as season end
        }

        saveSettings({ ...settings, tvSeason: updatedTVSeason })
      } catch (error) {
        console.error("Error updating TV season setting:", error)
        // Don't update if there's an error
      }
    },
    [settings],
  )

  // stable reference – avoids re-creating the fn every render
  const updateLastViewedChannel = useCallback(
    (channelNumber: number) => {
      if (settings.lastViewedChannel !== channelNumber) {
        saveSettings({ ...settings, lastViewedChannel: channelNumber })
      }
    },
    [settings],
  )

  const updateRatingAudioFile = useCallback(
    (rating: keyof RatingAudioFiles, value: string) => {
      saveSettings({
        ...settings,
        ratingAudioFiles: { ...settings.ratingAudioFiles, [rating]: value },
      })
    },
    [settings],
  )

  const updateChannelInfoDisplay = useCallback(
    <K extends keyof ChannelInfoDisplay>(key: K, value: ChannelInfoDisplay[K]) => {
      const updatedChannelInfoDisplay = { ...settings.channelInfoDisplay, [key]: value }
      saveSettings({ ...settings, channelInfoDisplay: updatedChannelInfoDisplay })
    },
    [settings],
  )

  const updateMediaInfoDisplay = useCallback(
    <K extends keyof MediaInfoDisplay>(key: K, value: MediaInfoDisplay[K]) => {
      const updatedMediaInfoDisplay = { ...settings.mediaInfoDisplay, [key]: value }
      saveSettings({ ...settings, mediaInfoDisplay: updatedMediaInfoDisplay })
    },
    [settings],
  )

  const updateSafeHarborTimes = useCallback(
    <K extends keyof SafeHarborTimes>(key: K, value: SafeHarborTimes[K]) => {
      const updatedSafeHarborTimes = { ...settings.safeHarborTimes, [key]: value }
      saveSettings({ ...settings, safeHarborTimes: updatedSafeHarborTimes })
    },
    [settings],
  )

  // Get current channel type settings or create default
  const getCurrentChannelTypeSettings = useCallback((): SingleChannelTypeSettings => {
    if (!settings.channelTypeSettings) {
      return createDefaultSingleChannelTypeSettings()
    }
    const channelType = settings.channelTypeSettings.selectedChannelType || "Broadcast / OTA"
    const channelTypes = settings.channelTypeSettings.channelTypes || {}
    return channelTypes[channelType] || createDefaultSingleChannelTypeSettings()
  }, [settings])

  const updateSelectedChannelType = useCallback(
    (channelType: string) => {
      saveSettings({
        ...settings,
        channelTypeSettings: {
          ...settings.channelTypeSettings,
          selectedChannelType: channelType,
        },
      })
    },
    [settings],
  )

  const updateChannelTypeSettings = useCallback(
    (updates: Partial<ChannelTypeSettings>) => {
      const updatedChannelTypeSettings = { ...settings.channelTypeSettings, ...updates }
      saveSettings({ ...settings, channelTypeSettings: updatedChannelTypeSettings })
    },
    [settings],
  )

  const updateCooldownSetting = useCallback(
    <K extends keyof CooldownSettings>(key: K, value: CooldownSettings[K]) => {
      const channelType = settings.channelTypeSettings.selectedChannelType
      const currentSettings = getCurrentChannelTypeSettings()
      const updatedCooldown = { ...currentSettings.cooldown, [key]: value }
      const updatedSingleSettings = { ...currentSettings, cooldown: updatedCooldown }
      const updatedChannelTypes = {
        ...settings.channelTypeSettings.channelTypes,
        [channelType]: updatedSingleSettings,
      }
      saveSettings({
        ...settings,
        channelTypeSettings: {
          ...settings.channelTypeSettings,
          channelTypes: updatedChannelTypes,
        },
      })
    },
    [settings, getCurrentChannelTypeSettings],
  )

  const updateDaypartSetting = useCallback(
    (daypart: string, field: keyof DaypartSettings, value: string | string[]) => {
      const channelType = settings.channelTypeSettings.selectedChannelType
      const currentSettings = getCurrentChannelTypeSettings()
      const currentDaypart = currentSettings.dayparts[daypart] || createDefaultDaypartSettings("", "")
      const updatedDaypart = { ...currentDaypart, [field]: value }
      const updatedDayparts = { ...currentSettings.dayparts, [daypart]: updatedDaypart }
      const updatedSingleSettings = { ...currentSettings, dayparts: updatedDayparts }
      const updatedChannelTypes = {
        ...settings.channelTypeSettings.channelTypes,
        [channelType]: updatedSingleSettings,
      }
      saveSettings({
        ...settings,
        channelTypeSettings: {
          ...settings.channelTypeSettings,
          channelTypes: updatedChannelTypes,
        },
      })
    },
    [settings, getCurrentChannelTypeSettings],
  )

  const saveCurrentChannelTypeSettings = useCallback(() => {
    const channelType = settings.channelTypeSettings.selectedChannelType
    const currentSettings = getCurrentChannelTypeSettings()
    const updatedChannelTypes = {
      ...settings.channelTypeSettings.channelTypes,
      [channelType]: currentSettings,
    }
    saveSettings({
      ...settings,
      channelTypeSettings: {
        ...settings.channelTypeSettings,
        channelTypes: updatedChannelTypes,
      },
    })
  }, [settings, getCurrentChannelTypeSettings])

  const clearCurrentChannelTypeSettings = useCallback(() => {
    const channelType = settings.channelTypeSettings.selectedChannelType
    const updatedChannelTypes = { ...settings.channelTypeSettings.channelTypes }
    delete updatedChannelTypes[channelType]
    saveSettings({
      ...settings,
      channelTypeSettings: {
        ...settings.channelTypeSettings,
        channelTypes: updatedChannelTypes,
      },
    })
  }, [settings])

  const resetSettings = () => saveSettings(defaultSettings)

  return {
    settings,
    updateSetting,
    updateTVSeasonSetting,
    updateRatingAudioFile,
    updateLastViewedChannel,
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
    resetSettings,
  }
}
