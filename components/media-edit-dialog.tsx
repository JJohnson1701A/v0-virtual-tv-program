"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { TriStateCheckbox, type TriState } from "@/components/ui/tri-state-checkbox"
import { FileUpload } from "@/components/file-upload"
import { MetadataLookup } from "@/components/metadata-lookup"
import { useChannels } from "@/hooks/use-channels"
import { useMediaLibrary } from "@/hooks/use-media-library"
import { useBlocksMarathons } from "@/hooks/use-blocks-marathons"
import type { MediaItem, TVShowEpisode, FillerType, CommercialCategory, TimeOfYear } from "@/types/media"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { ContentWarningSelector } from "@/components/content-warning-selector"
import type { ContentWarningData } from "@/lib/content-warnings"

interface MediaEditDialogProps {
  item: MediaItem
  onSave: (item: MediaItem) => void
  onCancel: () => void
}

const fillerTypeOptions: { value: FillerType; label: string }[] = [
  { value: "commercial", label: "Commercial" },
  { value: "bumper in", label: "Bumper In" },
  { value: "bumper out", label: "Bumper Out" },
  { value: "ratings notice", label: "Ratings Notice" },
  { value: "station ID", label: "Station ID" },
  { value: "block-marathon ID", label: "Block-Marathon ID" },
  { value: "promo", label: "Promo" },
  { value: "trailer", label: "Trailer" },
  { value: "PSA", label: "PSA" },
  { value: "Emergency Alert", label: "Emergency Alert" },
  { value: "ident-channel", label: "Ident-Channel" },
  { value: "ident-movie", label: "Ident-Movie" },
  { value: "ident-TV show", label: "Ident-TV Show" },
  { value: "Interstitial", label: "Interstitial" },
]

const commercialCategoryOptions: { value: CommercialCategory; label: string }[] = [
  { value: "alcohol", label: "Alcohol" },
  { value: "appliance", label: "Appliance" },
  { value: "banking", label: "Banking" },
  { value: "beauty-grooming product", label: "Beauty-Grooming Product" },
  { value: "board game", label: "Board Game" },
  { value: "boy toy", label: "Boy Toy" },
  { value: "car", label: "Car" },
  { value: "cleaning product", label: "Cleaning Product" },
  { value: "clothing", label: "Clothing" },
  { value: "department store", label: "Department Store" },
  { value: "education service", label: "Education Service" },
  { value: "educational toy", label: "Educational Toy" },
  { value: "fast food", label: "Fast Food" },
  { value: "fitness", label: "Fitness" },
  { value: "food", label: "Food" },
  { value: "general", label: "General" },
  { value: "girl toy", label: "Girl Toy" },
  { value: "household products", label: "Household Products" },
  { value: "insurance", label: "Insurance" },
  { value: "investment", label: "Investment" },
  { value: "parody", label: "Parody" },
  { value: "pharma", label: "Pharma" },
  { value: "snack", label: "Snack" },
  { value: "streaming service", label: "Streaming Service" },
  { value: "supplement", label: "Supplement" },
  { value: "tech product", label: "Tech Product" },
  { value: "telecom", label: "Telecom" },
  { value: "tobacco", label: "Tobacco" },
  { value: "toy", label: "Toy" },
  { value: "travel", label: "Travel" },
  { value: "video game", label: "Video Game" },
  { value: "other", label: "Other" },
]

const timeOfYearOptions: { value: TimeOfYear; label: string }[] = [
  { value: "Any", label: "Any" },
  { value: "Spring (3-1 to 5-31)", label: "Spring (3-1 to 5-31)" },
  { value: "Summer (6-1 to 8-31)", label: "Summer (6-1 to 8-31)" },
  { value: "Autumn (9-1 to 11-30)", label: "Autumn (9-1 to 11-30)" },
  { value: "Winter (12-1 to 2-28)", label: "Winter (12-1 to 2-28)" },
  { value: "New Year (12-26 to 1-1)", label: "New Year (12-26 to 1-1)" },
  { value: "Valentines (2-1 to 2-14)", label: "Valentines (2-1 to 2-14)" },
  { value: "Easter (3-15 to 4-15)", label: "Easter (3-15 to 4-15)" },
  { value: "Independence Day (7-1 to 7-4)", label: "Independence Day (7-1 to 7-4)" },
  { value: "Back to School (8-1 to 9-15)", label: "Back to School (8-1 to 9-15)" },
  { value: "Halloween (10-1 to 10-31)", label: "Halloween (10-1 to 10-31)" },
  { value: "Thanksgiving (11-1 to 11-30)", label: "Thanksgiving (11-1 to 11-30)" },
  { value: "Christmas (12-1 to 12-25)", label: "Christmas (12-1 to 12-25)" },
]

