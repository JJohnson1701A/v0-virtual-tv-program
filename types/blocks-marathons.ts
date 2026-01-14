export type BlockOccurrence = "weekly" | "weekdays" | "annual" | "once"
export type BlockOrder = "chronological" | "shuffle" | "random"
export type BlockFillerSource = "block" | "block-channel" | "all" | "none"
export type MarathonFillerSource = "marathon" | "marathon-channel" | "all" | "none"
export type BlockFillStyle = "intermixed" | "at-end" | "at-beginning" | "none" | "static"
export type BlockRepeat = "restart" | "followup" | "end"
export type OverlayPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left"

export interface BlockMediaItem {
  id: string
  mediaId: string
  mediaType: string
  title: string
  runtime: number
  order: number
  followupMediaId?: string // For "Play Followup" repeat option
}

export interface MarathonEpisode {
  id: string
  mediaId: string
  episodeId?: string // For TV show episodes
  title: string
  runtime: number
  order: number
}

export interface Block {
  id: string
  name: string
  logo?: string
  overlay?: string
  overlayPosition: OverlayPosition
  occurrence: BlockOccurrence
  annualDate?: string // For annual occurrence
  dayOfWeek?: number // Added for weekly occurrence (0=Sunday, 1=Monday, etc.)
  startTime?: string // Time block starts (e.g., "08:00 PM")
  duration: number // in minutes
  order: BlockOrder
  channelId?: string
  fillerSource: BlockFillerSource
  fillStyle: BlockFillStyle
  repeat: BlockRepeat
  mediaItems: BlockMediaItem[]
  dateCreated: string
}

export interface Marathon {
  id: string
  name: string
  logo?: string
  overlay?: string
  overlayPosition: OverlayPosition
  occurrence: BlockOccurrence
  annualDate?: string // For annual occurrence
  dayOfWeek?: number // Added for weekly occurrence (0=Sunday, 1=Monday, etc.)
  startTime?: string // Added time for marathon starts
  duration: number // in minutes
  channelId?: string
  fillerSource: MarathonFillerSource
  fillStyle: BlockFillStyle
  repeat: BlockRepeat
  episodes: MarathonEpisode[]
  dateCreated: string
}
