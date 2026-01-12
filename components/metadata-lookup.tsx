"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { SearchIcon, LoaderIcon } from "lucide-react"
import type { MediaItem, MediaType } from "@/types/media"

interface MetadataLookupProps {
  mediaType: MediaType
  onMetadataMatch: (metadata: Partial<MediaItem>) => void
  currentTitle: string
}

export function MetadataLookup({ mediaType, onMetadataMatch, currentTitle }: MetadataLookupProps) {
  const [uniqueId, setUniqueId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLookup = async () => {
    if (!uniqueId.trim()) {
      toast({
        title: "Missing ID",
        description: "Please enter a unique ID to lookup metadata.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Mock API call - in real implementation, this would call TheTVDB or IMDB APIs
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API delay

      let mockMetadata: Partial<MediaItem> = {}

      if (mediaType === "tvshows") {
        // Mock TheTVDB response for Mystery Science Theater 3000 (ID: 74806)
        if (uniqueId === "74806") {
          mockMetadata = {
            title: "Mystery Science Theater 3000",
            year: 1988,
            genre: "Comedy, Sci-Fi",
            tvRating: "TV-PG",
            runtime: 90,
            poster: "/placeholder.svg?height=400&width=300&text=MST3K",
          }
        } else {
          // Generic mock data for other IDs
          mockMetadata = {
            title: `TV Show ${uniqueId}`,
            year: 2020,
            genre: "Drama",
            tvRating: "TV-14",
            runtime: 45,
            poster: "/placeholder.svg?height=400&width=300&text=TV+Show",
          }
        }
      } else if (mediaType === "movies") {
        // Mock IMDB response for Goldeneye (ID: tt0113189)
        if (uniqueId === "tt0113189") {
          mockMetadata = {
            title: "GoldenEye",
            year: 1995,
            genre: "Action, Adventure, Thriller",
            rating: "PG-13",
            runtime: 130,
            poster: "/placeholder.svg?height=400&width=300&text=GoldenEye",
          }
        } else {
          // Generic mock data for other IDs
          mockMetadata = {
            title: `Movie ${uniqueId}`,
            year: 2021,
            genre: "Action",
            rating: "PG-13",
            runtime: 120,
            poster: "/placeholder.svg?height=400&width=300&text=Movie",
          }
        }
      }

      onMetadataMatch(mockMetadata)

      toast({
        title: "Metadata Found",
        description: `Successfully matched metadata for "${mockMetadata.title}".`,
      })
    } catch (error) {
      console.error("Metadata lookup error:", error)
      toast({
        title: "Lookup Failed",
        description: "Could not find metadata for the provided ID. Please check the ID and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getPlaceholderText = () => {
    if (mediaType === "tvshows") {
      return "e.g., 74806 for Mystery Science Theater 3000"
    } else if (mediaType === "movies") {
      return "e.g., tt0113189 for GoldenEye"
    }
    return "Enter unique ID"
  }

  const getDatabaseName = () => {
    if (mediaType === "tvshows") {
      return "TheTVDB.com"
    } else if (mediaType === "movies") {
      return "IMDB"
    }
    return "Database"
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Metadata Lookup</CardTitle>
        <CardDescription>
          Search {getDatabaseName()} by unique ID to automatically fill in metadata for "{currentTitle}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="unique-id">{mediaType === "tvshows" ? "TheTVDB ID" : "IMDB ID"} (Unique ID)</Label>
            <Input
              id="unique-id"
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              placeholder={getPlaceholderText()}
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleLookup} disabled={isLoading || !uniqueId.trim()} className="flex items-center gap-2">
            {isLoading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SearchIcon className="h-4 w-4" />}
            Match
          </Button>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          <p>
            <strong>Examples:</strong>
          </p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {mediaType === "tvshows" && (
              <li>
                Mystery Science Theater 3000: <code>74806</code>
              </li>
            )}
            {mediaType === "movies" && (
              <li>
                GoldenEye (1995): <code>tt0113189</code>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