const showCategoryOptions = [
  { type: "header", label: "-Kids-" },
  { type: "option", value: "kids cartoon", label: "Kids Cartoon" },
  { type: "option", value: "kids live", label: "Kids Live" },
  { type: "option", value: "kids educational", label: "Kids Educational" },
  { type: "header", label: "-General/Scripted-" },
  { type: "option", value: "sitcom", label: "Sitcom" },
  { type: "option", value: "drama", label: "Drama" },
  { type: "option", value: "soap opera", label: "Soap Opera" },
  { type: "option", value: "sketch comedy", label: "Sketch Comedy" },
  { type: "option", value: "variety", label: "Variety" },
  { type: "header", label: "-Genre-Specific-" },
  { type: "option", value: "animation (general/adult)", label: "Animation (General/Adult)" },
  { type: "option", value: "anime", label: "Anime" },
  { type: "option", value: "horror", label: "Horror" },
  { type: "option", value: "romance", label: "Romance" },
  { type: "option", value: "sci-fi/fantasy", label: "Sci-Fi/Fantasy" },
  { type: "header", label: "-Meta/Scheduling-" },
  { type: "option", value: "classic/retro", label: "Classic/Retro" },
  { type: "option", value: "rerun", label: "Rerun" },
  { type: "header", label: "-Music/Performance-" },
  { type: "option", value: "concert", label: "Concert" },
  { type: "option", value: "sports", label: "Sports" },
  { type: "header", label: "-Talk/Late-Night-" },
  { type: "option", value: "talk", label: "Talk" },
  { type: "option", value: "late-night", label: "Late-Night" },
  { type: "header", label: "-Unscripted/Non-Fiction-" },
  { type: "option", value: "game show", label: "Game Show" },
  { type: "option", value: "reality/unscripted", label: "Reality/Unscripted" },
]

// Genre options for Promos
const promoGenreOptions = [
  "Action",
  "Adult",
  "Adventure",
  "Animated",
  "Animé",
  "Anthology",
  "Art",
  "Children",
  "Comedy",
  "Cooking",
  "Courtroom",
  "Daytime TV",
  "Detective/Police Procedural",
  "Documentary/Docudrama",
  "Drama",
  "Dramality",
  "Educational/Instructional",
  "Family",
  "Game Show",
  "Infomercial",
  "Late-Night Talk",
  "Music",
  "News",
  "Other",
  "Parody",
  "Reality",
  "Religious",
  "Science Fiction",
  "Serial Drama",
  "Sitcom",
  "Sports",
  "Talk",
  "Variety",
  "Western",
]

// Genre options for Trailers
const trailerGenreOptions = [
  "Action",
  "Adult",
  "Adventure",
  "Animation",
  "Animé",
  "Children",
  "Comedy",
  "Crime/Detective/Heist",
  "Drama",
  "Family",
  "Fantasy",
  "Historical",
  "Horror",
  "Musical",
  "Other",
  "Parody",
  "Romance",
  "Romantic Comedy",
  "Science Fiction",
  "Sports",
  "Thriller",
  "Western",
]

const tvGenreOptions = [
  "Action",
  "Adventure",
  "Animation",
  "Anime",
  "Children/Kids",
  "Comedy",
  "Crime",
  "Documentary",
  "Docuseries",
  "Drama",
  "Educational",
  "Faith/Religious",
  "Fantasy",
  "Game Show",
  "Historical/Period",
  "Horror",
  "Lifestyle (Food, Travel, Home)",
  "Medical",
  "Mystery",
  "News",
  "Political",
  "Reality",
  "Romance",
  "Science Fiction",
  "Sitcom",
  "Sports",
  "Talk Show",
  "Thriller",
  "True Crime",
  "Variety",
  "Western",
]

const movieGenreOptions = [
  "Action",
  "Adventure",
  "Animation",
  "Anime",
  "Biographical/Biopic",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Epic",
  "Faith/Religious",
  "Fantasy",
  "Historical/Period",
  "Horror",
  "Independent/Art House",
  "Martial Arts",
  "Musical",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Sports",
  "Superhero",
  "Thriller",
  "War",
  "Western",
]

