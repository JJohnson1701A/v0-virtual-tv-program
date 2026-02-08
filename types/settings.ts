export interface RatingAudioFiles {
  // TV Ratings
  "TV-Y": string
  "TV-Y7": string
  "TV-G": string
  "TV-PG": string
  "TV-14": string
  "TV-MA": string
  // Movie Ratings
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
  mediaTypes: string[]
  audience: string[]
  genre: string[]
}

export interface SingleChannelTypeSettings {
  cooldown: CooldownSettings
  dayparts: {
    earlyMorning: DaypartSettings
    daytime: DaypartSettings
    afterSchool: DaypartSettings
    earlyFringe: DaypartSettings
    earlyPrime: DaypartSettings
    primetime: DaypartSettings
    latePrime: DaypartSettings
    lateNight: DaypartSettings
    overnight: DaypartSettings
  }
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

// Helper function to get the last Sunday of November
const getLastSundayOfNovember = (year: number): Date => {
  const november = new Date(year, 10, 30) // November 30th
  const dayOfWeek = november.getDay()
  const lastSunday = new Date(november)
  lastSunday.setDate(30 - dayOfWeek)
  return lastSunday
}

// Helper function to get the first Saturday of February
const getFirstSaturdayOfFebruary = (year: number): Date => {
  const february = new Date(year, 1, 1) // February 1st
  const dayOfWeek = february.getDay()
  const firstSaturday = new Date(february)
  const daysToAdd = dayOfWeek === 0 ? 6 : 6 - dayOfWeek
  firstSaturday.setDate(1 + daysToAdd)
  return firstSaturday
}

// Helper function to get the first Sunday of a given month/year
const getFirstSundayOfMonth = (year: number, month: number): Date => {
  const firstDay = new Date(year, month, 1)
  const dayOfWeek = firstDay.getDay()
  const firstSunday = new Date(firstDay)
  const daysToAdd = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  firstSunday.setDate(1 + daysToAdd)
  return firstSunday
}

// Helper function to calculate season end (52 weeks ahead, ending on Saturday)
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

// Helper function to ensure a date is a Sunday (adjust to nearest Sunday)
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

// Helper function to format date to ISO string safely
const formatDateToISO = (date: Date): string => {
  if (!date || isNaN(date.getTime())) {
    throw new Error("Cannot format invalid date")
  }
  return date.toISOString().split("T")[0]
}

// Default TV season settings
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
    startTime: "10:00 PM",
    endTime: "6:00 AM",
  }
}

const getDefaultDaypartSettings = (): DaypartSettings => {
  return {
    mediaTypes: [],
    audience: [],
    genre: [],
  }
}

const getDefaultCooldownSettings = (): CooldownSettings => {
  return {
    movies: "Same Day only",
    tvShow: "Same Day only",
    tvEpisodes: "Same Day only",
    filler: "Same Day only",
    musicVideos: "Same Day only",
  }
}

const getDefaultSingleChannelTypeSettings = (): SingleChannelTypeSettings => {
  return {
    cooldown: getDefaultCooldownSettings(),
    dayparts: {
      earlyMorning: getDefaultDaypartSettings(),
      daytime: getDefaultDaypartSettings(),
      afterSchool: getDefaultDaypartSettings(),
      earlyFringe: getDefaultDaypartSettings(),
      earlyPrime: getDefaultDaypartSettings(),
      primetime: getDefaultDaypartSettings(),
      latePrime: getDefaultDaypartSettings(),
      lateNight: getDefaultDaypartSettings(),
      overnight: getDefaultDaypartSettings(),
    },
  }
}

const getDefaultChannelTypeSettings = (): ChannelTypeSettings => {
  return {
    selectedChannelType: "Broadcast / OTA",
    channelTypes: {},
  }
}

export { getDefaultSingleChannelTypeSettings }

export const defaultSettings: Settings = {
  autoSchedule: false,
  safeHarbor: true,
  safeHarborTimes: getDefaultSafeHarborTimes(),
  rememberLastChannel: true,
  defaultChannel: 3,
  tvOut: "auto",
  audienceMatch: true,
  ratingAudioFiles: {
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
  },
  showChannelInfo: true,
  channelInfoDisplay: getDefaultChannelInfoDisplay(),
  showMediaInfo: true,
  mediaInfoDisplay: getDefaultMediaInfoDisplay(),
  tvSeason: getDefaultTVSeasonSettings(),
  channelTypeSettings: getDefaultChannelTypeSettings(),
  accentColor: "blue",
  infoDisplayDuration: 3,
}
