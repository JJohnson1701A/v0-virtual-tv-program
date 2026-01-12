export type OverlayPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left"

export interface Channel {
  id: string
  name: string
  number: number
  logo?: string
  overlay?: string
  overlayPosition?: OverlayPosition
  defaultLanguage: string
  defaultSubtitleLanguage: string
  signOff: boolean
  signOffTime?: string
  signOnTime?: string
  signOffVideo?: string
  ratingContentWarning: boolean
  assignedMedia: string[] // Array of media IDs assigned to this channel
  assignedSeasons: Record<string, number[]> // mediaId -> array of season numbers
  dateCreated: string
}
