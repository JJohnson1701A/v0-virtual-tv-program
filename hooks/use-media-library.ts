"use client"

import { useState, useEffect } from "react"
import type { MediaItem, MediaType } from "@/types/media"

// This is a mock implementation that would be replaced with actual storage
// like localStorage, IndexedDB, or a backend API in a real application
export function useMediaLibrary(type: MediaType, sortOrder: string) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load media items from storage
  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true)
      try {
        // In a real app, this would fetch from an API or local storage
        const storedItems = localStorage.getItem("mediaLibrary")
        let items: MediaItem[] = storedItems ? JSON.parse(storedItems) : []

        // Filter by type
        items = items.filter((item) => item.type === type)

        // Sort items
        items = sortItems(items, sortOrder)

        setMediaItems(items)
      } catch (error) {
        console.error("Error loading media items:", error)
        setMediaItems([])
      } finally {
        setIsLoading(false)
      }
    }

    loadItems()
  }, [type, sortOrder])

  // Save all items to storage
  const saveItems = (items: MediaItem[]) => {
    try {
      // In a real app, this would save to an API or local storage
      const allItems = getAllItems()

      // Remove items of current type
      const otherItems = allItems.filter((item) => item.type !== type)

      // Add the updated items
      const updatedItems = [...otherItems, ...items]

      localStorage.setItem("mediaLibrary", JSON.stringify(updatedItems))
    } catch (error) {
      console.error("Error saving media items:", error)
    }
  }

  // Get all items from storage
  const getAllItems = (): MediaItem[] => {
    try {
      const storedItems = localStorage.getItem("mediaLibrary")
      return storedItems ? JSON.parse(storedItems) : []
    } catch (error) {
      console.error("Error getting all media items:", error)
      return []
    }
  }

  // Sort items by the specified order
  const sortItems = (items: MediaItem[], order: string): MediaItem[] => {
    return [...items].sort((a, b) => {
      if (order === "a-z") {
        return a.title.localeCompare(b.title)
      } else if (order === "z-a") {
        return b.title.localeCompare(a.title)
      } else if (order === "year") {
        return b.year - a.year
      }
      return 0
    })
  }

  // Add a new media item
  const addMediaItem = (item: MediaItem) => {
    // Generate a proper ID
    const newItem = {
      ...item,
      id: `media-${Date.now()}`,
      dateAdded: new Date().toISOString(),
    }

    const updatedItems = [...mediaItems, newItem]
    setMediaItems(sortItems(updatedItems, sortOrder))
    saveItems(updatedItems)

    return newItem
  }

  // Update an existing media item
  const updateMediaItem = (updatedItem: MediaItem) => {
    const updatedItems = mediaItems.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    setMediaItems(sortItems(updatedItems, sortOrder))
    saveItems(updatedItems)
  }

  // Delete a media item
  const deleteMediaItem = (id: string) => {
    const updatedItems = mediaItems.filter((item) => item.id !== id)
    setMediaItems(updatedItems)
    saveItems(updatedItems)
  }

  return {
    mediaItems,
    addMediaItem,
    updateMediaItem,
    deleteMediaItem,
    isLoading,
  }
}
