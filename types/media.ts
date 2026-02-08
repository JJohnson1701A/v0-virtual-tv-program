export type MediaType = "movies" | "tvshows" | "musicvideos" | "filler" | "podcasts" | "livestreams"

export type FillerType =
  | "commercial"
  | "bumper in"
  | "bumper out"
  | "ratings notice"
  | "station ID"
  | "block-marathon ID"
  | "promo"
  | "trailer"
  | "PSA"
  | "Emergency Alert"
  | "Interstitial"
  | "ident-channel"
  | "ident-movie"
  | "ident-TV show"

export type CommercialCategory =
  | "alcohol"
  | "appliance"
  | "banking"
  | "beauty-grooming product"
  | "board game"
  | "boy toy"
  | "car"
  | "cleaning product"
  | "clothing"
  | "department store"
  | "education service"
  | "educational toy"
  | "fast food"
  | "fitness"
  | "food"
  | "general"
  | "girl toy"
  | "household products"
  | "insurance"
  | "investment"
  | "parody"
  | "pharma"
  | "snack"
  | "streaming service"
  | "supplement"
  | "tech product"
  | "telecom"
  | "tobacco"
  | "toy"
  | "travel"
  | "video game"
  | "other"

export type TimeOfYear =
  | "Any"
  | "Spring (3-1 to 5-31)"
  | "Summer (6-1 to 8-31)"
  | "Autumn (9-1 to 11-30)"
  | "Winter (12-1 to 2-28)"
  | "New Year (12-26 to 1-1)"
  | "Valentines (2-1 to 2-14)"
  | "Easter (3-15 to 4-15)"
  | "Independence Day (7-1 to 7-4)"
  | "Back to School (8-1 to 9-15)"
  | "Halloween (10-1 to 10-31)"
  | "Thanksgiving (11-1 to 11-30)"
  | "Christmas (12-1 to 12-25)"

export type Season =
  | "School Year (09-01 to 05-31)"
  | "Autumn (09-01 to 11-30)"
  | "Back to School (08-15 to 09-15)"
  | "Labor Day (08-25 to 09-10)"
  | "Halloween (10-01 to 10-31)"
  | "Thanksgiving (11-01 to 11-30)"
  | "Winter (12-01 to 02-28/29)"
  | "Christmas (12-01 to 12-25)"
  | "Winter Break (12-20 to 12-25)"
  | "New Year (12-26 to 01-15)"
  | "Super Bowl (01-20 to 02-15)"
  | "Valentine's Day (02-01 to 02-28)"
  | "Spring (03-01 to 03-31)"
  | "St. Patrick's Day (03-01 to 03-31)"
  | "Spring Break (03-01 to 04-15)"
  | "March Madness (03-10 to 04-10)"
  | "Easter (2 Weeks before Easter Sunday)"
  | "Summer Break (06-01 to 08-31)"
  | "Independence Day (06-25 to 07-10)"

export type MovieRating = "G" | "PG" | "PG-13" | "R" | "NC-17" | "X"
export type TVRating = "TV-Y" | "TV-Y7" | "TV-G" | "TV-PG" | "TV-14" | "TV-MA"

export interface TVShowEpisode {
  id: string
  title: string
  seasonNumber: number
  episodeNumber: number
  airDate: string
  file: string
  breaks: string
}

export interface MediaItem {
  id: string
  type: MediaType
  title: string
  year: number
  poster: string
  files: string[]
  dateAdded: string
  genre?: string
  rating?: MovieRating // Updated to use MovieRating type
  tvRating?: TVRating // Updated to use TVRating type
  contentWarning?: string // Legacy field
  contentWarningData?: {
    enabled: boolean
    categories: string[]
    subcategories: string[]
  }
  audience?: string
  category?: string | string[] // Updated to support both single and multi-select
  breaks?: string
  episodes?: TVShowEpisode[]
  runtime?: number // Add runtime field for scheduling
  // New filler-specific fields
  fillerType?: FillerType
  commercialCategory?: CommercialCategory
  product?: string
  timeOfYear?: TimeOfYear
  assignedChannelId?: string | string[] // Updated to support both single and multi-select
  // New music video-specific fields
  bandName?: string
  songTitle?: string
  albumName?: string
  recordLabel?: string
  directors?: string
  language?: string
  country?: string
  seasons?: Season[]
  seasonsExclude?: Season[] // Excluded seasons for auto-scheduling
  // Movie series fields
  isMovieSeries?: boolean
  seriesName?: string
  seriesOrder?: number
  // Allowable commercials for TV shows
  allowedCommercials?: CommercialCategory[]
  excludedCommercials?: CommercialCategory[]
}
