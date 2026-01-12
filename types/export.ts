import type { MediaItem } from "./media"
import type { Channel } from "./channel"
import type { Settings } from "@/hooks/use-settings"

export interface VirtualTVExportData {
  version: string
  exportDate: string
  settings: Settings
  mediaLibrary: MediaItem[]
  channels: Channel[]
  schedules?: any[] // For future scheduler data
  assets: Record<string, string> // Base64 encoded files
}

export interface ImportInfo {
  importDate: string
  originalExportDate: string
  version: string
}