const seasonsOptions = [
  { header: "Any Time", value: "Any Time" },
  { header: "School/Broadcast Year", value: "School Year (09-01 to 05-31)" },
  { header: "Fall", value: "Autumn (09-01 to 11-30)" },
  { header: "Fall", value: "Back to School (08-15 to 09-15)" },
  { header: "Fall", value: "Labor Day (08-25 to 09-10)" },
  { header: "Fall", value: "Halloween (10-01 to 10-31)" },
  { header: "Fall", value: "Thanksgiving (11-01 to 11-30)" },
  { header: "Winter & Holidays", value: "Winter (12-01 to 02-28/29)" },
  { header: "Winter & Holidays", value: "Christmas (12-01 to 12-25)" },
  { header: "Winter & Holidays", value: "Winter Break (12-20 to 12-25)" },
  { header: "Winter & Holidays", value: "New Year (12-26 to 01-15)" },
  { header: "Mid-Winter Events", value: "Super Bowl (01-20 to 02-15)" },
  { header: "Mid-Winter Events", value: "Valentine's Day (02-01 to 02-28)" },
  { header: "Spring", value: "Spring (03-01 to 03-31)" },
  { header: "Spring", value: "St. Patrick's Day (03-01 to 03-31)" },
  { header: "Spring", value: "Spring Break (03-01 to 04-15)" },
  { header: "Spring", value: "March Madness (03-10 to 04-10)" },
  { header: "Spring", value: "Easter (2 Weeks before Easter Sunday)" },
  { header: "Summer", value: "Summer Break (06-01 to 08-31)" },
  { header: "Summer", value: "Independence Day (06-25 to 07-10)" },
]

const movieRatingOptions = ["G", "PG", "PG-13", "R", "NC-17", "X"]
const tvRatingOptions = ["TV-Y", "TV-Y7", "TV-G", "TV-PG", "TV-14", "TV-MA"]

const ratingCorrespondence: Record<string, string> = {
  G: "TV-G",
  PG: "TV-PG",
  "PG-13": "TV-14",
  R: "TV-MA",
  "NC-17": "TV-MA",
  X: "TV-MA",
  "TV-Y": "G",
  "TV-Y7": "G",
  "TV-G": "G",
  "TV-PG": "PG",
  "TV-14": "PG-13",
  "TV-MA": "R",
}

// Music Video specific options (alphabetized)
const musicVideoLanguageOptions = ["Dutch", "English", "French", "German", "Japanese", "Spanish"]

const musicVideoCountryOptions = [
  "Canada",
  "France",
  "Germany",
  "Italy",
  "Japan",
  "Mexico",
  "Netherlands",
  "United Kingdom",
  "United States",
]

const musicVideoGenreOptions = [
  "Alternative Rock",
  "Celtic / Medieval Folk",
  "Classic Rock",
  "Club,Dance",
  "Electronic",
  "Folk",
  "Folk Rock / Folk Pop",
  "Industrial / Industrial Rock",
  "Motown",
  "New Wave / 80s Pop",
  "Oldies",
  "Pop",
  "Psychedelic Rock / Pop",
  "Rock",
  "Rock & Roll",
  "Singer-Songwriter",
  "Soul / R&B",
]

