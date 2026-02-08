export type OverlayPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left"

export type ChannelType =
  | "Over-the-Air (OTA)"
  | "Basic Cable"
  | "Premium Cable"
  | "Movie Channel"
  | "Kids Channel"
  | "Sports Channel"
  | "Music/Variety Channel"
  | "Faith Channel"
  | "News/Talk Channel"
  | "On-Demand/Playlist Channel"
  | "FAST/Streaming Linear Channel"

export interface Channel {
  id: string
  name: string
  number: number
  logo?: string
  overlay?: string
  overlayPosition?: OverlayPosition
  overlayOpacity?: number // 0–100, default 75
  defaultLanguage: string
  defaultSubtitleLanguage: string
  signOff: boolean
  signOffTime?: string
  signOnTime?: string
  signOffVideo?: string
  ratingContentWarning: boolean
  assignedMedia: string[] // Array of media IDs assigned to this channel
  assignedSeasons: Record<string, number[]> // mediaId -> array of season numbers
  autoSchedulerAudience?: string[]
  autoSchedulerAudienceExclude?: string[]
  autoSchedulerTVGenre?: string[]
  autoSchedulerTVGenreExclude?: string[]
  autoSchedulerMovieGenre?: string[]
  autoSchedulerMovieGenreExclude?: string[]
  autoSchedulerShowCategory?: string[]
  autoSchedulerShowCategoryExclude?: string[]
  autoSchedulerProgramFormat?: string[]
  autoSchedulerProgramFormatExclude?: string[]
  contentWarningFilter?: {
    include: string[]
    exclude: string[]
  }
  channelType?: ChannelType
  dateCreated: string
}
