"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { useMediaLibrary } from "@/hooks/use-media-library"
import type { MediaItem, MediaType } from "@/types/media"

interface MediaSelectorProps {
  selectedMediaIds: string[]
  selectedSeasons?: Record<string, number[]> // mediaId -> array of season numbers
  onSelectionChange: (selectedMedia: MediaItem[], selectedSeasons?: Record<string, number[]>) => void
  allowMultiple?: boolean
  disableChannelSpecific?: boolean
  restrictToMoviesAndTVShows?: boolean
}

export function MediaSelector({
  selectedMediaIds,
  selectedSeasons = {},
  onSelectionChange,
  allowMultiple = true,
  disableChannelSpecific = false,
  restrictToMoviesAndTVShows = false,
}: MediaSelectorProps) {
  const [activeTab, setActiveTab] = useState<MediaType>("movies")
  const { mediaItems } = useMediaLibrary(activeTab, "a-z")

  const MEDIA_TYPES: { type: MediaType; label: string }[] = restrictToMoviesAndTVShows
    ? [
        { type: "movies", label: "Movies" },
        { type: "tvshows", label: "TV Shows" },
      ]
    : [
        { type: "movies", label: "Movies" },
        { type: "tvshows", label: "TV Shows" },
        { type: "musicvideos", label: "Music Videos" },
        { type: "podcasts", label: "Podcasts" },
        { type: "filler", label: "Filler" },
        { type: "livestreams", label: "Livestreams" },
      ]

  const handleMediaToggle = (media: MediaItem, checked: boolean) => {
    let newSelectedIds: string[]
    let newSelectedSeasons = { ...selectedSeasons }

    if (allowMultiple) {
      if (checked) {
        newSelectedIds = [...selectedMediaIds, media.id]
        // For TV shows, initialize with all seasons selected by default
        if (media.type === "tvshows" && media.episodes) {
          const seasons = [...new Set(media.episodes.map((ep) => ep.seasonNumber))].sort((a, b) => a - b)
          newSelectedSeasons[media.id] = seasons
        }
      } else {
        newSelectedIds = selectedMediaIds.filter((id) => id !== media.id)
        // Remove season selections when media is deselected
        delete newSelectedSeasons[media.id]
      }
    } else {
      newSelectedIds = checked ? [media.id] : []
      if (checked && media.type === "tvshows" && media.episodes) {
        const seasons = [...new Set(media.episodes.map((ep) => ep.seasonNumber))].sort((a, b) => a - b)
        newSelectedSeasons = { [media.id]: seasons }
      } else {
        newSelectedSeasons = {}
      }
    }

    // Get all selected media items
    const allMedia = MEDIA_TYPES.flatMap((type) => {
      // This would need to be optimized in a real implementation
      // For now, we'll just return the current media items
      return mediaItems
    })

    const selectedMedia = allMedia.filter((item) => newSelectedIds.includes(item.id))
    onSelectionChange(selectedMedia, newSelectedSeasons)
  }

  const handleSeasonToggle = (mediaId: string, seasonNumber: number, checked: boolean) => {
    const newSelectedSeasons = { ...selectedSeasons }

    if (!newSelectedSeasons[mediaId]) {
      newSelectedSeasons[mediaId] = []
    }

    if (checked) {
      if (!newSelectedSeasons[mediaId].includes(seasonNumber)) {
        newSelectedSeasons[mediaId] = [...newSelectedSeasons[mediaId], seasonNumber].sort((a, b) => a - b)
      }
    } else {
      newSelectedSeasons[mediaId] = newSelectedSeasons[mediaId].filter((s) => s !== seasonNumber)
    }

    // If no seasons are selected, remove the media entirely
    if (newSelectedSeasons[mediaId].length === 0) {
      delete newSelectedSeasons[mediaId]
      const newSelectedIds = selectedMediaIds.filter((id) => id !== mediaId)
      const allMedia = MEDIA_TYPES.flatMap(() => mediaItems)
      const selectedMedia = allMedia.filter((item) => newSelectedIds.includes(item.id))
      onSelectionChange(selectedMedia, newSelectedSeasons)
    } else {
      const allMedia = MEDIA_TYPES.flatMap(() => mediaItems)
      const selectedMedia = allMedia.filter((item) => selectedMediaIds.includes(item.id))
      onSelectionChange(selectedMedia, newSelectedSeasons)
    }
  }

  const formatMediaDisplay = (media: MediaItem): string => {
    if (media.type === "movies") {
      return `${media.title} • ${media.year} • ${media.runtime || 0} min • ${media.rating || "NR"}`
    } else if (media.type === "tvshows") {
      const seasons = Math.max(...(media.episodes?.map((ep) => ep.seasonNumber) || [1]))
      const episodes = media.episodes?.length || 0
      return `${media.title} • ${media.runtime || 0} min • ${media.rating || "NR"} • ${seasons} Season${
        seasons > 1 ? "s" : ""
      }, ${episodes} Episodes`
    } else if (media.type === "musicvideos") {
      return `${media.bandName || "Unknown Artist"} - ${media.songTitle || media.title} • ${media.year} • ${media.genre || "Unknown Genre"}`
    } else if (media.type === "podcasts") {
      return `${media.title} • ${media.year} • ${media.runtime || 0} min • ${media.rating || "NR"}`
    }
    return `${media.title} • ${media.year} • ${media.runtime || 0} min • ${media.rating || "NR"}`
  }

  const getAvailableSeasons = (media: MediaItem): number[] => {
    if (media.type !== "tvshows" || !media.episodes) return []
    return [...new Set(media.episodes.map((ep) => ep.seasonNumber))].sort((a, b) => a - b)
  }

  return (
    <div className="border rounded-lg">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MediaType)}>
        <TabsList className={`grid w-full ${restrictToMoviesAndTVShows ? "grid-cols-2" : "grid-cols-6"}`}>
          {MEDIA_TYPES.map((type) => (
            <TabsTrigger key={type.type} value={type.type}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {MEDIA_TYPES.map((type) => (
          <TabsContent key={type.type} value={type.type} className="mt-0">
            <ScrollArea className="h-64 p-4">
              {mediaItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No {type.label.toLowerCase()} in your media library yet.</p>
                  <p className="text-sm">Add some in the Media Library tab.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mediaItems.map((media) => {
                    const isSelected = selectedMediaIds.includes(media.id)
                    const availableSeasons = getAvailableSeasons(media)
                    const selectedSeasonsForMedia = selectedSeasons[media.id] || []

                    return (
                      <div key={media.id} className="space-y-2">
                        <div className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50">
                          <Checkbox
                            id={`media-${media.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleMediaToggle(media, checked as boolean)}
                          />
                          <div className="flex-1 min-w-0">
                            <label htmlFor={`media-${media.id}`} className="text-sm font-medium cursor-pointer block">
                              {media.type === "movies" && "Movie"} {media.type === "tvshows" && "TV Show"}{" "}
                              {media.type === "musicvideos" && "Music Video"} {media.type === "podcasts" && "Podcast"}{" "}
                              {media.type === "filler" && "Filler"} {media.type === "livestreams" && "Livestream"}
                            </label>
                            <p className="text-sm text-gray-600 mt-1">{formatMediaDisplay(media)}</p>
                          </div>
                        </div>

                        {/* Season Selection for TV Shows */}
                        {isSelected && media.type === "tvshows" && availableSeasons.length > 0 && (
                          <div className="ml-8 pl-4 border-l-2 border-gray-200">
                            <div className="grid grid-cols-4 gap-2">
                              {availableSeasons.map((seasonNumber) => (
                                <div key={seasonNumber} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`season-${media.id}-${seasonNumber}`}
                                    checked={selectedSeasonsForMedia.includes(seasonNumber)}
                                    onCheckedChange={(checked) =>
                                      handleSeasonToggle(media.id, seasonNumber, checked as boolean)
                                    }
                                  />
                                  <label
                                    htmlFor={`season-${media.id}-${seasonNumber}`}
                                    className="text-sm cursor-pointer"
                                  >
                                    Season {seasonNumber}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