export function MediaEditDialog({ item, onSave, onCancel }: MediaEditDialogProps) {
  const { channels } = useChannels()
  const { mediaItems: tvShows } = useMediaLibrary("tvshows", "a-z")
  const { mediaItems: movies } = useMediaLibrary("movies", "a-z")
  const { blocks, marathons } = useBlocksMarathons()

  const [editedItem, setEditedItem] = useState<MediaItem>({
    ...item,
    // Initialize arrays for multi-select fields if they don't exist
    category: item.category || [],
    assignedChannelId: item.assignedChannelId || [],
    seasons: item.seasons || [],
    contentWarningData: item.contentWarningData || { enabled: false, categories: [], subcategories: [] },
  })
  const [activeTab, setActiveTab] = useState("details")
  const [newEpisode, setNewEpisode] = useState<TVShowEpisode>({
    id: "",
    title: "",
    seasonNumber: 1,
    episodeNumber: 1,
    airDate: "",
    file: "",
    breaks: "",
  })

  const handleChange = (field: keyof MediaItem, value: any) => {
    setEditedItem((prev) => ({ ...prev, [field]: value }))
  }

  const handleMetadataMatch = (metadata: Partial<MediaItem>) => {
    setEditedItem((prev) => ({ ...prev, ...metadata }))
  }

  const handleAddEpisode = () => {
    if (editedItem.type === "tvshows") {
      const episodes = [...(editedItem.episodes || [])]
      const newId = `ep-${Date.now()}`
      episodes.push({ ...newEpisode, id: newId })

      setEditedItem((prev) => ({
        ...prev,
        episodes,
      }))

      setNewEpisode({
        id: "",
        title: "",
        seasonNumber: 1,
        episodeNumber: episodes.length + 1,
        airDate: "",
        file: "",
        breaks: "",
      })
    }
  }

  const handleRemoveEpisode = (episodeId: string) => {
    if (editedItem.type === "tvshows" && editedItem.episodes) {
      const episodes = editedItem.episodes.filter((ep) => ep.id !== episodeId)
      setEditedItem((prev) => ({ ...prev, episodes }))
    }
  }

  const handleEpisodeChange = (episodeId: string, field: keyof TVShowEpisode, value: any) => {
    if (editedItem.type === "tvshows" && editedItem.episodes) {
      const episodes = editedItem.episodes.map((ep) => (ep.id === episodeId ? { ...ep, [field]: value } : ep))
      setEditedItem((prev) => ({ ...prev, episodes }))
    }
  }

  const handleNewEpisodeChange = (field: keyof TVShowEpisode, value: any) => {
    setNewEpisode((prev) => ({ ...prev, [field]: value }))
  }

  // Multi-select handlers
  const handleShowCategoryToggle = (categoryValue: string, checked: boolean) => {
    const currentCategories = Array.isArray(editedItem.category) ? editedItem.category : []
    if (checked) {
      handleChange("category", [...currentCategories, categoryValue])
    } else {
      handleChange(
        "category",
        currentCategories.filter((cat) => cat !== categoryValue),
      )
    }
  }

  const handleChannelToggle = (channelId: string, checked: boolean) => {
    const currentChannels = Array.isArray(editedItem.assignedChannelId) ? editedItem.assignedChannelId : []
    if (checked) {
      handleChange("assignedChannelId", [...currentChannels, channelId])
    } else {
      handleChange(
        "assignedChannelId",
        currentChannels.filter((id) => id !== channelId),
      )
    }
  }

// Get tri-state value for Time of Year
  const getSeasonTriState = (seasonValue: string): TriState => {
    const currentSeasons = Array.isArray(editedItem.seasons) ? editedItem.seasons : []
    const excludedSeasons = Array.isArray(editedItem.seasonsExclude) ? editedItem.seasonsExclude : []
    if (currentSeasons.includes(seasonValue as any)) return "checked"
    if (excludedSeasons.includes(seasonValue as any)) return "excluded"
    return "unchecked"
  }

  const handleSeasonToggle = (seasonValue: string, newState: TriState) => {
    const currentSeasons = Array.isArray(editedItem.seasons) ? editedItem.seasons : []
    const excludedSeasons = Array.isArray(editedItem.seasonsExclude) ? editedItem.seasonsExclude : []

    // Remove from both arrays first
    const newSeasons = currentSeasons.filter((season) => season !== seasonValue)
    const newExcluded = excludedSeasons.filter((season) => season !== seasonValue)

    if (newState === "checked") {
      newSeasons.push(seasonValue as any)
    } else if (newState === "excluded") {
      newExcluded.push(seasonValue as any)
    }

    handleChange("seasons", newSeasons)
    handleChange("seasonsExclude", newExcluded)
  }

  const handleRatingChange = (value: string, isMovieRating: boolean) => {
    if (isMovieRating) {
      handleChange("rating", value)
      // Auto-select corresponding TV rating
      const correspondingTVRating = ratingCorrespondence[value]
      if (correspondingTVRating) {
        handleChange("tvRating", correspondingTVRating)
      }
    } else {
      handleChange("tvRating", value)
      // Auto-select corresponding movie rating
      const correspondingMovieRating = ratingCorrespondence[value]
      if (correspondingMovieRating) {
        handleChange("rating", correspondingMovieRating)
      }
    }
  }

  const isTVShow = editedItem.type === "tvshows"
  const isMovie = editedItem.type === "movies"
  const isMusicVideo = editedItem.type === "musicvideos"
  const isFiller = editedItem.type === "filler"
  const isCommercial = editedItem.fillerType === "commercial"
  const isBumper = editedItem.fillerType === "bumper in" || editedItem.fillerType === "bumper out"
  const isPromo = editedItem.fillerType === "promo"
  const isTrailer = editedItem.fillerType === "trailer"
  const isStationID = editedItem.fillerType === "station ID"
  const isBlockMarathonID = editedItem.fillerType === "block-marathon ID"
  const isInterstitial = editedItem.fillerType === "Interstitial"
  const isIdent = editedItem.fillerType?.startsWith("ident-")

  // Check if metadata lookup should be shown
  const showMetadataLookup =
    (!isFiller && !isMusicVideo) || isPromo || isTrailer || isInterstitial || isBlockMarathonID || isIdent

  // Check if genre field should be shown for filler
  const showFillerGenre = isFiller && (isPromo || isTrailer)

  // Get contextual label for the second field
  const getContextualLabel = () => {
    if (isPromo) return "Show"
    if (isTrailer) return "Movie"
    if (isStationID) return "Channel"
    if (isBlockMarathonID) return "Block-Marathon"
    if (isIdent) return "Related Media"
    return "Category"
  }

  // Get contextual options for the second field
  const getContextualOptions = () => {
    if (isPromo) {
      return tvShows.map((show) => ({ value: show.id, label: show.title }))
    }
    if (isTrailer) {
      return movies.map((movie) => ({ value: movie.id, label: movie.title }))
    }
    if (isStationID) {
      return channels.map((channel) => ({ value: channel.id, label: `${channel.number} - ${channel.name}` }))
    }
    if (isBlockMarathonID) {
      const blockOptions = blocks.map((block) => ({ value: block.id, label: `${block.name} (Block)` }))
      const marathonOptions = marathons.map((marathon) => ({
        value: marathon.id,
        label: `${marathon.name} (Marathon)`,
      }))
      return [...blockOptions, ...marathonOptions]
    }
    if (isIdent) {
      if (editedItem.fillerType === "ident-movie") {
        return movies.map((movie) => ({ value: movie.id, label: movie.title }))
      }
      if (editedItem.fillerType === "ident-TV show") {
        return tvShows.map((show) => ({ value: show.id, label: show.title }))
      }
      if (editedItem.fillerType === "ident-channel") {
        return channels.map((channel) => ({ value: channel.id, label: `${channel.number} - ${channel.name}` }))
      }
    }
    return commercialCategoryOptions.map((option) => ({ value: option.value, label: option.label }))
  }

  // Get genre options based on filler type
  const getFillerGenreOptions = () => {
    if (isPromo) return promoGenreOptions
    if (isTrailer) return trailerGenreOptions
    return []
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editedItem.id.startsWith("temp-") ? "Add New" : "Edit"}{" "}
            {editedItem.type === "movies"
              ? "Movie"
              : editedItem.type === "tvshows"
                ? "TV Show"
                : editedItem.type === "musicvideos"
                  ? "Music Video"
                  : editedItem.type === "filler"
                    ? "Filler"
                    : editedItem.type === "podcasts"
                      ? "Podcast"
                      : "Livestream"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            {isTVShow && <TabsTrigger value="episodes">Episodes</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="space-y-4 py-4">
            {/* Metadata Lookup - conditionally shown */}
            {showMetadataLookup && (
              <MetadataLookup
                mediaType={editedItem.type}
                onMetadataMatch={handleMetadataMatch}
                currentTitle={editedItem.title}
              />
            )}

            <div className="grid grid-cols-[200px_1fr] gap-6">
              <div>
                <div className="border aspect-[3/4] bg-gray-50 flex items-center justify-center mb-2 relative">
                  {editedItem.poster ? (
                    <img
                      src={editedItem.poster || "/placeholder.svg"}
                      alt="Poster"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">No Poster</span>
                  )}
                </div>
                <FileUpload
                  value={editedItem.poster}
                  onChange={(value) => handleChange("poster", value)}
                  accept="image/*"
                  placeholder="Upload poster"
                />
              </div>

              <div className="space-y-4">
                {/* Music Video specific fields */}
                {isMusicVideo ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="bandName">Band Name</Label>
                      <Input
                        id="bandName"
                        value={editedItem.bandName || ""}
                        onChange={(e) => handleChange("bandName", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="songTitle">Song Title</Label>
                      <Input
                        id="songTitle"
                        value={editedItem.songTitle || ""}
                        onChange={(e) => handleChange("songTitle", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="albumName">Album Name</Label>
                      <Input
                        id="albumName"
                        value={editedItem.albumName || ""}
                        onChange={(e) => handleChange("albumName", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="recordLabel">Record Label</Label>
                      <Input
                        id="recordLabel"
                        value={editedItem.recordLabel || ""}
                        onChange={(e) => handleChange("recordLabel", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="directors">Director(s)</Label>
                      <Input
                        id="directors"
                        value={editedItem.directors || ""}
                        onChange={(e) => handleChange("directors", e.target.value)}
                        placeholder="Separate multiple directors with commas"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={editedItem.year}
                        onChange={(e) => handleChange("year", Number.parseInt(e.target.value))}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="language">Language</Label>
                        <Select
                          value={editedItem.language || ""}
                          onValueChange={(value) => handleChange("language", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            {musicVideoLanguageOptions.map((language) => (
                              <SelectItem key={language} value={language}>
                                {language}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Select
                          value={editedItem.country || ""}
                          onValueChange={(value) => handleChange("country", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {musicVideoCountryOptions.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="genre">Genre</Label>
                        <Select value={editedItem.genre || ""} onValueChange={(value) => handleChange("genre", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select genre" />
                          </SelectTrigger>
                          <SelectContent>
                            {musicVideoGenreOptions.map((genre) => (
                              <SelectItem key={genre} value={genre}>
                                {genre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Standard fields for non-music video items */}
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={editedItem.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="year">Release Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={editedItem.year}
                        onChange={(e) => handleChange("year", Number.parseInt(e.target.value))}
                      />
                    </div>

                    {/* Runtime field - only show for non-filler items */}
                    {!isFiller && (
                      <div className="grid gap-2">
                        <Label htmlFor="runtime">Runtime (minutes)</Label>
                        <Input
                          id="runtime"
                          type="number"
                          value={editedItem.runtime || ""}
                          onChange={(e) => handleChange("runtime", Number.parseInt(e.target.value) || 0)}
                        />
                      </div>
                    )}

                    {/* Genre field - only show for non-filler items OR for promo/trailer filler */}
                    {(!isFiller || showFillerGenre) && (
                      <div className="grid gap-2">
                        <Label htmlFor="genre">Genre</Label>
                        {showFillerGenre ? (
                          <Select
                            value={editedItem.genre || ""}
                            onValueChange={(value) => handleChange("genre", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                            <SelectContent>
                              {getFillerGenreOptions().map((genre) => (
                                <SelectItem key={genre} value={genre}>
                                  {genre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : isMovie ? (
                          <Select
                            value={editedItem.genre || ""}
                            onValueChange={(value) => handleChange("genre", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select movie genre" />
                            </SelectTrigger>
                            <SelectContent>
                              {movieGenreOptions.map((genre) => (
                                <SelectItem key={genre} value={genre}>
                                  {genre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : isTVShow ? (
                          <Select
                            value={editedItem.genre || ""}
                            onValueChange={(value) => handleChange("genre", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select TV genre" />
                            </SelectTrigger>
                            <SelectContent>
                              {tvGenreOptions.map((genre) => (
                                <SelectItem key={genre} value={genre}>
                                  {genre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="genre"
                            value={editedItem.genre || ""}
                            onChange={(e) => handleChange("genre", e.target.value)}
                          />
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Rating field - disabled for promos */}
                      <div className="grid gap-2">
                        <Label htmlFor="rating">Rating</Label>
                        <Select
                          value={editedItem.rating || ""}
                          onValueChange={(value) => handleRatingChange(value, true)}
                          disabled={isPromo}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            {movieRatingOptions.map((rating) => (
                              <SelectItem key={rating} value={rating}>
                                {rating}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isPromo && <p className="text-xs text-gray-500">Use TV Rating field for promos</p>}
                      </div>

                      {/* TV Rating field */}
                      <div className="grid gap-2">
                        <Label htmlFor="tvRating">TV Rating</Label>
                        <Select
                          value={editedItem.tvRating || ""}
                          onValueChange={(value) => handleRatingChange(value, false)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select TV rating" />
                          </SelectTrigger>
                          <SelectContent>
                            {tvRatingOptions.map((rating) => (
                              <SelectItem key={rating} value={rating}>
                                {rating}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                {/* Filler-specific fields */}
                {isFiller && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="fillerType">Filler Type</Label>
                        <Select
                          value={editedItem.fillerType || "commercial"}
                          onValueChange={(value) => handleChange("fillerType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select filler type" />
                          </SelectTrigger>
                          <SelectContent>
                            {fillerTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="contextualField">{getContextualLabel()}</Label>
                        <Select
                          value={editedItem.commercialCategory || ""}
                          onValueChange={(value) => handleChange("commercialCategory", value)}
                          disabled={
                            !isCommercial && !isPromo && !isTrailer && !isStationID && !isBlockMarathonID && !isIdent
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select ${getContextualLabel().toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {getContextualOptions().map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Contextual fields for Bumper In/Out */}
                    {isBumper && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="bumperBlock">Block</Label>
                          <Select
                            value={editedItem.commercialCategory || ""}
                            onValueChange={(value) => handleChange("commercialCategory", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select block or marathon" />
                            </SelectTrigger>
                            <SelectContent>
                              {blocks.map((block) => (
                                <SelectItem key={block.id} value={block.id}>
                                  {block.name} (Block)
                                </SelectItem>
                              ))}
                              {marathons.map((marathon) => (
                                <SelectItem key={marathon.id} value={marathon.id}>
                                  {marathon.name} (Marathon)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="bumperShow">Show</Label>
                          <Select
                            value={editedItem.product || ""}
                            onValueChange={(value) => handleChange("product", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select TV show" />
                            </SelectTrigger>
                            <SelectContent>
                              {tvShows.map((show) => (
                                <SelectItem key={show.id} value={show.id}>
                                  {show.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Product field - only for commercials */}
                    {isCommercial && (
                      <div className="grid gap-2">
                        <Label htmlFor="product">Product</Label>
                        <Input
                          id="product"
                          value={editedItem.product || ""}
                          onChange={(e) => handleChange("product", e.target.value)}
                          placeholder="Enter product name"
                        />
                      </div>
                    )}
                  </>
                )}

              {/* Content Warning - show for all except music videos */}
              {!isMusicVideo && (
                <ContentWarningSelector
                  value={editedItem.contentWarningData || { enabled: false, categories: [], subcategories: [] }}
                  onChange={(data) => handleChange("contentWarningData", data)}
                />
              )}

                <div className="grid gap-2">
                  <Label htmlFor="seasons">Time of Year (Multi-select)</Label>
                  <p className="text-xs text-gray-500">Click to cycle: blank (neutral) → check (include) → X (exclude from auto-scheduling)</p>
                  <div className="border rounded-md p-3 max-h-64 overflow-y-auto">
                    <div className="space-y-4">
                      {Object.entries(
                        seasonsOptions.reduce(
                          (acc, option) => {
                            if (!acc[option.header]) acc[option.header] = []
                            acc[option.header].push(option)
                            return acc
                          },
                          {} as Record<string, typeof seasonsOptions>,
                        ),
                      ).map(([header, options]) => (
                        <div key={header}>
                          <h4 className="font-medium text-sm mb-2 text-gray-700">{header}</h4>
                          <div className="space-y-2 pl-2">
                            {options.map((option) => {
                              return (
                                <div key={option.value} className="flex items-center space-x-2">
                                  <TriStateCheckbox
                                    id={`season-${option.value}`}
                                    value={getSeasonTriState(option.value)}
                                    onValueChange={(newState) => handleSeasonToggle(option.value, newState)}
                                  />
                                  <label htmlFor={`season-${option.value}`} className="text-sm cursor-pointer">
                                    {option.value}
                                  </label>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audience and Show Category - show for all except music videos */}
                {!isMusicVideo && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="audience">Audience</Label>
                      <Select
                        value={editedItem.audience || "family"}
                        onValueChange={(value) => handleChange("audience", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          {["family", "adult", "senior", "baby", "toddler", "boy", "girl", "teen", "young adult"].map(
                            (audience) => (
                              <SelectItem key={audience} value={audience}>
                                {audience.charAt(0).toUpperCase() + audience.slice(1)}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Multi-select Show Category */}
                    <div className="grid gap-2">
                      <Label htmlFor="category">Show Category (Multi-select)</Label>
                      <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                        <div className="flex flex-col gap-2">
                          {showCategoryOptions.map((item, index) => {
                            if (item.type === "header") {
                              return (
                                <div
                                  key={`header-${index}`}
                                  className="font-semibold text-xs text-muted-foreground mt-2 first:mt-0"
                                >
                                  {item.label}
                                </div>
                              )
                            }

                            const currentCategories = Array.isArray(editedItem.category) ? editedItem.category : []
                            const isChecked = currentCategories.includes(item.value)
                            return (
                              <div key={item.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`category-${item.value}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    handleShowCategoryToggle(item.value, checked as boolean)
                                  }
                                />
                                <label htmlFor={`category-${item.value}`} className="text-sm cursor-pointer">
                                  {item.label}
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Multi-select Channel - for filler only */}
                {isFiller && (
                  <div className="grid gap-2">
                    <Label htmlFor="assignedChannel">Channel (Multi-select)</Label>
                    <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="channel-none"
                            checked={
                              !Array.isArray(editedItem.assignedChannelId) || editedItem.assignedChannelId.length === 0
                            }
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleChange("assignedChannelId", [])
                              }
                            }}
                          />
                          <label htmlFor="channel-none" className="text-sm cursor-pointer">
                            No specific channels
                          </label>
                        </div>
                        {channels.map((channel) => {
                          const currentChannels = Array.isArray(editedItem.assignedChannelId)
                            ? editedItem.assignedChannelId
                            : []
                          const isChecked = currentChannels.includes(channel.id)
                          return (
                            <div key={channel.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`channel-${channel.id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => handleChannelToggle(channel.id, checked as boolean)}
                              />
                              <label htmlFor={`channel-${channel.id}`} className="text-sm cursor-pointer">
                                {channel.number} - {channel.name}
                              </label>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {!isTVShow && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="file">Media File</Label>
                      <Input
                        id="file"
                        value={editedItem.files?.[0] || ""}
                        onChange={(e) => handleChange("files", [e.target.value])}
                        placeholder="Path to media file"
                      />
                    </div>

              {/* Only show Commercial Breaks for non-filler and non-music video items */}
              {!isFiller && !isMusicVideo && (
              <div className="grid gap-2">
              <Label htmlFor="breaks">Commercial Breaks</Label>
              <Input
              id="breaks"
              value={editedItem.breaks || ""}
              onChange={(e) => handleChange("breaks", e.target.value)}
              placeholder="00:03:21.00, 00:15:45.00, etc."
              />
              <p className="text-xs text-gray-500">Separate timecodes with commas</p>
              </div>
              )}

              {/* Movie Series fields - only show for movies */}
              {isMovie && (
              <>
              <div className="flex items-center space-x-2">
              <Checkbox
                id="isMovieSeries"
                checked={editedItem.isMovieSeries || false}
                onCheckedChange={(checked) => handleChange("isMovieSeries", checked)}
              />
              <Label htmlFor="isMovieSeries" className="cursor-pointer">Movie Series</Label>
              </div>

              {editedItem.isMovieSeries && (
              <>
              <div className="grid gap-2">
              <Label htmlFor="seriesName">Series Name</Label>
              <Input
                id="seriesName"
                value={editedItem.seriesName || ""}
                onChange={(e) => handleChange("seriesName", e.target.value)}
                placeholder="e.g., Star Wars, Harry Potter"
              />
              </div>

              <div className="grid gap-2">
              <Label htmlFor="seriesOrder">Series Order</Label>
              <Input
                id="seriesOrder"
                type="number"
                min={1}
                value={editedItem.seriesOrder || 1}
                onChange={(e) => handleChange("seriesOrder", Number.parseInt(e.target.value) || 1)}
                placeholder="1"
              />
              <p className="text-xs text-gray-500">Order of this movie within the series</p>
              </div>
              </>
              )}
              </>
              )}
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {isTVShow && (
            <TabsContent value="episodes" className="space-y-6 py-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Episodes</h3>

                {editedItem.episodes && editedItem.episodes.length > 0 ? (
                  <div className="space-y-6">
                    {editedItem.episodes.map((episode) => (
                      <div key={episode.id} className="border p-4 rounded-md space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">
                            S{episode.seasonNumber}:E{episode.episodeNumber} - {episode.title}
                          </h4>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveEpisode(episode.id)}>
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor={`episode-${episode.id}-title`}>Title</Label>
                            <Input
                              id={`episode-${episode.id}-title`}
                              value={episode.title}
                              onChange={(e) => handleEpisodeChange(episode.id, "title", e.target.value)}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`episode-${episode.id}-season`}>Season</Label>
                            <Input
                              id={`episode-${episode.id}-season`}
                              type="number"
                              value={episode.seasonNumber}
                              onChange={(e) =>
                                handleEpisodeChange(episode.id, "seasonNumber", Number.parseInt(e.target.value))
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`episode-${episode.id}-episode`}>Episode</Label>
                            <Input
                              id={`episode-${episode.id}-episode`}
                              type="number"
                              value={episode.episodeNumber}
                              onChange={(e) =>
                                handleEpisodeChange(episode.id, "episodeNumber", Number.parseInt(e.target.value))
                              }
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`episode-${episode.id}-airdate`}>Air Date</Label>
                          <Input
                            id={`episode-${episode.id}-airdate`}
                            type="date"
                            value={episode.airDate}
                            onChange={(e) => handleEpisodeChange(episode.id, "airDate", e.target.value)}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`episode-${episode.id}-file`}>Media File</Label>
                          <Input
                            id={`episode-${episode.id}-file`}
                            value={episode.file}
                            onChange={(e) => handleEpisodeChange(episode.id, "file", e.target.value)}
                            placeholder="Path to media file"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`episode-${episode.id}-breaks`}>Commercial Breaks</Label>
                          <Input
                            id={`episode-${episode.id}-breaks`}
                            value={episode.breaks}
                            onChange={(e) => handleEpisodeChange(episode.id, "breaks", e.target.value)}
                            placeholder="00:03:21.00, 00:15:45.00, etc."
                          />
                          <p className="text-xs text-gray-500">Separate timecodes with commas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No episodes added yet. Add your first episode below.
                  </div>
                )}

                <div className="border p-4 rounded-md space-y-4 bg-gray-50">
                  <h4 className="font-medium">Add New Episode</h4>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="new-episode-title">Title</Label>
                      <Input
                        id="new-episode-title"
                        value={newEpisode.title}
                        onChange={(e) => handleNewEpisodeChange("title", e.target.value)}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="new-episode-season">Season</Label>
                      <Input
                        id="new-episode-season"
                        type="number"
                        value={newEpisode.seasonNumber}
                        onChange={(e) => handleNewEpisodeChange("seasonNumber", Number.parseInt(e.target.value))}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="new-episode-episode">Episode</Label>
                      <Input
                        id="new-episode-episode"
                        type="number"
                        value={newEpisode.episodeNumber}
                        onChange={(e) => handleNewEpisodeChange("episodeNumber", Number.parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="new-episode-airdate">Air Date</Label>
                    <Input
                      id="new-episode-airdate"
                      type="date"
                      value={newEpisode.airDate}
                      onChange={(e) => handleNewEpisodeChange("airDate", e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="new-episode-file">Media File</Label>
                    <Input
                      id="new-episode-file"
                      value={newEpisode.file}
                      onChange={(e) => handleNewEpisodeChange("file", e.target.value)}
                      placeholder="Path to media file"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="new-episode-breaks">Commercial Breaks</Label>
                    <Input
                      id="new-episode-breaks"
                      value={newEpisode.breaks}
                      onChange={(e) => handleNewEpisodeChange("breaks", e.target.value)}
                      placeholder="00:03:21.00, 00:15:45.00, etc."
                    />
                    <p className="text-xs text-gray-500">Separate timecodes with commas</p>
                  </div>

                  <Button onClick={handleAddEpisode} disabled={!newEpisode.title || !newEpisode.file}>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Episode
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(editedItem)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
