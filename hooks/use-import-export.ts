"use client"

import type { MediaItem } from "@/types/media"
import type { Channel } from "@/types/channel"
import type { Settings } from "@/hooks/use-settings"
import type { Block, Marathon } from "@/types/blocks-marathons"
import type { ScheduleItem } from "@/types/schedule"

interface ChannelExportData {
  version: string
  exportDate: string
  type: "channels"
  channels: Channel[]
  assets: Record<string, string>
}

interface VirtualTVExportData {
  version: string
  exportDate: string
  settings: Settings
  mediaLibrary: MediaItem[]
  channels: Channel[]
  schedules: ScheduleItem[]
  blocks: Block[]
  marathons: Marathon[]
  assets: Record<string, string> // Base64 encoded files
}

export function useImportExport() {
  // Convert file URL to base64
  const fileToBase64 = async (url: string): Promise<string> => {
    try {
      if (url.startsWith("blob:") || url.startsWith("data:")) {
        const response = await fetch(url)
        const blob = await response.blob()
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
      }
      return url // Return as-is if it's not a blob URL
    } catch (error) {
      console.warn("Failed to convert file to base64:", url, error)
      return url
    }
  }

  // Convert base64 back to blob URL
  const base64ToBlob = (base64: string): string => {
    try {
      if (base64.startsWith("data:")) {
        const blob = dataURLtoBlob(base64)
        return URL.createObjectURL(blob)
      }
      return base64 // Return as-is if it's not base64
    } catch (error) {
      console.warn("Failed to convert base64 to blob:", error)
      return base64
    }
  }

  // Helper function to convert data URL to blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(",")
    const mime = arr[0].match(/:(.*?);/)?.[1] || ""
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  // Collect all file URLs from data
  const collectFileUrls = (data: any): string[] => {
    const urls: string[] = []

    const traverse = (obj: any) => {
      if (typeof obj === "string" && (obj.startsWith("blob:") || obj.startsWith("data:"))) {
        urls.push(obj)
      } else if (typeof obj === "object" && obj !== null) {
        Object.values(obj).forEach(traverse)
      } else if (Array.isArray(obj)) {
        obj.forEach(traverse)
      }
    }

    traverse(data)
    return [...new Set(urls)] // Remove duplicates
  }

  // Replace file URLs in data with asset keys
  const replaceUrlsWithKeys = (data: any, urlToKeyMap: Record<string, string>): any => {
    if (typeof data === "string" && urlToKeyMap[data]) {
      return `__ASSET__${urlToKeyMap[data]}`
    } else if (Array.isArray(data)) {
      return data.map((item) => replaceUrlsWithKeys(item, urlToKeyMap))
    } else if (typeof data === "object" && data !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        result[key] = replaceUrlsWithKeys(value, urlToKeyMap)
      }
      return result
    }
    return data
  }

  // Replace asset keys back to URLs
  // keepDataUrls: if true, keeps data: URLs as-is instead of converting to blob URLs
  const replaceKeysWithUrls = (data: any, assets: Record<string, string>, keepDataUrls = false): any => {
    if (typeof data === "string" && data.startsWith("__ASSET__")) {
      const assetKey = data.replace("__ASSET__", "")
      if (!assets[assetKey]) return data
      if (keepDataUrls && assets[assetKey].startsWith("data:")) {
        return assets[assetKey]
      }
      return base64ToBlob(assets[assetKey])
    } else if (Array.isArray(data)) {
      return data.map((item) => replaceKeysWithUrls(item, assets, keepDataUrls))
    } else if (typeof data === "object" && data !== null) {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        result[key] = replaceKeysWithUrls(value, assets, keepDataUrls)
      }
      return result
    }
    return data
  }

  const exportData = async (): Promise<VirtualTVExportData> => {
    // Get all data from localStorage
    const settings = JSON.parse(localStorage.getItem("virtualTvSettings") || "{}")
    const mediaLibrary = JSON.parse(localStorage.getItem("mediaLibrary") || "[]")
    const channels = JSON.parse(localStorage.getItem("virtualTvChannels") || "[]")
    const schedules = JSON.parse(localStorage.getItem("virtualTvSchedules") || "[]")
    const blocks = JSON.parse(localStorage.getItem("virtualTvBlocks") || "[]")
    const marathons = JSON.parse(localStorage.getItem("virtualTvMarathons") || "[]")

    // Collect all file URLs
    const allData = { settings, mediaLibrary, channels, schedules, blocks, marathons }
    const fileUrls = collectFileUrls(allData)

    // Convert files to base64 and create asset map
    const assets: Record<string, string> = {}
    const urlToKeyMap: Record<string, string> = {}

    for (let i = 0; i < fileUrls.length; i++) {
      const url = fileUrls[i]
      const assetKey = `asset_${i}`
      const base64 = await fileToBase64(url)
      assets[assetKey] = base64
      urlToKeyMap[url] = assetKey
    }

    // Replace URLs with asset keys in the data
    const processedData = replaceUrlsWithKeys(allData, urlToKeyMap)

    return {
      version: "3.0.0",
      exportDate: new Date().toISOString(),
      settings: processedData.settings,
      mediaLibrary: processedData.mediaLibrary,
      channels: processedData.channels,
      schedules: processedData.schedules,
      blocks: processedData.blocks,
      marathons: processedData.marathons,
      assets,
    }
  }

  const importData = async (file: File): Promise<void> => {
    try {
      const text = await file.text()
      const importedData: VirtualTVExportData = JSON.parse(text)

      // Validate the import data structure
      if (!importedData.version || !importedData.exportDate) {
        throw new Error("Invalid export file format")
      }

      // Replace asset keys back to blob URLs
      const processedData = {
        settings: replaceKeysWithUrls(importedData.settings, importedData.assets || {}),
        mediaLibrary: replaceKeysWithUrls(importedData.mediaLibrary, importedData.assets || {}),
        channels: replaceKeysWithUrls(importedData.channels, importedData.assets || {}),
        schedules: replaceKeysWithUrls(importedData.schedules || [], importedData.assets || {}),
        blocks: replaceKeysWithUrls(importedData.blocks || [], importedData.assets || {}),
        marathons: replaceKeysWithUrls(importedData.marathons || [], importedData.assets || {}),
      }

      // Clear existing data and import new data
      localStorage.clear()

      // Import all data to localStorage
      if (processedData.settings) {
        localStorage.setItem("virtualTvSettings", JSON.stringify(processedData.settings))
      }

      if (processedData.mediaLibrary) {
        localStorage.setItem("mediaLibrary", JSON.stringify(processedData.mediaLibrary))
      }

      if (processedData.channels) {
        localStorage.setItem("virtualTvChannels", JSON.stringify(processedData.channels))
      }

      if (processedData.schedules) {
        localStorage.setItem("virtualTvSchedules", JSON.stringify(processedData.schedules))
      }

      if (processedData.blocks) {
        localStorage.setItem("virtualTvBlocks", JSON.stringify(processedData.blocks))
      }

      if (processedData.marathons) {
        localStorage.setItem("virtualTvMarathons", JSON.stringify(processedData.marathons))
      }

      // Store import metadata
      localStorage.setItem(
        "virtualTvImportInfo",
        JSON.stringify({
          importDate: new Date().toISOString(),
          originalExportDate: importedData.exportDate,
          version: importedData.version,
        }),
      )
    } catch (error) {
      console.error("Import failed:", error)
      throw new Error("Failed to import data. Please check the file format.")
    }
  }

  const exportChannels = async (): Promise<ChannelExportData> => {
    const channels: Channel[] = JSON.parse(localStorage.getItem("virtualTvChannels") || "[]")

    // Collect all file URLs from channel data (logos, overlays, signoff videos)
    const fileUrls = collectFileUrls(channels)

    const assets: Record<string, string> = {}
    const urlToKeyMap: Record<string, string> = {}

    for (let i = 0; i < fileUrls.length; i++) {
      const url = fileUrls[i]
      const assetKey = `ch_asset_${i}`
      const base64 = await fileToBase64(url)
      assets[assetKey] = base64
      urlToKeyMap[url] = assetKey
    }

    const processedChannels = replaceUrlsWithKeys(channels, urlToKeyMap)

    return {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      type: "channels",
      channels: processedChannels,
      assets,
    }
  }

  const importChannels = async (file: File): Promise<{ count: number }> => {
    const text = await file.text()
    const importedData: ChannelExportData = JSON.parse(text)

    if (!importedData.version || !importedData.exportDate || importedData.type !== "channels") {
      throw new Error("Invalid channel export file. Please select a valid channel export (.json) file.")
    }

    if (!Array.isArray(importedData.channels) || importedData.channels.length === 0) {
      throw new Error("The file contains no channels to import.")
    }

    // Restore assets as persistent data URLs (not ephemeral blob URLs)
    const restoredChannels: Channel[] = replaceKeysWithUrls(
      importedData.channels,
      importedData.assets || {},
      true,
    )

    // Merge with existing channels — match by channel number, otherwise append
    const existingChannels: Channel[] = JSON.parse(localStorage.getItem("virtualTvChannels") || "[]")
    const existingByNumber = new Map(existingChannels.map((c) => [c.number, c]))

    let importedCount = 0
    for (const incoming of restoredChannels) {
      const existing = existingByNumber.get(incoming.number)
      if (existing) {
        // Overwrite the existing channel, keeping the original id
        existingByNumber.set(incoming.number, { ...incoming, id: existing.id })
      } else {
        // Assign a fresh id for new channels
        existingByNumber.set(incoming.number, { ...incoming, id: `channel-${Date.now()}-${importedCount}` })
      }
      importedCount++
    }

    const mergedChannels = Array.from(existingByNumber.values()).sort((a, b) => a.number - b.number)
    localStorage.setItem("virtualTvChannels", JSON.stringify(mergedChannels))

    return { count: importedCount }
  }

  return {
    exportData,
    importData,
    exportChannels,
    importChannels,
  }
}
